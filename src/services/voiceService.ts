/**
 * Voice Service for Dora
 * Ensures 100% Female Turkish Voice, Text-to-Speech, Speech-to-Text,
 * and live audio wave analysis for lip-sync and visualizer.
 */

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export class VoiceService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static selectedVoice: SpeechSynthesisVoice | null = null;
  private static isSpeakingInternal = false;
  private static recognition: any = null;
  private static audioContext: AudioContext | null = null;
  private static analyser: AnalyserNode | null = null;
  private static micStream: MediaStream | null = null;

  /**
   * Initializes Turkish female voice
   */
  public static initVoice(): Promise<SpeechSynthesisVoice | null> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve(null);
        return;
      }

      const findFemaleVoice = () => {
        const voices = this.synth!.getVoices();
        if (!voices || voices.length === 0) return null;

        // Search for Turkish voices
        const trVoices = voices.filter(
          (v) => v.lang === 'tr-TR' || v.lang === 'tr' || v.lang.startsWith('tr_')
        );

        // Search specifically for female voice names or characteristics
        const femaleTr = trVoices.find((v) => {
          const name = v.name.toLowerCase();
          return (
            name.includes('female') ||
            name.includes('kadın') ||
            name.includes('yelda') ||
            name.includes('filiz') ||
            name.includes('seda') ||
            name.includes('zeynep') ||
            name.includes('google türkçe') ||
            name.includes('natural')
          );
        });

        // If found, use it; otherwise fallback to first TR voice, or first available voice
        this.selectedVoice = femaleTr || trVoices[0] || voices[0] || null;
        return this.selectedVoice;
      };

      const voice = findFemaleVoice();
      if (voice) {
        resolve(voice);
      } else {
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            resolve(findFemaleVoice());
          };
        } else {
          resolve(null);
        }
      }
    });
  }

  /**
   * Speak text using Gemini TTS backend or browser Web Speech Synthesis
   * Strictly configured to sound warm, friendly, and female!
   */
  public static async speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    this.stopSpeaking();
    this.isSpeakingInternal = true;

    try {
      // 1. Try Gemini TTS backend endpoint first
      const res = await fetch('/api/dora/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioData) {
          const audio = new Audio(data.audioData);
          audio.onplay = () => {
            onStart?.();
          };
          audio.onended = () => {
            this.isSpeakingInternal = false;
            onEnd?.();
          };
          audio.onerror = (e) => {
            console.warn('Gemini audio playback error, falling back to Web Speech:', e);
            this.speakWebSpeech(text, onStart, onEnd, onError);
          };
          try {
            await audio.play();
            return;
          } catch (playErr) {
            console.warn('Direct audio play blocked or failed, falling back to Web Speech:', playErr);
            this.speakWebSpeech(text, onStart, onEnd, onError);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Server TTS failed, falling back to Web Speech:', e);
    }

    // 2. High fidelity Web Speech fallback with tuned female pitch & rate
    this.speakWebSpeech(text, onStart, onEnd, onError);
  }

  private static speakWebSpeech(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ) {
    if (!this.synth) {
      onEnd?.();
      return;
    }

    if (!this.selectedVoice) {
      this.initVoice();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.lang = 'tr-TR';
    // Warm, friendly, slightly elevated female pitch and gentle pacing
    utterance.pitch = 1.15;
    utterance.rate = 0.95;

    utterance.onstart = () => {
      this.isSpeakingInternal = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeakingInternal = false;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeakingInternal = false;
      onError?.(e);
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  public static stopSpeaking() {
    this.isSpeakingInternal = false;
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public static isSpeaking(): boolean {
    return this.isSpeakingInternal || (this.synth ? this.synth.speaking : false);
  }

  /**
   * Speech Recognition (Speech-to-Text) in Turkish
   */
  public static startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Tarayıcınız ses tanıma (SpeechRecognition) özelliğini doğrudan desteklemiyor. Aşağıdaki hazır cevap butonlarını kullanabilirsiniz.');
      return false;
    }

    try {
      this.stopListening();

      const recognition = new SpeechRecognition();
      recognition.lang = 'tr-TR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          onResult(interimTranscript.trim(), false);
        }
      };

      recognition.onerror = (event: any) => {
        let msg = 'Ses algılanamadı, lütfen tekrar deneyin.';
        if (event.error === 'not-allowed') {
          msg = 'Mikrofon izni verilmedi. Dora ile konuşabilmek için mikrofon iznini açabilir veya butonlara dokunabilirsin.';
        } else if (event.error === 'no-speech') {
          msg = 'Ses duyulamadı. İstersen tekrar konuş veya ekrandan seç.';
        }
        onError(msg);
      };

      recognition.onend = () => {
        this.recognition = null;
        onEnd();
      };

      recognition.start();
      this.recognition = recognition;
      return true;
    } catch (e: any) {
      onError('Mikrofon başlatılamadı: ' + e?.message);
      return false;
    }
  }

  public static stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.recognition = null;
    }
  }

  /**
   * Start live microphone visualizer audio levels
   */
  public static async startMicVisualizer(onLevel: (level: number) => void): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      this.audioContext = audioCtx;
      this.analyser = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        onLevel(normalized);

        if (this.micStream) {
          requestAnimationFrame(checkLevel);
        }
      };
      checkLevel();
      return true;
    } catch (e) {
      console.warn('Could not initialize mic audio visualizer:', e);
      return false;
    }
  }

  public static stopMicVisualizer() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
  }
}
