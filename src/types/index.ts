export type BullyingStatus = 'Bildirildi' | 'Bildirilmedi' | 'Bilgi yetersiz';

export type PriorityLevel = 'KRİTİK' | 'YÜKSEK' | 'ORTA' | 'DÜŞÜK' | 'GÜVENDE';

export type FollowUpStatus =
  | 'YENI_RAPOR'
  | 'TAKIP_EDILMELI'
  | 'OGRETMEN_GORUSMESI'
  | 'VELI_GORUSMESI'
  | 'TAKIP_SURECINDE'
  | 'TAMAMLANDI';

export interface BullyingAnalysis {
  verbal: BullyingStatus;
  physical: BullyingStatus;
  social: BullyingStatus;
  psychological: BullyingStatus;
  cyber: BullyingStatus;
  threat: BullyingStatus;
}

export interface ChatMessage {
  id: string;
  role: 'dora' | 'student';
  text: string;
  timestamp: string;
  options?: string[];
  emotion?: 'happy' | 'empathy' | 'listening' | 'thinking' | 'serious' | 'celebrate';
}

export interface Report {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: number;
  studentSection: string;
  interviewDate: string; // ISO format or formatted
  interviewSummary: string;
  generalMood: 'Çok Kötü' | 'Kötü' | 'İyi' | 'Çok İyi';
  priorityLevel: PriorityLevel;
  bullyingTypes: BullyingAnalysis;
  frequency: 'Tek seferlik' | 'Ara sıra' | 'Sık sık' | 'Sürekli' | 'Belirtilmedi';
  location: string;
  perpetrators: string;
  duration: string;
  emotionalState: string;
  toldAdult: string;
  safetyAssessment: string;
  recommendedActions: string[];
  fullTranscript: { role: 'dora' | 'student'; text: string; timestamp: string }[];
  isUnread?: boolean;
}

export interface TeacherNote {
  id: string;
  studentId: string;
  author: string;
  date: string;
  content: string;
  category: 'Görüşme Notu' | 'Gözlem' | 'Veli Görüşmesi' | 'Eylem Planı';
}

export interface Student {
  id: string;
  name: string;
  studentNumber: string;
  grade: number; // 1 to 8
  section: string; // 'A' to 'Z'
  gender: 'Kız' | 'Erkek';
  avatar: string;
  parent1Name: string;
  parentPhone1: string;
  parent2Name: string;
  parentPhone2: string;
  status: FollowUpStatus;
  isPinned: boolean;
  pinnedNote?: string;
  pinnedAt?: string;
  lastInterviewDate?: string;
  isDemo: boolean;
  hasUrgentAlert?: boolean;
}

export interface DoraDialogState {
  step: number;
  flowType: 'initial' | 'positive_flow' | 'concern_flow' | 'wrap_up';
  conversationHistory: ChatMessage[];
  currentMoodChoice?: string;
  studentAnswerLog: { question: string; answer: string }[];
}
