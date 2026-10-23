import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, Sparkles, X, ArrowRight } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DEMO_TEACHER_PASSWORD = 'dora2026';

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === DEMO_TEACHER_PASSWORD) {
      setError(null);
      setPassword('');
      onSuccess();
    } else {
      setError('Hatalı şifre girdiniz. Lütfen demo şifreyi ("dora2026") kullanınız.');
    }
  };

  const handleFillDemoPassword = () => {
    setPassword(DEMO_TEACHER_PASSWORD);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
            Rehber Öğretmen Girişi
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs font-sans">
            Öğrenci gizliliği ve psikososyal güvenlik nedeniyle bu alan yalnızca okul rehberlik servisi yetkililerine açıktır.
          </p>
        </div>

        {/* Demo Password Badge / Helper */}
        <div className="mb-5 p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-left font-sans">
              <span className="text-[11px] font-semibold text-blue-800 block uppercase tracking-wider">
                Demo Giriş Şifresi
              </span>
              <code className="text-xs font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                {DEMO_TEACHER_PASSWORD}
              </code>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemoPassword}
            className="text-xs font-sans font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all flex items-center gap-1 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Doldur</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Rehberlik Şifresi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Şifreyi giriniz..."
                autoFocus
                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors text-center"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Giriş Yap</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
