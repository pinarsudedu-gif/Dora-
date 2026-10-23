import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  ShieldCheck,
  Lock,
  User,
  GraduationCap,
  Building,
  ArrowRight,
  HeartHandshake,
  Users,
} from 'lucide-react';
import { Student } from '../types';

interface EntryScreenProps {
  onStartWithStudent: (student: Student) => void;
  onOpenTeacherLogin: () => void;
  existingStudents: Student[];
}

export const SECTIONS_LIST = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'İ',
  'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S',
  'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
];

export const GRADES_LIST = [1, 2, 3, 4, 5, 6, 7, 8];

const AVATAR_OPTIONS = {
  kiz: [
    'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  ],
  erkek: [
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  ],
};

export const EntryScreen: React.FC<EntryScreenProps> = ({
  onStartWithStudent,
  onOpenTeacherLogin,
  existingStudents,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number>(5);
  const [section, setSection] = useState<string>('A');
  const [gender, setGender] = useState<'Kız' | 'Erkek'>('Kız');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 2) {
      setError('Lütfen geçerli bir ad ve soyad yazınız.');
      return;
    }

    // Check if matching student already exists in database
    const existing = existingStudents.find(
      (s) =>
        s.name.toLowerCase() === cleanName.toLowerCase() &&
        s.grade === grade &&
        s.section.toUpperCase() === section.toUpperCase()
    );

    if (existing) {
      onStartWithStudent(existing);
      return;
    }

    // Pick avatar
    const avatars = gender === 'Kız' ? AVATAR_OPTIONS.kiz : AVATAR_OPTIONS.erkek;
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    // Create new student
    const newStudent: Student = {
      id: `std-${grade}${section.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      name: cleanName,
      studentNumber: `${Math.floor(100 + Math.random() * 900)}`,
      grade,
      section,
      gender,
      avatar: randomAvatar,
      parent1Name: 'Veli',
      parentPhone1: '0555 000 00 00',
      parent2Name: '',
      parentPhone2: '',
      status: 'TAKIP_SURECINDE',
      isPinned: false,
      isDemo: false,
    };

    onStartWithStudent(newStudent);
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between font-['Comfortaa',sans-serif] text-slate-100">
      {/* Dynamic Blue Radial Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, #38bdf8 0%, #0284c7 35%, #0369a1 70%, #082f49 100%)',
        }}
      />

      {/* Floating Animated Ambient Lights & Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-10 w-80 h-80 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" />
        <div
          className="absolute top-1/3 right-12 w-96 h-96 rounded-full bg-sky-200/20 blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl animate-pulse"
          style={{ animationDelay: '2.5s' }}
        />

        {/* Small floating stars */}
        {[
          { top: '15%', left: '15%', size: 'w-2 h-2', delay: '0s' },
          { top: '25%', left: '85%', size: 'w-3 h-3', delay: '1s' },
          { top: '65%', left: '10%', size: 'w-2.5 h-2.5', delay: '2s' },
          { top: '80%', left: '80%', size: 'w-2 h-2', delay: '0.5s' },
        ].map((star, idx) => (
          <div
            key={idx}
            className={`absolute ${star.size} bg-white rounded-full opacity-70 animate-ping`}
            style={{
              top: star.top,
              left: star.left,
              animationDuration: '4s',
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* TOP HEADER */}
      <header className="relative z-20 px-4 sm:px-8 py-5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg">
            <Sparkles className="w-6 h-6 text-cyan-200 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl sm:text-2xl tracking-wider text-white">DORA</span>
              <span className="text-[11px] font-bold bg-cyan-300 text-blue-950 px-2 py-0.5 rounded-full font-sans uppercase">
                Yapay Zekâ Arkadaşın
              </span>
            </div>
            <p className="text-xs text-cyan-100 font-sans hidden sm:block">
              Okulda Güvenli ve Sevimli Rehberlik Alanı
            </p>
          </div>
        </div>

        {/* Counselor Protected Login Button */}
        <button
          onClick={onOpenTeacherLogin}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 backdrop-blur-md border border-cyan-400/40 text-cyan-200 hover:text-white transition-all shadow-xl hover:scale-105 font-sans font-semibold text-xs sm:text-sm"
          title="Rehber Öğretmen Paneline Şifre ile Giriş"
        >
          <div className="w-6 h-6 rounded-lg bg-blue-600/80 flex items-center justify-center text-white group-hover:bg-blue-500 transition-colors">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span>Rehber Öğretmen Paneli</span>
        </button>
      </header>

      {/* MAIN CONTENT: Centered Login Form Card */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-xl mx-auto w-full">
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-cyan-200 text-slate-800 transition-all">
          {/* Header with Dora Face Icon */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 p-1 shadow-xl shadow-cyan-500/30">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-white">
                  {/* Miniature Animated Robot Eyes */}
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                    <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                  </div>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white border-2 border-white shadow">
                <Mic className="w-3.5 h-3.5" />
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Merhaba Arkadaşım!
            </h2>
            <p className="text-sm font-sans text-slate-600 mt-1 max-w-md leading-relaxed">
              Dora ile sesli konuşmaya başlamak için lütfen bilgilerini gir. Seni dinlemek ve anlamak için buradayım!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 font-sans">
            {/* 1. Öğrenci Adı Soyadı */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-600" />
                <span>Öğrenci Adı ve Soyadı</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Örn: Ela Yılmaz, Ali Kaya..."
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-base font-semibold placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-inner"
                autoFocus
              />
            </div>

            {/* 2. Sınıf Seviyesi (1-8) ve Şube (A-Z) Yan Yana */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sınıf Seviyesi (1'den 8'e kadar) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Sınıf Seviyesi (1-8)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={grade}
                    onChange={(e) => setGrade(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-base font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {GRADES_LIST.map((g) => (
                      <option key={g} value={g}>
                        {g}. Sınıf
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 font-bold">
                    ▼
                  </div>
                </div>

                {/* Quick Grade Selector Pills */}
                <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
                  {GRADES_LIST.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        grade === g
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Şube (A'dan Z'ye kadar) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-sky-600" />
                  <span>Şube (A - Z)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 text-base font-bold focus:outline-none focus:border-cyan-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    {SECTIONS_LIST.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec} Şubesi
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 font-bold">
                    ▼
                  </div>
                </div>

                {/* Popular Sections Quick Buttons */}
                <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
                  {['A', 'B', 'C', 'D', 'E', 'F'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSection(sec)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        section === sec
                          ? 'bg-cyan-600 text-white shadow'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Cinsiyet Seçimi (Kız / Erkek) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Profil Avatarı
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('Kız')}
                  className={`py-2 px-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    gender === 'Kız'
                      ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                  <span>Kız Öğrenci</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Erkek')}
                  className={`py-2 px-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    gender === 'Erkek'
                      ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span>Erkek Öğrenci</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            {/* CTA Button: Dora ile Sohbete Başla */}
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-cyan-500/40 hover:shadow-cyan-400/60 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <Mic className="w-5 h-5 text-cyan-100 animate-pulse" />
              <span>Dora ile Sohbete Başla</span>
              <ArrowRight className="w-5 h-5 ml-1 text-cyan-200" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-sans justify-center text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Görüşme verilerin güvenle saklanır ve okul rehber öğretmenine iletilir.
            </span>
          </div>
        </div>

        {/* Existing Quick Demo Students (Convenient for test) */}
        {existingStudents.length > 0 && (
          <div className="w-full mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3 text-xs text-cyan-100 font-sans font-bold">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-300" />
                Hazır Kayıtlı Demo Öğrencilerden Seç:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {existingStudents.slice(0, 6).map((std) => (
                <button
                  key={std.id}
                  type="button"
                  onClick={() => onStartWithStudent(std)}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-left transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <img
                    src={std.avatar}
                    alt={std.name}
                    className="w-8 h-8 rounded-full object-cover border border-cyan-300 shrink-0"
                  />
                  <div className="overflow-hidden">
                    <span className="block text-xs font-bold text-white truncate group-hover:text-cyan-200">
                      {std.name}
                    </span>
                    <span className="text-[10px] text-cyan-200 font-sans">
                      {std.grade}-{std.section}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 px-4 py-3 text-center text-xs text-cyan-100/80 font-sans">
        DORA © Okul Rehberlik ve Akran Zorbalığı Erken Müdahale Platformu
      </footer>
    </div>
  );
};
