/**
 * DORA – Yapay Zekâ Destekli Okul Zorbalığı Tespit ve Öğrenci Takip Platformu
 */
import React, { useState, useEffect } from 'react';
import { EntryScreen } from './components/EntryScreen';
import { StudentScreen } from './components/StudentScreen';
import { TeacherPanel } from './components/TeacherPanel';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { Student, Report, TeacherNote } from './types';
import { INITIAL_STUDENTS, INITIAL_REPORTS, INITIAL_TEACHER_NOTES } from './data/mockData';
import { LayoutDashboard, Mic, Users, X, School, Lock } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'entry' | 'student' | 'teacher'>('entry');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [teacherNotes, setTeacherNotes] = useState<TeacherNote[]>(INITIAL_TEACHER_NOTES);
  const [currentStudentId, setCurrentStudentId] = useState<string>('std-5a-01'); // Default: Ali Yılmaz 5-A
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load server state on mount
  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => {
        if (data.students && data.students.length > 0) {
          setStudents(data.students);
        }
        if (data.reports && data.reports.length > 0) {
          setReports(data.reports);
        }
        if (data.teacherNotes && data.teacherNotes.length > 0) {
          setTeacherNotes(data.teacherNotes);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch initial server data, using initialized baseline:', err);
      });
  }, []);

  const currentStudent =
    students.find((s) => s.id === currentStudentId) || students[0] || INITIAL_STUDENTS[0];

  // Callback when student starts from EntryScreen
  const handleStartWithStudent = async (student: Student) => {
    const existingIndex = students.findIndex((s) => s.id === student.id);
    if (existingIndex < 0) {
      setStudents((prev) => [student, ...prev]);
      try {
        await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student),
        });
      } catch (err) {
        console.warn('Failed to save student:', err);
      }
    }
    setCurrentStudentId(student.id);
    setActiveView('student');
  };

  // Request to open Teacher Panel (checks password authentication)
  const handleRequestTeacherPanel = () => {
    if (isTeacherAuthenticated) {
      setActiveView('teacher');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsTeacherAuthenticated(true);
    setIsAuthModalOpen(false);
    setActiveView('teacher');
  };

  const handleTeacherLogout = () => {
    setIsTeacherAuthenticated(false);
    setActiveView('entry');
  };

  // Callback when Dora finishes a conversation and produces a report
  const handleReportGenerated = (newReport: Report) => {
    setReports((prev) => [newReport, ...prev]);

    // Update student state locally
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === newReport.studentId) {
          return {
            ...s,
            lastInterviewDate: newReport.interviewDate,
            status:
              newReport.priorityLevel === 'KRİTİK'
                ? 'YENI_RAPOR'
                : newReport.priorityLevel === 'YÜKSEK'
                ? 'YENI_RAPOR'
                : s.status,
            hasUrgentAlert: newReport.priorityLevel === 'KRİTİK' ? true : s.hasUrgentAlert,
          };
        }
        return s;
      })
    );
  };

  // Student update handler
  const handleUpdateStudent = async (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Student update sync failed:', e);
    }
  };

  // Add new student
  const handleAddStudent = async (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
    } catch (e) {
      console.warn('Add student sync failed:', e);
    }
  };

  // Teacher note handlers
  const handleAddNote = async (
    studentId: string,
    noteData: { content: string; category: TeacherNote['category'] }
  ) => {
    const newNote: TeacherNote = {
      id: `note-${Date.now()}`,
      studentId,
      author: 'Pınar Öğretmen (Rehberlik Servisi)',
      date: new Date().toISOString(),
      content: noteData.content,
      category: noteData.category,
    };

    setTeacherNotes((prev) => [newNote, ...prev]);

    try {
      await fetch('/api/teacher-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
    } catch (e) {
      console.warn('Add note sync failed:', e);
    }
  };

  const handleEditNote = async (
    noteId: string,
    content: string,
    category: TeacherNote['category']
  ) => {
    setTeacherNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, content, category } : n))
    );

    try {
      await fetch(`/api/teacher-notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category }),
      });
    } catch (e) {
      console.warn('Edit note sync failed:', e);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setTeacherNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      await fetch(`/api/teacher-notes/${noteId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('Delete note sync failed:', e);
    }
  };

  const handleMarkReportRead = async (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, isUnread: false } : r))
    );
    try {
      await fetch(`/api/reports/${reportId}/read`, { method: 'POST' });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-900 text-slate-100 select-none">
      {/* Active Screen View */}
      {activeView === 'entry' ? (
        <EntryScreen
          onStartWithStudent={handleStartWithStudent}
          onOpenTeacherLogin={handleRequestTeacherPanel}
          existingStudents={students}
        />
      ) : activeView === 'student' ? (
        <StudentScreen
          currentStudent={currentStudent}
          onOpenTeacherPanel={handleRequestTeacherPanel}
          onReportGenerated={handleReportGenerated}
          onSelectAnotherStudent={() => setIsStudentPickerOpen(true)}
          onGoToEntry={() => setActiveView('entry')}
        />
      ) : (
        <TeacherPanel
          students={students}
          reports={reports}
          teacherNotes={teacherNotes}
          onOpenStudentScreen={(std) => {
            setCurrentStudentId(std.id);
            setActiveView('student');
          }}
          onUpdateStudent={handleUpdateStudent}
          onAddStudent={handleAddStudent}
          onAddNote={handleAddNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
          onMarkReportRead={handleMarkReportRead}
          onLogout={handleTeacherLogout}
          onGoToEntry={() => setActiveView('entry')}
        />
      )}

      {/* Floating Global View Switcher (Docked in bottom-left for easy demonstration) */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-cyan-500/30 shadow-2xl">
        <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider font-sans">
          Görünüm:
        </span>
        <button
          onClick={() => setActiveView('entry')}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
            activeView === 'entry'
              ? 'bg-cyan-500 text-slate-950 shadow'
              : 'text-cyan-200 hover:bg-white/10'
          }`}
          title="Giriş Ekranına Geç"
        >
          <School className="w-3.5 h-3.5" />
          <span>Giriş</span>
        </button>
        <button
          onClick={() => setActiveView('student')}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
            activeView === 'student'
              ? 'bg-cyan-500 text-slate-950 shadow'
              : 'text-cyan-200 hover:bg-white/10'
          }`}
          title="Dora Öğrenci Ekranı"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Dora</span>
        </button>
        <button
          onClick={handleRequestTeacherPanel}
          className={`px-2.5 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
            activeView === 'teacher'
              ? 'bg-blue-600 text-white shadow'
              : 'text-cyan-200 hover:bg-white/10'
          }`}
          title={isTeacherAuthenticated ? 'Öğretmen Paneli' : 'Öğretmen Paneli (Şifreli)'}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Öğretmen</span>
          {!isTeacherAuthenticated && <Lock className="w-3 h-3 text-cyan-300" />}
        </button>
      </div>

      {/* TEACHER AUTHENTICATION MODAL */}
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* STUDENT SELECTION MODAL (For Dora Voice Screen) */}
      {isStudentPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Görüşme Yapacak Öğrenciyi Seçin</h3>
              </div>
              <button
                onClick={() => setIsStudentPickerOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Dora ile sesli sohbet başlatmak için aşağıdaki öğrencilerden birini seçebilir veya yeni giriş yapabilirsiniz:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {students.map((std) => (
                <div
                  key={std.id}
                  onClick={() => {
                    setCurrentStudentId(std.id);
                    setIsStudentPickerOpen(false);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    currentStudentId === std.id
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100'
                      : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={std.avatar}
                      alt={std.name}
                      className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40"
                    />
                    <div>
                      <strong className="block text-sm text-white font-semibold">{std.name}</strong>
                      <span className="text-xs text-slate-400">
                        {std.grade}-{std.section} Şubesi • No: {std.studentNumber}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-500/30">
                    Seç
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setIsStudentPickerOpen(false);
                  setActiveView('entry');
                }}
                className="text-xs font-bold text-cyan-300 hover:text-white flex items-center gap-1"
              >
                + Yeni Öğrenci Bilgisi Gir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

