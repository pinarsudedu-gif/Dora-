import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  LayoutDashboard,
  HeartHandshake,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  Lock,
  ArrowLeft,
  School,
} from 'lucide-react';
import { DoraRobot } from './DoraRobot';
import { VoiceService } from '../services/voiceService';
import { Student, ChatMessage, Report } from '../types';

interface StudentScreenProps {
  currentStudent: Student;
  onOpenTeacherPanel: () => void;
  onReportGenerated: (report: Report) => void;
  onSelectAnotherStudent?: () => void;
  onGoToEntry?: () => void;
}

export const StudentScreen: React.FC<StudentScreenProps> = ({
  currentStudent,
  onOpenTeacherPanel,
  onReportGenerated,
  onSelectAnotherStudent,
  onGoToEntry,
}) => {
  // Conversational state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [doraState, setDoraState] = useState<
    'idle' | 'greeting' | 'speaking' | 'listening' | 'thinking' | 'empathy' | 'celebrate'
  >('greeting');
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [initialMoodChoice, setInitialMoodChoice] = useState<string | null>(null);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Initialize Dora & start the conversation
  useEffect(() => {
    VoiceService.initVoice();

    // Start with Dora's official introductory question from prompt
    const initialGreeting =
      'Merhaba! Ben Dora. Bugün seninle biraz sohbet etmek istiyorum. Burada seni dinlemek için varım. Hazırsan başlayalım mı?';

    const welcomeMsg: ChatMessage = {
      id: `msg-dora-0`,
      role: 'dora',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: ['Evet, hazırım!', 'Biraz çekiniyorum', 'Başlayalım'],
      emotion: 'happy',
    };

    setMessages([welcomeMsg]);
    setCurrentOptions(welcomeMsg.options || []);
    setDoraState('greeting');

    // Speak initial greeting with female voice
    if (!isMuted) {
      speakDora(initialGreeting, 'greeting');
    }

    return () => {
      VoiceService.stopSpeaking();
      VoiceService.stopListening();
      VoiceService.stopMicVisualizer();
    };
  }, []);

  // Scroll transcript down
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [messages, liveTranscript]);

  // Voice output wrapper
  const speakDora = (text: string, emotionState: any = 'speaking') => {
    if (isMuted) return;
    setDoraState(emotionState);
    setIsSpeaking(true);

    VoiceService.speak(
      text,
      () => {
        setIsSpeaking(true);
      },
      () => {
        setIsSpeaking(false);
        // After speaking finishes, auto-prompt listening
        setDoraState('listening');
        startMicrophoneListening();
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsSpeaking(false);
        setDoraState('idle');
      }
    );
  };

  // Start microphone
  const startMicrophoneListening = async () => {
    if (isSessionComplete || isSpeaking) return;
    setMicError(null);
    setLiveTranscript('');

    // Start audio frequency visualizer
    await VoiceService.startMicVisualizer((level) => {
      setAudioLevel(level);
    });

    setIsListening(true);
    setDoraState('listening');

    const started = VoiceService.startListening(
      (text, isFinal) => {
        setLiveTranscript(text);
        if (isFinal) {
          handleStudentResponse(text);
        }
      },
      (errMessage) => {
        setMicError(errMessage);
        setIsListening(false);
        VoiceService.stopMicVisualizer();
        setDoraState('idle');
      },
      () => {
        setIsListening(false);
        VoiceService.stopMicVisualizer();
      }
    );

    if (!started) {
      setIsListening(false);
      VoiceService.stopMicVisualizer();
    }
  };

  const stopMicrophoneListening = () => {
    VoiceService.stopListening();
    VoiceService.stopMicVisualizer();
    setIsListening(false);
    setDoraState('idle');
  };

  // Handle student spoken or tapped response
  const handleStudentResponse = async (answerText: string) => {
    if (!answerText.trim() || isSpeaking) return;

    // Stop listening while processing
    stopMicrophoneListening();

    const studentMsg: ChatMessage = {
      id: `msg-student-${Date.now()}`,
      role: 'student',
      text: answerText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, studentMsg];
    setMessages(newHistory);
    setLiveTranscript('');
    setCurrentOptions([]);
    setDoraState('thinking');

    const currentTurn = turnCount + 1;
    setTurnCount(currentTurn);

    // Save mood if in early turn
    if (currentTurn === 1) {
      const lower = answerText.toLowerCase();
      if (lower.includes('çok iyi')) setInitialMoodChoice('Çok İyi');
      else if (lower.includes('iyi')) setInitialMoodChoice('İyi');
      else if (lower.includes('çok kötü')) setInitialMoodChoice('Çok Kötü');
      else if (lower.includes('kötü')) setInitialMoodChoice('Kötü');
    }

    // Call server AI endpoint
    try {
      const res = await fetch('/api/dora/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: currentStudent.name,
          studentGrade: currentStudent.grade,
          messages: newHistory,
          userMessage: answerText,
          turnCount: currentTurn,
        }),
      });

      const data = await res.json();
      const doraReply = data.reply;
      const doraOptions = data.options || [];
      const doraEmotion = data.emotion || 'happy';
      const complete = data.isComplete || currentTurn >= 7;

      const doraMsg: ChatMessage = {
        id: `msg-dora-${Date.now()}`,
        role: 'dora',
        text: doraReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: doraOptions,
        emotion: doraEmotion,
      };

      setMessages((prev) => [...prev, doraMsg]);
      setCurrentOptions(doraOptions);

      // Check if session completed
      if (complete) {
        finishConversation([...newHistory, doraMsg]);
      } else {
        speakDora(doraReply, doraEmotion);
      }
    } catch (e) {
      console.error('Chat error:', e);
      // Fallback response
      const fallbackReply =
        'Seni çok iyi anlıyorum. Okulda seninle dalga geçen veya seni rahatsız eden başka durumlar da oluyor mu?';
      const fallbackMsg: ChatMessage = {
        id: `msg-dora-${Date.now()}`,
        role: 'dora',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        options: ['Evet, oluyor', 'Hayır, başka bir şey yok', 'Bazen oluyor'],
        emotion: 'empathy',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setCurrentOptions(fallbackMsg.options || []);
      speakDora(fallbackReply, 'empathy');
    }
  };

  // Finish conversation & generate official report
  const finishConversation = async (finalMessages: ChatMessage[]) => {
    setIsSessionComplete(true);
    setDoraState('celebrate');
    stopMicrophoneListening();

    // Trigger celebratory confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#0284c7', '#34d399', '#f472b6', '#fbbf24'],
    });

    const completionText =
      'Harikasın! Bana tüm bunları anlattığın için çok teşekkür ederim. Sen çok değerlisin ve harika bir arkadaşsın. Şimdi bu bilgileri rehber öğretmenine güvenle iletiyorum.';
    speakDora(completionText, 'celebrate');

    // Generate report
    setIsGeneratingReport(true);
    try {
      const transcript = finalMessages.map((m) => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp,
      }));

      const res = await fetch('/api/dora/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: currentStudent,
          transcript,
          generalMood: initialMoodChoice || 'Kötü',
        }),
      });

      const report: Report = await res.json();

      // Save report in backend
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });

      onReportGenerated(report);
    } catch (err) {
      console.error('Failed to create report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Restart dialogue
  const handleRestart = () => {
    VoiceService.stopSpeaking();
    VoiceService.stopListening();
    setTurnCount(0);
    setIsSessionComplete(false);
    setDoraState('greeting');
    const startText =
      'Merhaba! Ben Dora. Bugün seninle biraz sohbet etmek istiyorum. Burada seni dinlemek için varım. Hazırsan başlayalım mı?';
    const firstMsg: ChatMessage = {
      id: `msg-dora-${Date.now()}`,
      role: 'dora',
      text: startText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: ['Evet hazırım!', 'Biraz çekiniyorum', 'Başlayalım'],
      emotion: 'happy',
    };
    setMessages([firstMsg]);
    setCurrentOptions(firstMsg.options || []);
    speakDora(startText, 'greeting');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between font-['Comfortaa',sans-serif]">
      {/* 
        COLOR CONCEPT: DEFINITELY BLUE!
        Deep vibrant blues on the outer canvas transitioning to soft luminous sky/cyan in center
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, #38bdf8 0%, #0284c7 35%, #0369a1 70%, #082f49 100%)',
        }}
      />

      {/* Floating Animated Ambient Lights & Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft Glowing Blue Orbs */}
        <div className="absolute top-12 left-10 w-72 h-72 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-12 w-96 h-96 rounded-full bg-sky-200/20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl animate-pulse" style={{ animationDelay: '2.5s' }} />

        {/* Small Floating Stars / Particles */}
        {[
          { top: '15%', left: '18%', size: 'w-2 h-2', delay: '0s' },
          { top: '25%', left: '80%', size: 'w-3 h-3', delay: '1s' },
          { top: '65%', left: '12%', size: 'w-2.5 h-2.5', delay: '2s' },
          { top: '75%', left: '85%', size: 'w-2 h-2', delay: '0.5s' },
          { top: '40%', left: '92%', size: 'w-3 h-3', delay: '1.8s' },
          { top: '55%', left: '6%', size: 'w-2 h-2', delay: '2.2s' },
        ].map((star, idx) => (
          <div
            key={idx}
            className={`absolute ${star.size} bg-white rounded-full opacity-70 animate-ping`}
            style={{
              top: star.top,
              left: star.left,
              animationDuration: '3.5s',
              animationDelay: star.delay,
            }}
          />
        ))}

        {/* Floating Playful Geometric Rings */}
        <div className="absolute top-20 right-1/4 w-28 h-28 border border-white/20 rounded-full pointer-events-none -rotate-12 animate-spin" style={{ animationDuration: '40s' }} />
        <div className="absolute bottom-32 left-16 w-36 h-36 border-2 border-cyan-200/20 rounded-full pointer-events-none" />
      </div>

      {/* TOP BAR: Student Welcome, Dora Voice Indicator & Counselor Switch */}
      <header className="relative z-20 px-4 sm:px-8 py-4 flex items-center justify-between">
        {/* Student Badge */}
        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-lg text-white">
          <img
            src={currentStudent.avatar}
            alt={currentStudent.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-cyan-200 shadow"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wide">{currentStudent.name}</span>
              <span className="bg-cyan-300 text-blue-900 font-bold text-xs px-2 py-0.5 rounded-full">
                {currentStudent.grade}-{currentStudent.section}
              </span>
            </div>
            <p className="text-xs text-sky-100 flex items-center gap-1 font-sans">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
              Dora Güvenli Sohbet Alanı
            </p>
          </div>
          {onSelectAnotherStudent && (
            <button
              onClick={onSelectAnotherStudent}
              className="ml-2 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg text-cyan-100 transition-colors"
              title="Öğrenciyi Değiştir"
            >
              Değiştir
            </button>
          )}
        </div>

        {/* Center: Brand Pill */}
        <div className="hidden md:flex items-center gap-2 bg-blue-950/40 backdrop-blur-md px-5 py-2 rounded-full border border-cyan-400/30 text-white shadow-md">
          <Sparkles className="w-4 h-4 text-cyan-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-bold text-sm tracking-wider text-cyan-100">DORA ARKADAŞIN</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          <span className="text-[11px] text-cyan-300 font-sans font-medium">Kadın Ses Profili Aktif</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Return to Entry Button */}
          {onGoToEntry && (
            <button
              onClick={onGoToEntry}
              className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white transition-all shadow hover:scale-105 text-xs font-sans font-semibold flex items-center gap-1.5"
              title="Giriş Ekranına Dön"
            >
              <School className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">Giriş Ekranı</span>
            </button>
          )}

          {/* Mute Voice Toggle */}
          <button
            onClick={() => {
              if (!isMuted) {
                VoiceService.stopSpeaking();
              }
              setIsMuted(!isMuted);
            }}
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white transition-all shadow hover:scale-105"
            title={isMuted ? 'Dora Sesini Aç' : 'Dora Sesini Kapat'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-amber-300" /> : <Volume2 className="w-5 h-5 text-cyan-200" />}
          </button>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white transition-all shadow hover:scale-105"
            title="Sohbeti Baştan Başlat"
          >
            <RotateCcw className="w-5 h-5 text-cyan-200" />
          </button>

          {/* Switch to Teacher Panel */}
          <button
            onClick={onOpenTeacherPanel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/70 hover:bg-slate-900/90 backdrop-blur-md border border-cyan-400/40 text-cyan-200 hover:text-white transition-all shadow-lg hover:scale-105 text-xs font-sans font-semibold"
            title="Rehber Öğretmen Paneli (Şifreli)"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Öğretmen Paneli</span>
          </button>
        </div>
      </header>

      {/* CENTER: Big 3D Dora Robot & Speech Bubble */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 max-w-4xl mx-auto w-full">
        {/* Active Speech / Question Card from Dora */}
        <div className="w-full max-w-2xl mb-4 sm:mb-6">
          {messages.length > 0 && (
            <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-cyan-200/80 transition-all duration-300 animate-in fade-in zoom-in-95">
              {/* Speaking Voice Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 animate-ping" />
                  <span className="text-xs font-bold text-sky-800 tracking-wider uppercase font-sans">
                    Dora Seni Dinliyor
                  </span>
                </div>
                {isSpeaking && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full font-sans animate-pulse">
                    <Volume2 className="w-3.5 h-3.5" /> Dora Konuşuyor...
                  </span>
                )}
              </div>

              {/* Latest Dora Message */}
              <p className="text-lg sm:text-2xl font-bold text-slate-800 leading-snug tracking-normal">
                {messages[messages.length - 1].role === 'dora'
                  ? messages[messages.length - 1].text
                  : messages.filter((m) => m.role === 'dora').slice(-1)[0]?.text || ''}
              </p>

              {/* Speech bubble pointer pointing down to Dora */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rotate-45 border-r-4 border-b-4 border-cyan-200/80" />
            </div>
          )}
        </div>

        {/* 3D Dora Character */}
        <div className="my-2 sm:my-3">
          <DoraRobot
            state={doraState}
            audioLevel={audioLevel}
            isSpeaking={isSpeaking}
            isListening={isListening}
          />
        </div>

        {/* Live Speech Recognition Transcript Indicator */}
        {liveTranscript && (
          <div className="mt-3 px-5 py-2.5 bg-emerald-500/90 text-white rounded-full font-bold text-sm shadow-lg border border-emerald-300 backdrop-blur-md flex items-center gap-2 animate-pulse">
            <Mic className="w-4 h-4 text-emerald-100" />
            <span>&ldquo;{liveTranscript}&rdquo;</span>
          </div>
        )}

        {/* Child Friendly Microphone Status / Guidance */}
        {micError && (
          <div className="mt-3 px-4 py-2 bg-amber-400 text-amber-950 rounded-2xl text-xs font-sans font-semibold shadow flex items-center gap-2 max-w-md text-center">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>{micError}</span>
          </div>
        )}
      </main>

      {/* BOTTOM CONTROLS: Microphone Button & Spoken Choice Chips */}
      <footer className="relative z-20 px-4 sm:px-8 pb-6 pt-2 flex flex-col items-center">
        {/* Child Interaction Row */}
        {!isSessionComplete ? (
          <div className="w-full max-w-2xl flex flex-col items-center gap-4">
            {/* Suggested Spoken / Tap Chips */}
            {currentOptions.length > 0 && (
              <div className="w-full flex flex-wrap items-center justify-center gap-2.5">
                {currentOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleStudentResponse(opt)}
                    disabled={isSpeaking}
                    className="px-5 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-blue-900 font-bold text-sm sm:text-base shadow-lg border-2 border-cyan-300/80 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 hover:shadow-cyan-300/50"
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Glowing Big Voice Record Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => {
                  if (isListening) {
                    stopMicrophoneListening();
                  } else {
                    startMicrophoneListening();
                  }
                }}
                disabled={isSpeaking}
                className={`relative group w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  isListening
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-110 shadow-emerald-400/80 ring-8 ring-emerald-300/40'
                    : isSpeaking
                    ? 'bg-slate-400 opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 hover:scale-105 shadow-cyan-400/70 hover:shadow-cyan-300/90'
                }`}
                title={isListening ? 'Dinlemeyi Durdur' : 'Konuşmak İçin Dokun'}
              >
                {/* Visual pulse rings when listening */}
                {isListening && (
                  <span className="absolute -inset-3 rounded-full border-2 border-emerald-300 animate-ping opacity-75 pointer-events-none" />
                )}

                {isListening ? (
                  <Mic className="w-10 h-10 text-white animate-pulse" />
                ) : (
                  <Mic className="w-10 h-10 text-white drop-shadow" />
                )}
              </button>

              <span className="mt-2 text-xs sm:text-sm font-bold text-white tracking-wide font-sans drop-shadow-sm flex items-center gap-1.5">
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                    Dora Seni Dinliyor... Konuşabilirsin!
                  </>
                ) : isSpeaking ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                    Lütfen Dora&apos;yı Dinle...
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-cyan-200" />
                    Mikrofona Dokun ve Konuş
                  </>
                )}
              </span>
            </div>
          </div>
        ) : (
          /* Session Completed Summary Banner */
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-4 border-emerald-300 text-center flex flex-col items-center gap-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
              Görüşme Başarıyla Tamamlandı!
            </h3>
            <p className="text-sm font-sans text-slate-600 max-w-md">
              Benimle hissettiklerini paylaştığın için çok teşekkür ederim {currentStudent.name}. Sen her zaman değerlisin! Görüşme analizin tamamlandı ve <strong>Rehber Öğretmen Paneli</strong>&apos;ne güvenle iletildi.
            </p>
            {isGeneratingReport ? (
              <div className="flex items-center gap-2 text-xs font-sans text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full font-bold">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-500" />
                Rehberlik Raporu Hazırlanıyor ve Panele Gönderiliyor...
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs sm:text-sm shadow transition-all"
                >
                  Yeniden Sohbet Et
                </button>
                {onGoToEntry && (
                  <button
                    onClick={onGoToEntry}
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-cyan-400 text-blue-900 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4 text-cyan-600" />
                    Yeni Öğrenci Girişi
                  </button>
                )}
                <button
                  onClick={onOpenTeacherPanel}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-cyan-200 font-bold text-xs sm:text-sm shadow transition-all flex items-center gap-1.5"
                  title="Rehber Öğretmen Paneline Geç"
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Öğretmen Paneli
                </button>
              </div>
            )}
          </div>
        )}

        {/* Small Privacy & Trust Notice */}
        <p className="mt-4 text-[11px] text-cyan-100/80 font-sans tracking-wide text-center">
          Dora ile yaptığın konuşmalar gizlidir ve yalnızca okulunun rehber öğretmeni tarafından senin iyiliğin için değerlendirilir.
        </p>
      </footer>
    </div>
  );
};
