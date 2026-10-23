import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  Star,
  Clock,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Filter,
  Plus,
  Mic,
  Calendar,
  Sparkles,
  ArrowUpRight,
  School,
  Database,
  Bell,
  Lock,
  LogOut,
} from 'lucide-react';
import { Student, Report, TeacherNote, FollowUpStatus } from '../types';
import { StudentDetailPage } from './StudentDetailPage';

interface TeacherPanelProps {
  students: Student[];
  reports: Report[];
  teacherNotes: TeacherNote[];
  onOpenStudentScreen: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onAddStudent: (student: Student) => void;
  onAddNote: (studentId: string, note: { content: string; category: TeacherNote['category'] }) => void;
  onEditNote: (noteId: string, content: string, category: TeacherNote['category']) => void;
  onDeleteNote: (noteId: string) => void;
  onMarkReportRead: (reportId: string) => void;
  onLogout?: () => void;
  onGoToEntry?: () => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  students,
  reports,
  teacherNotes,
  onOpenStudentScreen,
  onUpdateStudent,
  onAddStudent,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onMarkReportRead,
  onLogout,
  onGoToEntry,
}) => {
  // Filter state
  const [selectedGrade, setSelectedGrade] = useState<number>(5);
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showDemoOnly, setShowDemoOnly] = useState<boolean | 'all'>('all');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // New student form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Kız' | 'Erkek'>('Kız');
  const [newStudentParent1, setNewStudentParent1] = useState('');
  const [newStudentParentPhone1, setNewStudentParentPhone1] = useState('');

  // Grades 1 to 8
  const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];
  // Sections A to Z
  const SECTIONS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'İ',
    'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S',
    'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
  ];

  // Status styling map
  const STATUS_CONFIG: Record<
    FollowUpStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    YENI_RAPOR: {
      label: 'Yeni Rapor',
      bg: 'bg-rose-50 border-rose-200',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
    },
    TAKIP_EDILMELI: {
      label: 'Takip Edilmeli',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
    },
    OGRETMEN_GORUSMESI: {
      label: 'Görüşme Gerekli',
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700',
      dot: 'bg-purple-500',
    },
    VELI_GORUSMESI: {
      label: 'Veli Teması',
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-700',
      dot: 'bg-orange-500',
    },
    TAKIP_SURECINDE: {
      label: 'Takip Sürecinde',
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
    },
    TAMAMLANDI: {
      label: 'İnceleme Tamam',
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
  };

  // Filtered & Alphabetically Sorted Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesGrade = s.grade === selectedGrade;
        const matchesSection = s.section.toUpperCase() === selectedSection.toUpperCase();
        const matchesSearch =
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.studentNumber.includes(searchQuery);
        const matchesDemo =
          showDemoOnly === 'all'
            ? true
            : showDemoOnly
            ? s.isDemo
            : !s.isDemo;

        return matchesGrade && matchesSection && matchesSearch && matchesDemo;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));
  }, [students, selectedGrade, selectedSection, searchQuery, showDemoOnly]);

  // Pinned Students (Teacher's personal prioritized follow-up)
  const pinnedStudents = useMemo(() => {
    return students.filter((s) => s.isPinned);
  }, [students]);

  // Recent Reports sorted newest to oldest
  const sortedRecentReports = useMemo(() => {
    return [...reports].sort(
      (a, b) => new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime()
    );
  }, [reports]);

  // Selected student object for Detail Page
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Reports & Notes for selected student
  const studentReports = useMemo(() => {
    if (!selectedStudentId) return [];
    return reports
      .filter((r) => r.studentId === selectedStudentId)
      .sort(
        (a, b) => new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime()
      );
  }, [reports, selectedStudentId]);

  const studentNotes = useMemo(() => {
    if (!selectedStudentId) return [];
    return teacherNotes
      .filter((n) => n.studentId === selectedStudentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [teacherNotes, selectedStudentId]);

  // Handlers
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const handleReportClick = (report: Report) => {
    onMarkReportRead(report.id);
    setSelectedStudentId(report.studentId);
  };

  const handleTogglePin = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    onUpdateStudent({
      ...student,
      isPinned: !student.isPinned,
      pinnedAt: !student.isPinned ? new Date().toISOString() : undefined,
    });
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: Student = {
      id: `std-${selectedGrade}${selectedSection.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      name: newStudentName.trim(),
      studentNumber: newStudentNumber.trim() || `${Math.floor(100 + Math.random() * 900)}`,
      grade: selectedGrade,
      section: selectedSection,
      gender: newStudentGender,
      avatar:
        newStudentGender === 'Kız'
          ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      parent1Name: newStudentParent1.trim() || 'Veli',
      parentPhone1: newStudentParentPhone1.trim(),
      parent2Name: '',
      parentPhone2: '',
      status: 'TAKIP_EDILMELI',
      isPinned: false,
      isDemo: false,
    };

    onAddStudent(newStudent);
    setIsAddStudentOpen(false);
    setNewStudentName('');
    setNewStudentNumber('');
    setNewStudentParent1('');
    setNewStudentParentPhone1('');
    setSelectedStudentId(newStudent.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif] text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-400 text-white flex items-center justify-center shadow-md">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  DORA
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Rehberlik & Öğrenci Takip Paneli
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Akran Zorbalığı Erken Tespit ve Psikososyal Takip Sistemi
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct button to launch Dora Student Screen */}
            <button
              onClick={() => {
                const targetStudent = selectedStudent || filteredStudents[0] || students[0];
                if (targetStudent) onOpenStudentScreen(targetStudent);
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-transform hover:scale-102"
            >
              <Mic className="w-4 h-4 text-cyan-200" />
              <span className="hidden sm:inline">Dora Sesli Ekranı</span>
            </button>

            {/* Return to Entry Screen Button */}
            {onGoToEntry && (
              <button
                onClick={onGoToEntry}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Giriş Ekranına Dön"
              >
                <School className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Giriş Ekranı</span>
              </button>
            )}

            {/* Logout / Lock Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Paneli Kilitle ve Çıkış Yap"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                <span className="hidden sm:inline">Kilitle / Çıkış</span>
              </button>
            )}

            {/* Counselor Profile Badge */}
            <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                PÖ
              </div>
              <div className="text-left text-xs">
                <span className="font-bold text-slate-800 block">Pınar Öğretmen</span>
                <span className="text-[11px] text-slate-500">Okul Psikolojik Danışmanı</span>
              </div>
            </div>
          </div>
        </div>

        {/* 
          SECTION 7: SINIF VE ŞUBE SEÇİM ALANI (HORIZONTAL FILTER AT TOP)
          Class selection (1 to 8) and Section selection (A to Z)
        */}
        <div className="bg-slate-100/80 px-4 sm:px-6 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Grade Selector (1 to 8) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                Sınıf:
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedGrade(g);
                      setSelectedStudentId(null);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedGrade === g
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {g}. Sınıf
                  </button>
                ))}
              </div>
            </div>

            {/* Section Selector (A to Z with quick chips + dropdown) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Şube:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {['A', 'B', 'C', 'D', 'E', 'F'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setSelectedSection(sec);
                      setSelectedStudentId(null);
                    }}
                    className={`w-7 h-6 text-xs font-bold rounded-lg transition-all flex items-center justify-center ${
                      selectedSection === sec
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
                {/* Section dropdown for all A-Z */}
                <select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setSelectedStudentId(null);
                  }}
                  className="text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700 cursor-pointer focus:outline-none"
                  title="Tüm Şubeler (A-Z)"
                >
                  {SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Class Pill */}
            <div className="hidden md:flex items-center gap-1.5 text-xs bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-lg border border-blue-200">
              <span>Seçili Şube: {selectedGrade}-{selectedSection}</span>
              <span className="text-blue-500 font-normal">({filteredStudents.length} Kayıtlı Öğrenci)</span>
            </div>
          </div>

          {/* Search & Real/Demo Filter */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Öğrenci veya numara ara..."
                className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
              />
            </div>

            {/* Demo / Real Filter */}
            <select
              value={showDemoOnly as any}
              onChange={(e) => {
                const val = e.target.value;
                setShowDemoOnly(val === 'all' ? 'all' : val === 'true');
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium"
            >
              <option value="all">Tüm Öğrenciler</option>
              <option value="true">Örnek/Demo Veriler</option>
              <option value="false">Gerçek Öğrenciler</option>
            </select>

            {/* Add Student Button */}
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              title="Yeni Öğrenci Ekle"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Yeni Öğrenci</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR (RECENT REPORTS + PINNED STUDENTS) + MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* 
          LEFT SIDEBAR (SECTION 6):
          Top Left: Son Gelen Raporlar
          Bottom Left: Sabitlenen Öğrenciler / Öncelikli Takip
        */}
        <aside className="w-80 sm:w-88 bg-white border-r border-slate-200 flex flex-col shrink-0 h-[calc(100vh-105px)] overflow-hidden">
          {/* SOL ÜST: SON GELEN RAPORLAR */}
          <div className="flex-1 flex flex-col border-b border-slate-200 overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Son Gelen Raporlar
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {sortedRecentReports.length} Rapor
              </span>
            </div>

            {/* Report List (Newest to Oldest) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {sortedRecentReports.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Henüz gelen rapor bulunmuyor.
                </div>
              ) : (
                sortedRecentReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleReportClick(report)}
                    className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50 relative group ${
                      report.isUnread ? 'bg-sky-50/40' : ''
                    } ${selectedStudentId === report.studentId ? 'border-l-4 border-blue-600 bg-blue-50/30' : ''}`}
                  >
                    {/* Unread dot */}
                    {report.isUnread && (
                      <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}

                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs text-slate-900 group-hover:text-blue-600">
                          {report.studentName}
                        </strong>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                          {report.studentGrade}-{report.studentSection}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          report.priorityLevel === 'KRİTİK'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : report.priorityLevel === 'YÜKSEK'
                            ? 'bg-rose-100 text-rose-700'
                            : report.priorityLevel === 'ORTA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {report.priorityLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 font-sans mb-1.5">
                      {report.interviewSummary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(report.interviewDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-blue-600 font-medium group-hover:underline flex items-center gap-0.5">
                        İncele <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SOL ALT: SABİTLENEN ÖĞRENCİLER / ÖNCELİKLİ TAKİP */}
          <div className="h-64 sm:h-72 flex flex-col overflow-hidden bg-amber-50/20">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Sabitlenen / Öncelikli Takip
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {pinnedStudents.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-amber-100/60">
              {pinnedStudents.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <Star className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  Özel takibe almak istediğiniz öğrencileri yanlarındaki yıldız simgesiyle sabitleyebilirsiniz.
                </div>
              ) : (
                pinnedStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`p-3 cursor-pointer transition-colors hover:bg-amber-50/60 relative group ${
                      selectedStudentId === student.id ? 'border-l-4 border-amber-500 bg-amber-100/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-6 h-6 rounded-full object-cover border border-amber-300"
                        />
                        <strong className="text-xs text-slate-900 group-hover:text-amber-800">
                          {student.name}
                        </strong>
                        <span className="text-[10px] bg-white border border-amber-200 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                          {student.grade}-{student.section}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleTogglePin(e, student)}
                        className="text-amber-500 hover:text-amber-700 p-1"
                        title="Sabitlemeyi Kaldır"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                      </button>
                    </div>

                    {student.pinnedNote ? (
                      <p className="text-[11px] text-amber-950/80 font-sans line-clamp-1 italic mb-1">
                        &ldquo;{student.pinnedNote}&rdquo;
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-sans mb-1">Öncelik notu yok</p>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>
                        Son Görüşme:{' '}
                        {student.lastInterviewDate
                          ? new Date(student.lastInterviewDate).toLocaleDateString('tr-TR')
                          : 'Yok'}
                      </span>
                      <span className="text-amber-700 font-semibold group-hover:underline">Detay</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {selectedStudent ? (
            /* SECTION 9: ÖĞRENCİ DETAY SAYFASI */
            <StudentDetailPage
              student={selectedStudent}
              reports={studentReports}
              notes={studentNotes}
              onBack={() => setSelectedStudentId(null)}
              onUpdateStudent={onUpdateStudent}
              onAddNote={(note) => onAddNote(selectedStudent.id, note)}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
              onStartDoraSession={(s) => onOpenStudentScreen(s)}
            />
          ) : (
            /* SECTION 8: ÖĞRENCİ LİSTESİ */
            <div className="space-y-5">
              {/* Header Banner */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedGrade}-{selectedSection} Şubesi Öğrenci Listesi
                    </h2>
                    <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                      {filteredStudents.length} Öğrenci
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Öğrenci ismine tıklayarak geçmiş Dora sesli görüşme raporlarına, veli telefonlarına ve özel öğretmen notlarına erişebilirsiniz.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Şubeye Öğrenci Ekle</span>
                  </button>
                </div>
              </div>

              {/* Student Cards Grid / Table */}
              {filteredStudents.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedGrade}-{selectedSection} şubesinde kayıtlı öğrenci bulunamadı.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Filtreleri değiştirebilir veya sağ üstteki &quot;Yeni Öğrenci&quot; butonuyla bu şubeye öğrenci ekleyebilirsiniz.
                  </p>
                  <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow hover:bg-blue-700"
                  >
                    Yeni Öğrenci Oluştur
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredStudents.map((std) => {
                    const statusCfg = STATUS_CONFIG[std.status];
                    return (
                      <div
                        key={std.id}
                        onClick={() => handleSelectStudent(std.id)}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          {/* Card Top: Avatar, Name, Star */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={std.avatar}
                                alt={std.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                              />
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                  <span>{std.name}</span>
                                  {std.hasUrgentAlert && (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                  )}
                                </h3>
                                <span className="text-xs text-slate-500 block">
                                  No: <strong className="text-slate-700">{std.studentNumber}</strong> • {std.gender}
                                </span>
                              </div>
                            </div>

                            {/* Pin / Star Button */}
                            <button
                              onClick={(e) => handleTogglePin(e, std)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                std.isPinned
                                  ? 'bg-amber-50 border-amber-300 text-amber-500'
                                  : 'border-slate-200 text-slate-300 hover:text-amber-500 hover:bg-slate-50'
                              }`}
                              title={std.isPinned ? 'Sabitlemeyi Kaldır' : 'Öncelikli Takibe Sabitle'}
                            >
                              <Star className={`w-4 h-4 ${std.isPinned ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>

                          {/* Follow-up Status Badge */}
                          <div className="flex items-center justify-between text-xs mb-3">
                            <span className="text-slate-400 text-[11px]">Takip Durumu:</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${statusCfg.bg} ${statusCfg.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </div>

                          {/* Last Report Date */}
                          <div className="text-[11px] text-slate-500 flex items-center justify-between pb-3 border-b border-slate-100">
                            <span>Son Rapor:</span>
                            <span className="font-semibold text-slate-700">
                              {std.lastInterviewDate
                                ? new Date(std.lastInterviewDate).toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Görüşme yapılmadı'}
                            </span>
                          </div>
                        </div>

                        {/* Card Bottom CTA */}
                        <div className="pt-3 flex items-center justify-between text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStudentScreen(std);
                            }}
                            className="text-cyan-700 hover:text-cyan-900 font-bold flex items-center gap-1"
                            title="Dora Sesli Görüşmesini Başlat"
                          >
                            <Mic className="w-3.5 h-3.5" /> Dora ile Görüş
                          </button>

                          <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Detay Raporlar <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: YENİ ÖĞRENCİ EKLEME */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Yeni Öğrenci Kaydı ({selectedGrade}-{selectedSection} Şubesi)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Öğrenci bilgilerini girerek sisteme kaydedebilirsiniz.
            </p>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Öğrenci Adı ve Soyadı *</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Örn: Mehmet Can"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Öğrenci Numarası</label>
                  <input
                    type="text"
                    value={newStudentNumber}
                    onChange={(e) => setNewStudentNumber(e.target.value)}
                    placeholder="Örn: 1056"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cinsiyet</label>
                  <select
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Kız">Kız</option>
                    <option value="Erkek">Erkek</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">1. Veli Adı ve Yakınlığı</label>
                <input
                  type="text"
                  value={newStudentParent1}
                  onChange={(e) => setNewStudentParent1(e.target.value)}
                  placeholder="Örn: Selma Can (Anne)"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">1. Veli Telefon Numarası</label>
                <input
                  type="tel"
                  value={newStudentParentPhone1}
                  onChange={(e) => setNewStudentParentPhone1(e.target.value)}
                  placeholder="0532 000 00 00"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700"
                >
                  Öğrenciyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
