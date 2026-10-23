import React, { useEffect, useState } from 'react';

interface DoraRobotProps {
  state: 'idle' | 'greeting' | 'speaking' | 'listening' | 'thinking' | 'empathy' | 'celebrate' | 'happy';
  audioLevel?: number; // 0 to 100
  isSpeaking?: boolean;
  isListening?: boolean;
  className?: string;
}

export const DoraRobot: React.FC<DoraRobotProps> = ({
  state,
  audioLevel = 0,
  isSpeaking = false,
  isListening = false,
  className = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyeLookX, setEyeLookX] = useState(0);
  const [eyeLookY, setEyeLookY] = useState(0);
  const [mouthPhase, setMouthPhase] = useState(0);

  // Periodic natural eye blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 220);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Pupil movement when listening or idle
  useEffect(() => {
    if (state === 'listening') {
      const listenInterval = setInterval(() => {
        setEyeLookX((prev) => (prev === 0 ? 3 : prev === 3 ? -3 : 0));
        setEyeLookY(2);
      }, 1200);
      return () => clearInterval(listenInterval);
    } else if (state === 'thinking') {
      setEyeLookX(-4);
      setEyeLookY(-6);
    } else {
      setEyeLookX(0);
      setEyeLookY(0);
    }
  }, [state]);

  // Speaking mouth cycle
  useEffect(() => {
    if (isSpeaking || state === 'speaking') {
      const mouthInterval = setInterval(() => {
        setMouthPhase((prev) => (prev + 1) % 4);
      }, 140);
      return () => clearInterval(mouthInterval);
    } else {
      setMouthPhase(0);
    }
  }, [isSpeaking, state]);

  // Audio wave scale factor for pulse
  const pulseScale = isListening ? 1 + (audioLevel / 100) * 0.08 : 1;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Dynamic Aura Glow behind Dora */}
      <div
        className={`absolute -inset-10 rounded-full blur-3xl transition-all duration-700 pointer-events-none opacity-60 ${
          state === 'celebrate'
            ? 'bg-gradient-to-tr from-amber-400 via-pink-400 to-cyan-300 animate-pulse'
            : state === 'thinking'
            ? 'bg-gradient-to-tr from-cyan-400 via-indigo-500 to-blue-400 animate-pulse'
            : state === 'empathy'
            ? 'bg-gradient-to-tr from-teal-400 via-sky-300 to-indigo-400'
            : isListening
            ? 'bg-gradient-to-tr from-cyan-400 via-emerald-300 to-blue-500'
            : 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600'
        }`}
        style={{
          transform: `scale(${1 + (audioLevel / 100) * 0.15})`,
        }}
      />

      {/* Main 3D Floating Robot Rig */}
      <div
        className="relative transition-transform duration-500 flex flex-col items-center"
        style={{
          transform: `scale(${pulseScale}) translateY(${
            state === 'thinking' ? '-8px' : isSpeaking ? '-4px' : '0px'
          })`,
        }}
      >
        {/* Antenna */}
        <div className="relative flex flex-col items-center -mb-2 z-10">
          {/* Antenna Glowing Orb */}
          <div
            className={`w-7 h-7 rounded-full shadow-lg border-2 border-white transition-all duration-300 relative flex items-center justify-center ${
              state === 'thinking'
                ? 'bg-gradient-to-br from-amber-300 to-yellow-500 animate-spin shadow-yellow-300/80 scale-125'
                : isSpeaking
                ? 'bg-gradient-to-br from-cyan-300 to-blue-400 animate-bounce shadow-cyan-300/80 scale-110'
                : isListening
                ? 'bg-gradient-to-br from-emerald-300 to-teal-400 shadow-teal-300/80 scale-110'
                : 'bg-gradient-to-br from-cyan-300 to-teal-300 shadow-cyan-400/50'
            }`}
          >
            {/* Core light reflection */}
            <div className="w-2.5 h-2.5 bg-white rounded-full opacity-90 absolute top-1 left-1" />
            {/* Wave rings when speaking or listening */}
            {(isSpeaking || isListening) && (
              <span className="absolute -inset-2 rounded-full border border-cyan-300 animate-ping opacity-75" />
            )}
          </div>
          {/* Antenna Stem with 3D metallic gradient */}
          <div className="w-2.5 h-6 bg-gradient-to-r from-slate-200 via-cyan-100 to-slate-300 rounded-t shadow-inner border border-slate-300" />
        </div>

        {/* Robot Head / Monitor Body */}
        <div className="relative flex items-center justify-center">
          {/* Left Ear Speaker / Headphone */}
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-6 h-16 bg-gradient-to-r from-blue-700 via-cyan-600 to-slate-200 rounded-l-2xl shadow-lg border-y border-l border-cyan-300/60 flex items-center justify-center">
            <div
              className={`w-2.5 h-10 rounded-full transition-all duration-200 ${
                isListening
                  ? 'bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse'
                  : isSpeaking
                  ? 'bg-cyan-300 shadow-md shadow-cyan-300'
                  : 'bg-cyan-600/50'
              }`}
            />
          </div>

          {/* Right Ear Speaker / Headphone */}
          <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-6 h-16 bg-gradient-to-l from-blue-700 via-cyan-600 to-slate-200 rounded-r-2xl shadow-lg border-y border-r border-cyan-300/60 flex items-center justify-center">
            <div
              className={`w-2.5 h-10 rounded-full transition-all duration-200 ${
                isListening
                  ? 'bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse'
                  : isSpeaking
                  ? 'bg-cyan-300 shadow-md shadow-cyan-300'
                  : 'bg-cyan-600/50'
              }`}
            />
          </div>

          {/* Outer Monitor Chassis (Chubby, Rounded, 3D Chamfer) */}
          <div
            className="w-72 sm:w-80 h-56 sm:h-64 rounded-3xl p-3 sm:p-4 shadow-2xl relative transition-all duration-300 border-2 border-cyan-200/50"
            style={{
              background:
                'linear-gradient(145deg, #e0f2fe 0%, #7dd3fc 25%, #0284c7 65%, #0369a1 100%)',
              boxShadow:
                '0 20px 40px -10px rgba(2, 132, 199, 0.5), inset 0 3px 6px rgba(255, 255, 255, 0.8), inset 0 -6px 12px rgba(3, 105, 161, 0.6)',
            }}
          >
            {/* Glossy top-left chassis reflection */}
            <div className="absolute top-2 left-6 right-6 h-4 bg-gradient-to-b from-white/70 to-transparent rounded-t-2xl pointer-events-none" />

            {/* Inner Dark Navy Glossy Monitor Screen */}
            <div
              className="w-full h-full rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border-2 border-cyan-400/30"
              style={{
                background:
                  'radial-gradient(ellipse at center, #0f172a 0%, #030712 100%)',
                boxShadow:
                  'inset 0 0 25px rgba(6, 182, 212, 0.35), inset 0 2px 4px rgba(255,255,255,0.1)',
              }}
            >
              {/* Scanline CRT glass overlay */}
              <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, #38bdf8 2px, #38bdf8 4px)',
                }}
              />

              {/* Diagonal Glass Sheen */}
              <div
                className="absolute -top-24 -left-20 w-80 h-96 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -rotate-45 pointer-events-none"
              />

              {/* EYES & FACE CONTAINER */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                {/* Cheeks & Eyes Row */}
                <div className="flex items-center gap-6 sm:gap-8">
                  {/* Left Cheek Glow */}
                  <div
                    className={`w-4 h-2.5 rounded-full blur-xs transition-opacity duration-300 ${
                      state === 'empathy' || state === 'celebrate' || state === 'greeting'
                        ? 'bg-rose-400 opacity-90'
                        : 'bg-rose-500 opacity-40'
                    }`}
                  />

                  {/* Left Eye */}
                  <div
                    className="relative w-14 sm:w-16 h-14 sm:h-16 rounded-full flex items-center justify-center transition-transform duration-200"
                    style={{
                      transform: `translate(${eyeLookX}px, ${eyeLookY}px)`,
                    }}
                  >
                    {isBlinking ? (
                      /* Blinking Eyelid */
                      <div className="w-12 h-1 bg-cyan-300 rounded-full shadow-lg shadow-cyan-300" />
                    ) : state === 'celebrate' || (state === 'happy' && !isSpeaking) ? (
                      /* Cheerful Crescent Eye */
                      <svg
                        className="w-12 h-12 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      >
                        <path d="M4 14c2-4 6-6 10-6s8 2 10 6" />
                      </svg>
                    ) : (
                      /* Big Luminous Anime Eye */
                      <div
                        className="w-12 sm:w-14 h-12 sm:h-14 rounded-full relative overflow-hidden flex items-center justify-center border-2 border-cyan-300"
                        style={{
                          background:
                            'radial-gradient(circle at 35% 35%, #67e8f9 0%, #06b6d4 40%, #0369a1 80%, #082f49 100%)',
                          boxShadow: '0 0 16px rgba(6, 182, 212, 0.9)',
                        }}
                      >
                        {/* Pupil */}
                        <div className="w-7 h-7 bg-slate-950 rounded-full flex items-center justify-center relative">
                          {/* Inner sparkle */}
                          <div className="w-2.5 h-2.5 bg-cyan-200 rounded-full blur-[0.5px]" />
                        </div>
                        {/* Big Catchlight reflection */}
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1.5 left-2 shadow-sm" />
                        {/* Secondary small catchlight */}
                        <div className="w-2 h-2 bg-white rounded-full absolute bottom-2 right-2.5 opacity-80" />
                      </div>
                    )}
                  </div>

                  {/* Right Eye */}
                  <div
                    className="relative w-14 sm:w-16 h-14 sm:h-16 rounded-full flex items-center justify-center transition-transform duration-200"
                    style={{
                      transform: `translate(${eyeLookX}px, ${eyeLookY}px)`,
                    }}
                  >
                    {isBlinking ? (
                      /* Blinking Eyelid */
                      <div className="w-12 h-1 bg-cyan-300 rounded-full shadow-lg shadow-cyan-300" />
                    ) : state === 'celebrate' || (state === 'happy' && !isSpeaking) ? (
                      /* Cheerful Crescent Eye */
                      <svg
                        className="w-12 h-12 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      >
                        <path d="M4 14c2-4 6-6 10-6s8 2 10 6" />
                      </svg>
                    ) : (
                      /* Big Luminous Anime Eye */
                      <div
                        className="w-12 sm:w-14 h-12 sm:h-14 rounded-full relative overflow-hidden flex items-center justify-center border-2 border-cyan-300"
                        style={{
                          background:
                            'radial-gradient(circle at 35% 35%, #67e8f9 0%, #06b6d4 40%, #0369a1 80%, #082f49 100%)',
                          boxShadow: '0 0 16px rgba(6, 182, 212, 0.9)',
                        }}
                      >
                        {/* Pupil */}
                        <div className="w-7 h-7 bg-slate-950 rounded-full flex items-center justify-center relative">
                          {/* Inner sparkle */}
                          <div className="w-2.5 h-2.5 bg-cyan-200 rounded-full blur-[0.5px]" />
                        </div>
                        {/* Big Catchlight reflection */}
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1.5 left-2 shadow-sm" />
                        {/* Secondary small catchlight */}
                        <div className="w-2 h-2 bg-white rounded-full absolute bottom-2 right-2.5 opacity-80" />
                      </div>
                    )}
                  </div>

                  {/* Right Cheek Glow */}
                  <div
                    className={`w-4 h-2.5 rounded-full blur-xs transition-opacity duration-300 ${
                      state === 'empathy' || state === 'celebrate' || state === 'greeting'
                        ? 'bg-rose-400 opacity-90'
                        : 'bg-rose-500 opacity-40'
                    }`}
                  />
                </div>

                {/* Animated Mouth */}
                <div className="h-8 flex items-center justify-center">
                  {isSpeaking || state === 'speaking' ? (
                    /* Phoneme talking animation */
                    mouthPhase === 0 ? (
                      <div className="w-8 h-4 rounded-full bg-cyan-300 border border-white shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
                    ) : mouthPhase === 1 ? (
                      <div className="w-6 h-5 rounded-3xl bg-cyan-200 border border-white shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
                    ) : mouthPhase === 2 ? (
                      <div className="w-10 h-3 rounded-full bg-cyan-300 border border-white shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
                    ) : (
                      <div className="w-7 h-6 rounded-2xl bg-cyan-100 border border-white shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
                    )
                  ) : state === 'listening' ? (
                    /* Attentive, soft listening mouth line */
                    <div className="w-7 h-1.5 bg-cyan-300/80 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
                  ) : state === 'empathy' ? (
                    /* Gentle, comforting mouth */
                    <div className="w-8 h-2 border-b-2 border-teal-300 rounded-b-full shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                  ) : (
                    /* Sweet resting smile */
                    <svg
                      className="w-8 h-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                      viewBox="0 0 24 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M4 2c2 6 8 8 16 0" />
                    </svg>
                  )}
                </div>

                {/* Audio wave frequency bars inside screen when listening */}
                {isListening && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {[12, 24, 18, 30, 16, 26, 14].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(4, (h * (audioLevel + 20)) / 100)}px`,
                          opacity: 0.8 + (audioLevel / 100) * 0.2,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Status pill on screen footer */}
              <div className="absolute bottom-2 px-3 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-[10px] font-medium text-cyan-300 tracking-wider flex items-center gap-1.5 shadow-sm">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isListening
                      ? 'bg-emerald-400 animate-ping'
                      : isSpeaking
                      ? 'bg-cyan-300 animate-pulse'
                      : 'bg-cyan-400'
                  }`}
                />
                {state === 'thinking'
                  ? 'DORA DÜŞÜNÜYOR...'
                  : isListening
                  ? 'SENİ DİNLİYORUM'
                  : isSpeaking
                  ? 'DORA KONUŞUYOR'
                  : 'DORA HAZIR'}
              </div>
            </div>
          </div>

          {/* Left Cute Robot Arm */}
          <div className="absolute -left-10 bottom-6 w-9 h-14 flex flex-col items-center z-0">
            <div className="w-5 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-md border border-cyan-200/50" />
            <div className="w-6 h-6 bg-white rounded-full -mt-1 shadow-md border border-cyan-300 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full" />
            </div>
          </div>

          {/* Right Waving Robot Arm (Active greeting or rested) */}
          <div
            className={`absolute -right-10 bottom-6 w-9 h-14 flex flex-col items-center z-0 origin-bottom transition-transform duration-500 ${
              state === 'greeting' || state === 'celebrate'
                ? 'animate-bounce -rotate-45'
                : 'rotate-0'
            }`}
          >
            <div className="w-5 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full shadow-md border border-cyan-200/50" />
            <div className="w-6 h-6 bg-white rounded-full -mt-1 shadow-md border border-cyan-300 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Robot Neck & 3D Pedestal Base */}
        <div className="relative flex flex-col items-center -mt-2">
          {/* Metallic Neck */}
          <div className="w-14 h-4 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-t shadow-inner border-x border-slate-400" />
          {/* Rounded Futuristic Pedestal Base */}
          <div
            className="w-36 h-9 rounded-full shadow-xl border-t border-cyan-300 flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #38bdf8 0%, #0369a1 70%, #0f172a 100%)',
            }}
          >
            <div className="w-24 h-1.5 bg-cyan-300/60 rounded-full blur-[1px]" />
          </div>
        </div>

        {/* 3D Floor Shadow and Holographic Audio Wave Ring */}
        <div className="relative mt-2 flex items-center justify-center">
          {/* Ground Soft Shadow */}
          <div
            className="w-48 h-6 bg-sky-950/50 rounded-full blur-md transition-all duration-300"
            style={{
              transform: `scale(${1 + (audioLevel / 100) * 0.2})`,
            }}
          />
          {/* Hologram Pulse Ring */}
          {(isListening || isSpeaking) && (
            <div
              className="absolute w-56 h-8 rounded-full border border-cyan-400/40 animate-ping opacity-50"
              style={{
                animationDuration: isListening ? '1.5s' : '2.2s',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
