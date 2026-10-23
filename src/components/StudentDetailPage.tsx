import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  Phone,
  Calendar,
  AlertTriangle,
  Shield,
  FileText,
  Clock,
  MapPin,
  Users,
  Heart,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
  Mic,
} from 'lucide-react';
import { Student, Report, TeacherNote, FollowUpStatus } from '../types';

interface StudentDetailPageProps {
  student: Student;
  reports: Report[];
  notes: TeacherNote[];
  onBack: () => void;
  onUpdateStudent: (updated: Student) => void;
  onAddNote: (note: { content: string; category: TeacherNote['category'] }) => void;
  onEditNote: (id: string, content: string, category: TeacherNote['category']) => void;
  onDeleteNote: (id: string) => void;
  onStartDoraSession: (student: Student) => void;
}

export const StudentDetailPage: React.FC<StudentDetailPageProps> = ({
  student,
  reports,
  notes,
  onBack,
  onUpdateStudent,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onStartDoraSession,
}) => {
  // Follow-up status labels
  const STATUS_CONFIG: Record<
    FollowUpStatus,
    { label: string; bg: string; text: string; border: string }
  > = {
    YENI_RAPOR: {
      label: 'Yeni Rapor Geldi',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-300',
    },
    TAKIP_EDILMELI: {
      label: 'Takip Edilmeli',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-300',
    },
    OGRETMEN_GORUSMESI: {
      label: 'Öğretmen Görüşmesi Gerekli',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-300',
    },
    VELI_GORUSMESI: {
      label: 'Veli ile Görüşme Değerlendirilmeli',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-300',
    },
    TAKIP_SURECINDE: {
      label: 'Takip Sürecinde',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
    },
    TAMAMLANDI: {
      label: 'İnceleme Tamamlandı',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
    },
  };

  // State for editing parent phones
  const [isEditingPhones, setIsEditingPhones] = useState(false);
  const [phone1, setPhone1] = useState(student.parentPhone1);
  const [phone1Name, setPhone1Name] = useState(student.parent1Name || '1. Veli');
  const [phone2, setPhone2] = useState(student.parentPhone2);
  const [phone2Name, setPhone2Name] = useState(student.parent2Name || '2. Veli');

  // State for pin note
  const [isEditingPinNote, setIsEditingPinNote] = useState(false);
  const [pinNote, setPinNote] = useState(student.pinnedNote || '');

  // State for new teacher note
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<TeacherNote['category']>('Gözlem');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingNoteCategory, setEditingNoteCategory] = useState<TeacherNote['category']>('Gözlem');

  // Expandable transcripts per report
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});

  // Active tab: 'reports' | 'notes' | 'comparison'
  const [activeTab, setActiveTab] = useState<'reports' | 'notes' | 'comparison'>('reports');

  // Handlers
  const handleStatusChange = (newStatus: FollowUpStatus) => {
    onUpdateStudent({
      ...student,
      status: newStatus,
    });
  };

  const handleTogglePin = () => {
    onUpdateStudent({
      ...student,
      isPinned: !student.isPinned,
      pinnedAt: !student.isPinned ? new Date().toISOString() : undefined,
    });
  };

  const handleSavePinNote = () => {
    onUpdateStudent({
      ...student,
      pinnedNote: pinNote,
    });
    setIsEditingPinNote(false);
  };

  const handleSavePhones = () => {
    onUpdateStudent({
      ...student,
      parentPhone1: phone1,
      parent1Name: phone1Name,
      parentPhone2: phone2,
      parent2Name: phone2Name,
    });
    setIsEditingPhones(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddNote({
      content: newNoteContent,
      category: newNoteCategory,
    });
    setNewNoteContent('');
  };

  const toggleTranscript = (reportId: string) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sınıf Listesine Dön</span>
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>{student.name}</span>
            <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2.5 py-0.5 rounded-full border border-sky-300">
              {student.grade}-{student.section} Şubesi
            </span>
          </h2>
        </div>

        {/* Start Dora Voice Interview CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStartDoraSession(student)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow flex items-center gap-2 transition-all hover:scale-105"
          >
            <Mic className="w-4 h-4" />
            <span>Dora ile Sesli Görüşme Başlat</span>
          </button>

          {/* Star/Pin Button */}
          <button
            onClick={handleTogglePin}
            className={`p-2 rounded-xl border transition-all ${
              student.isPinned
                ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-400 hover:text-amber-500'
            }`}
            title={student.isPinned ? 'Sabitlemeyi Kaldır' : 'Öncelikli Takibe Sabitle'}
          >
            <Star className={`w-5 h-5 ${student.isPinned ? 'fill-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* SECTION A & D: Student Info, Status, Phone Contacts Header Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Öğrenci Bilgileri & Durum */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
                  {student.hasUrgentAlert && (
                    <span className="flex items-center gap-1 text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                      <AlertTriangle className="w-3 h-3" /> Acil Güvenlik Uyarısı
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                  <span>Öğrenci No: <strong className="text-slate-800">{student.studentNumber}</strong></span>
                  <span>Cinsiyet: <strong className="text-slate-800">{student.gender}</strong></span>
                  <span>Sınıf: <strong className="text-slate-800">{student.grade}-{student.section}</strong></span>
                </div>
              </div>
            </div>

            {/* Follow-up Status Dropdown */}
            <div className="flex flex-col gap-1 sm:items-end">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Takip Durumu
              </label>
              <select
                value={student.status}
                onChange={(e) => handleStatusChange(e.target.value as FollowUpStatus)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border shadow-sm outline-none cursor-pointer ${
                  STATUS_CONFIG[student.status].bg
                } ${STATUS_CONFIG[student.status].text} ${STATUS_CONFIG[student.status].border}`}
              >
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Son Görüşme</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {student.lastInterviewDate
                  ? new Date(student.lastInterviewDate).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Henüz yapılmadı'}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Toplam Dora Raporu</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {reports.length} Görüşme
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Öğretmen Notları</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {notes.length} Kayıt
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Öncelik Durumu</span>
              <strong className="text-slate-800 text-sm font-semibold">
                {student.isPinned ? 'Öncelikli Takipte ★' : 'Standart Takip'}
              </strong>
            </div>
          </div>

          {/* Teacher's Pinned Note Section */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Öğretmen Öncelikli Takip Notu:
              </span>
              {!isEditingPinNote ? (
                <button
                  onClick={() => setIsEditingPinNote(true)}
                  className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Düzenle
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePinNote}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                  >
                    <Check className="w-3 h-3" /> Kaydet
                  </button>
                  <button
                    onClick={() => setIsEditingPinNote(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-700"
                  >
                    İptal
                  </button>
                </div>
              )}
            </div>

            {isEditingPinNote ? (
              <textarea
                value={pinNote}
                onChange={(e) => setPinNote(e.target.value)}
                placeholder="Örn: Teneffüste gözlem yapılacak, veli ile irtibat kuruldu..."
                rows={2}
                className="w-full text-xs p-2 bg-white rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />
            ) : (
              <p className="text-xs text-amber-950 font-sans">
                {student.pinnedNote || 'Henüz özel bir takip notu girilmemiş. Buraya öğrenciyle ilgili özel izleme notunuzu yazabilirsiniz.'}
              </p>
            )}
          </div>
        </div>

        {/* D. Veli İletişim Bilgileri */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Veli İletişim Bilgileri</h4>
                  <span className="text-[11px] text-slate-400">Yalnızca yetkili personele açık</span>
                </div>
              </div>

              {!isEditingPhones ? (
                <button
                  onClick={() => setIsEditingPhones(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title="Numaraları Düzenle"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleSavePhones}
                    className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    title="Kaydet"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingPhones(false)}
                    className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    title="İptal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Phone List */}
            <div className="space-y-3">
              {/* Parent Phone 1 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  1. Veli İletişim
                </span>
                {isEditingPhones ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={phone1Name}
                      onChange={(e) => setPhone1Name(e.target.value)}
                      placeholder="Veli Adı ve Yakınlığı"
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="tel"
                      value={phone1}
                      onChange={(e) => setPhone1(e.target.value)}
                      placeholder="0532..."
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{student.parent1Name || '1. Veli'}</p>
                      <p className="text-xs font-mono text-slate-600">{student.parentPhone1 || 'Belirtilmedi'}</p>
                    </div>
                    {student.parentPhone1 && (
                      <a
                        href={`tel:${student.parentPhone1.replace(/\s+/g, '')}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                        title="Doğrudan Ara"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ara</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Parent Phone 2 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  2. Veli İletişim
                </span>
                {isEditingPhones ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={phone2Name}
                      onChange={(e) => setPhone2Name(e.target.value)}
                      placeholder="2. Veli Adı ve Yakınlığı"
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                    />
                    <input
                      type="tel"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      placeholder="0533..."
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{student.parent2Name || '2. Veli'}</p>
                      <p className="text-xs font-mono text-slate-600">{student.parentPhone2 || 'Kayıtlı numara yok'}</p>
                    </div>
                    {student.parentPhone2 && (
                      <a
                        href={`tel:${student.parentPhone2.replace(/\s+/g, '')}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                        title="Doğrudan Ara"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ara</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy & KVKK Legal Notice */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-400">
            <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
            <span>
              Öğrenci ve veli iletişim bilgileri KVKK ve MEB Rehberlik Mevzuatı uyarınca şifrelenerek korunmaktadır.
            </span>
          </div>
        </div>
      </div>

      {/* TABS: Geçmiş Raporlar vs. Öğretmen Notları vs. Karşılaştırma */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'reports'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Geçmiş Dora Raporları ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'notes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Öğretmen Özel Notları ({notes.length})</span>
          </button>

          {reports.length > 1 && (
            <button
              onClick={() => setActiveTab('comparison')}
              className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'comparison'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Gelişim ve Rapor Karşılaştırma</span>
            </button>
          )}
        </div>

        {/* TAB 1: GEÇMİŞ RAPORLAR (Chronological Reports) */}
        {activeTab === 'reports' && (
          <div className="p-6 space-y-6">
            {reports.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">Bu öğrenci için henüz Dora sesli görüşme raporu bulunmuyor.</p>
                <button
                  onClick={() => onStartDoraSession(student)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow hover:bg-blue-700 transition-colors"
                >
                  İlk Görüşmeyi Başlat
                </button>
              </div>
            ) : (
              reports.map((report, idx) => (
                <div
                  key={report.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
                >
                  {/* Report Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        #{reports.length - idx}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">
                            Görüşme Raporu
                          </h4>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              report.priorityLevel === 'KRİTİK'
                                ? 'bg-rose-600 text-white'
                                : report.priorityLevel === 'YÜKSEK'
                                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                : report.priorityLevel === 'ORTA'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            Öncelik: {report.priorityLevel}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(report.interviewDate).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
                        Ruh Hali: <strong>{report.generalMood}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                    <strong className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                      Görüşme Özeti:
                    </strong>
                    {report.interviewSummary}
                  </div>

                  {/* Bullying Classification Matrix */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Bildirilen Durumlar (Zorbalık Türleri Analizi):
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {[
                        { label: 'Sözel Zorbalık', status: report.bullyingTypes.verbal },
                        { label: 'Fiziksel Zorbalık', status: report.bullyingTypes.physical },
                        { label: 'Sosyal Dışlanma', status: report.bullyingTypes.social },
                        { label: 'Psikolojik Zorbalık', status: report.bullyingTypes.psychological },
                        { label: 'Siber Zorbalık', status: report.bullyingTypes.cyber },
                        { label: 'Tehdit / Korkutma', status: report.bullyingTypes.threat },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            item.status === 'Bildirildi'
                              ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                              : item.status === 'Bildirilmedi'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                              : 'bg-slate-100 border-slate-200 text-slate-500 font-normal'
                          }`}
                        >
                          <span className="block text-[11px] mb-1">{item.label}</span>
                          <span className="text-xs font-bold">{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Incident Context Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" /> Tekrarlama Sıklığı
                      </span>
                      <strong className="text-slate-800 block mt-1">{report.frequency}</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Olay Yeri / Ortam
                      </span>
                      <strong className="text-slate-800 block mt-1">{report.location}</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-500" /> Yapan Kişiler
                      </span>
                      <strong className="text-slate-800 block mt-1">{report.perpetrators}</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-slate-400 block font-medium flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-pink-500" /> Duygusal Durum
                      </span>
                      <strong className="text-slate-800 block mt-1">{report.emotionalState}</strong>
                    </div>
                  </div>

                  {/* Safety Assessment & Action Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
                      <strong className="block text-sky-900 font-bold mb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-sky-600" /> Güvenlik Değerlendirmesi:
                      </strong>
                      <p className="text-slate-700 leading-relaxed font-sans">{report.safetyAssessment}</p>
                    </div>

                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <strong className="block text-emerald-900 font-bold mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Önerilen Rehberlik Aksiyonları:
                      </strong>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 font-sans">
                        {report.recommendedActions.map((act, aIdx) => (
                          <li key={aIdx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Collapsible Full Transcript */}
                  {report.fullTranscript && report.fullTranscript.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleTranscript(report.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {expandedTranscripts[report.id]
                            ? 'Dora Sesli Görüşme Kaydını Gizle'
                            : `Dora Sesli Görüşme Kaydını İncele (${report.fullTranscript.length} konuşma)`}
                        </span>
                        {expandedTranscripts[report.id] ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {expandedTranscripts[report.id] && (
                        <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 space-y-2.5 max-h-72 overflow-y-auto">
                          {report.fullTranscript.map((t, tIdx) => (
                            <div
                              key={tIdx}
                              className={`flex items-start gap-2.5 text-xs font-sans ${
                                t.role === 'dora' ? 'justify-start' : 'justify-end'
                              }`}
                            >
                              {t.role === 'dora' && (
                                <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                  D
                                </div>
                              )}
                              <div
                                className={`p-2.5 rounded-xl max-w-md ${
                                  t.role === 'dora'
                                    ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                    : 'bg-blue-600 text-white font-medium'
                                }`}
                              >
                                <span className="block text-[9px] opacity-75 mb-0.5 font-mono">
                                  {t.role === 'dora' ? 'Dora' : student.name} • {t.timestamp}
                                </span>
                                {t.text}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ÖĞRETMEN ÖZEL NOT ALANI (Teacher Notes) */}
        {activeTab === 'notes' && (
          <div className="p-6 space-y-6">
            {/* Note Creation Form */}
            <form onSubmit={handleCreateNote} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Yeni Gizli Rehberlik Notu Ekle
                </h4>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Kategori:</label>
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as any)}
                    className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-semibold text-slate-700"
                  >
                    <option value="Gözlem">Gözlem</option>
                    <option value="Görüşme Notu">Görüşme Notu</option>
                    <option value="Veli Görüşmesi">Veli Görüşmesi</option>
                    <option value="Eylem Planı">Eylem Planı</option>
                  </select>
                </div>
              </div>

              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Öğrenciyle yapılan görüşmeler, gözlemler, aile temasları veya rehberlik planlarını buraya kaydedebilirsiniz..."
                rows={3}
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Bu notlar yalnızca yetkili öğretmenler tarafından görüntülenebilir.
                </span>
                <button
                  type="submit"
                  disabled={!newNoteContent.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Notu Kaydet</span>
                </button>
              </div>
            </form>

            {/* Existing Notes List */}
            <div className="space-y-3">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  Henüz özel bir öğretmen notu girilmemiş.
                </p>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{note.author}</span>
                        <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                          {note.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400">
                        <span className="text-[11px]">
                          {new Date(note.date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {editingNoteId !== note.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingNoteContent(note.content);
                                setEditingNoteCategory(note.category);
                              }}
                              className="p-1 text-slate-500 hover:text-blue-600"
                              title="Notu Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteNote(note.id)}
                              className="p-1 text-slate-500 hover:text-rose-600"
                              title="Notu Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded font-sans"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              onEditNote(note.id, editingNoteContent, editingNoteCategory);
                              setEditingNoteId(null);
                            }}
                            className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
                          >
                            Güncelle
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">{note.content}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KARŞILAŞTIRMA (Historical Progression Comparison) */}
        {activeTab === 'comparison' && reports.length > 1 && (
          <div className="p-6 space-y-4">
            <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900">
              <strong className="block font-bold mb-1">Dönemsel Gelişim Karşılaştırması</strong>
              <span>
                {student.name} için yapılan son 2 görüşme kıyaslanarak akran ilişkilerinin ve zorbalık riskinin zaman içindeki değişimi aşağıda özetlenmiştir.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Previous Report */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">
                  Önceki Görüşme ({new Date(reports[1].interviewDate).toLocaleDateString('tr-TR')})
                </span>
                <p className="font-semibold text-slate-800">{reports[1].interviewSummary}</p>
                <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                  <div>Öncelik Seviyesi: <strong className="text-slate-900">{reports[1].priorityLevel}</strong></div>
                  <div>Ruh Hali: <strong>{reports[1].generalMood}</strong></div>
                  <div>Sözel Zorbalık: <strong>{reports[1].bullyingTypes.verbal}</strong></div>
                  <div>Sosyal Dışlanma: <strong>{reports[1].bullyingTypes.social}</strong></div>
                </div>
              </div>

              {/* Latest Report */}
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                <span className="text-[11px] font-bold text-blue-700 block uppercase">
                  Son Görüşme ({new Date(reports[0].interviewDate).toLocaleDateString('tr-TR')})
                </span>
                <p className="font-semibold text-slate-900">{reports[0].interviewSummary}</p>
                <div className="pt-2 border-t border-blue-200 text-[11px] space-y-1">
                  <div>Öncelik Seviyesi: <strong className="text-blue-900">{reports[0].priorityLevel}</strong></div>
                  <div>Ruh Hali: <strong>{reports[0].generalMood}</strong></div>
                  <div>Sözel Zorbalık: <strong>{reports[0].bullyingTypes.verbal}</strong></div>
                  <div>Sosyal Dışlanma: <strong>{reports[0].bullyingTypes.social}</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI DISCLAIMER FOOTER NOTE */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-center font-sans">
        Yapay zekâ tarafından oluşturulan risk göstergeleri ve raporlar rehberlik servisine destek amacıyla hazırlanmıştır. Nihai psikolojik değerlendirme, veli irtibatı ve rehberlik kararı yetkili okul rehber öğretmenine aittir.
      </div>
    </div>
  );
};
