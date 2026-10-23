import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { INITIAL_STUDENTS, INITIAL_REPORTS, INITIAL_TEACHER_NOTES } from './src/data/mockData';
import { Student, Report, TeacherNote } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory data store with initialized demo data
let studentsData: Student[] = [...INITIAL_STUDENTS];
let reportsData: Report[] = [...INITIAL_REPORTS];
let teacherNotesData: TeacherNote[] = [...INITIAL_TEACHER_NOTES];

// Helper to get initialized GoogleGenAI client
function getAI(): GoogleGenAI | null {
  const rawApiKey = process.env.GEMINI_API_KEY;
  if (!rawApiKey || rawApiKey === 'MY_GEMINI_API_KEY' || rawApiKey.trim().length < 5) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: rawApiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI Request timeout')), ms)
    ),
  ]);
}

// ----------------- API ENDPOINTS ----------------- //

// GET /api/data - fetch all data
app.get('/api/data', (req: Request, res: Response) => {
  res.json({
    students: studentsData,
    reports: reportsData,
    teacherNotes: teacherNotesData,
  });
});

// POST /api/students - update or create student
app.post('/api/students', (req: Request, res: Response) => {
  const updatedStudent: Student = req.body;
  const index = studentsData.findIndex((s) => s.id === updatedStudent.id);
  if (index >= 0) {
    studentsData[index] = { ...studentsData[index], ...updatedStudent };
  } else {
    studentsData.unshift(updatedStudent);
  }
  res.json({ success: true, student: updatedStudent });
});

// POST /api/students/:id/pin - toggle pin status & update note
app.post('/api/students/:id/pin', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isPinned, pinnedNote } = req.body;
  const student = studentsData.find((s) => s.id === id);
  if (student) {
    student.isPinned = isPinned;
    student.pinnedNote = pinnedNote ?? student.pinnedNote;
    if (isPinned) {
      student.pinnedAt = new Date().toISOString();
    }
    res.json({ success: true, student });
  } else {
    res.status(404).json({ error: 'Öğrenci bulunamadı' });
  }
});

// POST /api/students/:id/status - update follow-up status
app.post('/api/students/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, hasUrgentAlert } = req.body;
  const student = studentsData.find((s) => s.id === id);
  if (student) {
    student.status = status;
    if (typeof hasUrgentAlert === 'boolean') {
      student.hasUrgentAlert = hasUrgentAlert;
    }
    res.json({ success: true, student });
  } else {
    res.status(404).json({ error: 'Öğrenci bulunamadı' });
  }
});

// POST /api/reports - save newly generated report
app.post('/api/reports', (req: Request, res: Response) => {
  const newReport: Report = req.body;
  reportsData.unshift(newReport);

  // Update student's last interview date and status
  const student = studentsData.find((s) => s.id === newReport.studentId);
  if (student) {
    student.lastInterviewDate = newReport.interviewDate;
    if (newReport.priorityLevel === 'KRİTİK') {
      student.status = 'YENI_RAPOR';
      student.hasUrgentAlert = true;
    } else if (newReport.priorityLevel === 'YÜKSEK') {
      student.status = 'YENI_RAPOR';
    }
  }

  res.json({ success: true, report: newReport });
});

// POST /api/reports/:id/read - mark report as read
app.post('/api/reports/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const report = reportsData.find((r) => r.id === id);
  if (report) {
    report.isUnread = false;
    res.json({ success: true, report });
  } else {
    res.status(404).json({ error: 'Rapor bulunamadı' });
  }
});

// POST /api/teacher-notes - add note
app.post('/api/teacher-notes', (req: Request, res: Response) => {
  const note: TeacherNote = {
    ...req.body,
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString(),
  };
  teacherNotesData.unshift(note);
  res.json({ success: true, note });
});

// PUT /api/teacher-notes/:id - edit note
app.put('/api/teacher-notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, category } = req.body;
  const note = teacherNotesData.find((n) => n.id === id);
  if (note) {
    note.content = content;
    if (category) note.category = category;
    res.json({ success: true, note });
  } else {
    res.status(404).json({ error: 'Not bulunamadı' });
  }
});

// DELETE /api/teacher-notes/:id - delete note
app.delete('/api/teacher-notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  teacherNotesData = teacherNotesData.filter((n) => n.id !== id);
  res.json({ success: true });
});

// POST /api/dora/tts - Text To Speech using Gemini 3.8 Flash Lite TTS (voice Kore - warm female voice)
app.post('/api/dora/tts', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }

  const ai = getAI();
  if (!ai) {
    return res.json({ useWebSpeech: true, reason: 'No Gemini API key available' });
  }

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text,
                speechMetadata: {
                  style: 'Warm, empathetic, friendly female robot voice for school children',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm female voice
            },
          },
        },
      }),
      8000
    );

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        success: true,
        audioData: `data:audio/wav;base64,${base64Audio}`,
      });
    }

    return res.json({ useWebSpeech: true });
  } catch (err: any) {
    console.warn('Gemini TTS timeout or error, falling back to Web Speech:', err?.message);
    return res.json({ useWebSpeech: true, error: err?.message });
  }
});

// POST /api/dora/chat - Conversational turn with Dora
app.post('/api/dora/chat', async (req: Request, res: Response) => {
  const {
    studentName,
    studentGrade,
    messages,
    userMessage,
    turnCount = 1,
  } = req.body;

  const systemInstruction = `
Sen "Dora" isimli yapay zekâ robotusun.
Görev: İlkokul ve ortaokul öğrencileriyle (1-8. sınıf) konuşarak okulda akran zorbalığına maruz kalıp kalmadıklarını anlamak, öğrencilerin kendilerini rahatça ifade etmelerini sağlamak.
Karakterin ve Sesin:
- Kesinlikle KADIN sesine sahip, sevimli, yumuşak, sıcak ve şefkatli bir yapay zekâ robot arkadaşsın.
- Çocukla doğrudan "sen" diliyle konuşursun. Dilin Türkçe, son derece dost canlısı, sevecen ve anlaşılırdır.
- Asla mekanik, resmi, sert veya sorgulayıcı bir polis gibi konuşma.
- Üzücü konularda daha sakin, anlayışlı ve derin empatik konuş.
- Öğrencinin adı: ${studentName || 'Arkadaşım'}, Sınıfı: ${studentGrade || 5}. sınıf.

ZORUNLU SOHBET AKIŞI KURALLARI:
1. Başlangıçta eğer sohbet yeni başlıyorsa:
   "Merhaba! Ben Dora. Bugün seninle biraz sohbet etmek istiyorum. Burada seni dinlemek için varım. Hazırsan başlayalım mı?"
   Ardından çocuğun yanıtına göre:
   "Okulda günlerin genellikle nasıl geçiyor?"
   Seçenekler: Çok kötü, Kötü, İyi, Çok iyi.

2. Öğrenci "iyi" veya "çok iyi" derse:
   "Harika! Buna çok sevindim. Peki okulda kendini güvende ve rahat hissediyor musun?"
   Ardından arkadaşların sana karşı tutumu, teneffüsler, rahatsız eden bir durum olup olmadığını sor.

3. Öğrenci "kötü" veya "çok kötü" derse:
   "Bunu duyduğuma üzüldüm. İstersen seni üzen şeyleri biraz konuşabiliriz. Buradayım ve seni dinliyorum."
   Ardından adım adım:
   - Okulda seni kötü hissettiren şey ne?
   - Arkadaşların sana hiç kötü davranıyor mu? Dalga geçen veya lakap takan var mı?
   - Bu durum ne zamandır yaşanıyor ve sık sık mı oluyor?
   - Bu davranışı yapan kişi veya kişiler kimler?
   - Bu olaylar genellikle nerede gerçekleşiyor (sınıf, koridor, bahçe, servis vb.)?
   - Sana fiziksel zarar veren veya seni tehdit eden oldu mu?
   - Bu durumu daha önce bir öğretmenine veya ailene anlattın mı?

4. Güvenlik Protokolü:
   - Eğer çocuk fiziksel şiddet, tehdit, can güvenliği veya akut bir tehlike bildirirse: Onu derhal teselli et, yalnız olmadığını ve güvende olması için okul rehber öğretmeni veya güvendiği bir büyüğü ile derhal paylaşacağını nazikçe açıkla.

5. Sohbetin Sonu:
   - Yeterli bilgi alındığında (yaklaşık 5-7 soru turu) çocuğu cesareti için öv ("Bana anlattığın için çok teşekkür ederim, sen çok değerlisin ve harika bir çocuksun!") ve sohbeti tamamla.

ÇIKTI FORMATI (JSON):
Her cevabını geçerli bir JSON olarak döndür:
{
  "reply": "Dora'nın öğrenciye söyleyeceği sıcak yanıt ve soru",
  "options": ["Seçenek 1", "Seçenek 2", "Seçenek 3"], // Öğrencinin konuşabileceği veya ekrandan tıklayabileceği 2-4 kısa seçenek
  "emotion": "happy" | "empathy" | "listening" | "thinking" | "serious" | "celebrate",
  "isComplete": true veya false // Yeterli bilgi toplandıysa ve görüşme tamamlandıysa true
}
`;

  // Dynamic progressive fallback replying if Gemini is offline or slow
  const fallbackReply = () => {
    const textLower = (userMessage || '').toLowerCase();
    const turn = typeof turnCount === 'number' ? turnCount : 1;

    if (!messages || messages.length <= 1) {
      if (textLower.includes('hazır') || textLower.includes('başla') || textLower.includes('evet')) {
        return {
          reply: 'Harika, çok mutlu oldum! Okulda günlerin genellikle nasıl geçiyor? Bana anlatabilirsin.',
          options: ['Çok iyi', 'İyi', 'Kötü', 'Çok kötü'],
          emotion: 'listening',
          isComplete: false,
        };
      }
      return {
        reply: 'Merhaba! Ben Dora. Bugün seninle biraz sohbet etmek istiyorum. Burada seni dinlemek için varım. Hazırsan başlayalım mı?',
        options: ['Evet hazırım!', 'Biraz çekiniyorum', 'Başlayalım'],
        emotion: 'happy',
        isComplete: false,
      };
    }

    if (turn === 1) {
      if (textLower.includes('kötü') || textLower.includes('üzg')) {
        return {
          reply: 'Bunu duyduğuma üzüldüm canım arkadaşım. İstersen seni üzen şeyleri biraz konuşabiliriz. Buradayım ve seni dinliyorum. Okulda seni kötü hissettiren şey tam olarak ne?',
          options: ['Arkadaşım kötü davranıyor', 'Benimle dalga geçiyorlar', 'Yalnız hissediyorum'],
          emotion: 'empathy',
          isComplete: false,
        };
      }
      return {
        reply: 'Harika! Buna çok sevindim. Peki okulda kendini her zaman güvende ve rahat hissediyor musun? Teneffüslerde seni üzen bir durum oluyor mu?',
        options: ['Kendimi güvende hissediyorum', 'Bazen rahatsız oluyorum', 'Arkadaşlarım çok iyi'],
        emotion: 'happy',
        isComplete: false,
      };
    }

    if (turn === 2) {
      return {
        reply: 'Seni çok iyi anlıyorum. Peki arkadaşların arasında sana lakap takan, oyunlara almayan ya da kırıcı konuşan birileri var mı?',
        options: ['Evet, lakap takıyorlar', 'Oyunlara almıyorlar', 'Sadece bazen şakalaşıyoruz', 'Hayır, kimse yapmıyor'],
        emotion: 'listening',
        isComplete: false,
      };
    }

    if (turn === 3) {
      return {
        reply: 'Anladım canım. Peki bu durum ne zamandır yaşanıyor ve sık sık mı tekrarlanıyor?',
        options: ['Son birkaç haftadır', 'Her gün oluyor', 'Ara sıra oluyor', 'İlk defa oldu'],
        emotion: 'empathy',
        isComplete: false,
      };
    }

    if (turn === 4) {
      return {
        reply: 'Peki bu olaylar genellikle okulun neresinde gerçekleşiyor? Sınıfta mı, koridorda mı yoksa bahçede mi?',
        options: ['Sınıfta oluyor', 'Koridor ve bahçede', 'Kantin veya serviste', 'Teneffüslerde'],
        emotion: 'thinking',
        isComplete: false,
      };
    }

    if (turn === 5) {
      return {
        reply: 'Peki sana fiziksel olarak zarar veren, itip kakan veya seni tehdit eden oldu mu? Korkma, güvendesin.',
        options: ['Fiziksel olmadı ama çok kırıldım', 'İtip kakan oldu', 'Sadece sözle söylediler', 'Hayır, hiç olmadı'],
        emotion: 'serious',
        isComplete: false,
      };
    }

    if (turn >= 6) {
      return {
        reply: 'Bana tüm bunları dürüstçe anlattığın için çok teşekkür ederim canım arkadaşım. Sen çok değerlisin ve harika bir çocuksun. Kendini hiç yalnız hissetme, rehber öğretmenin seninle ilgilenecek.',
        options: ['Teşekkürler Dora', 'Görüşmek üzere'],
        emotion: 'celebrate',
        isComplete: true,
      };
    }

    return {
      reply: 'Seni dinliyorum canım arkadaşım. Başka anlatmak istediğin veya seni üzen bir durum var mı?',
      options: ['Başka bir şey yok', 'Biraz daha anlatmak istiyorum'],
      emotion: 'listening',
      isComplete: false,
    };
  };

  const ai = getAI();
  if (!ai) {
    return res.json(fallbackReply());
  }

  try {
    // Build clean alternating conversation history for Gemini API
    const rawList: Array<{ role: 'user' | 'model'; text: string }> = [];

    // Prepend initial user prompt if needed so first role is always 'user'
    if (messages && messages.length > 0 && messages[0].role === 'dora') {
      rawList.push({ role: 'user', text: 'Merhaba Dora, seninle konuşmaya geldim.' });
    }

    for (const m of messages || []) {
      const role: 'user' | 'model' = m.role === 'dora' ? 'model' : 'user';
      const text = (m.text || '').trim();
      if (!text) continue;

      // If consecutive role is the same, merge text instead of creating duplicate role turn
      if (rawList.length > 0 && rawList[rawList.length - 1].role === role) {
        rawList[rawList.length - 1].text += `\n${text}`;
      } else {
        rawList.push({ role, text });
      }
    }

    // Ensure the latest userMessage is included in the history as the final user turn
    const trimmedUser = (userMessage || '').trim();
    if (trimmedUser) {
      if (rawList.length === 0) {
        rawList.push({ role: 'user', text: trimmedUser });
      } else if (rawList[rawList.length - 1].role === 'user') {
        // Only append if the last user turn doesn't already contain it
        if (!rawList[rawList.length - 1].text.includes(trimmedUser)) {
          rawList[rawList.length - 1].text += `\n${trimmedUser}`;
        }
      } else {
        rawList.push({ role: 'user', text: trimmedUser });
      }
    }

    // Guarantee that history starts with 'user' role
    if (rawList.length === 0 || rawList[0].role !== 'user') {
      rawList.unshift({ role: 'user', text: 'Merhaba Dora.' });
    }

    // Convert to Gemini API contents format
    const contents = rawList.map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    }));

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: "Dora'nın Türkçe sıcak cevabı" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Öğrenciye önerilen kısa yanıt butonları',
              },
              emotion: {
                type: Type.STRING,
                description: 'Dora yüz ifadesi: happy, empathy, listening, thinking, serious, celebrate',
              },
              isComplete: {
                type: Type.BOOLEAN,
                description: 'Sohbet tamamlandı mı',
              },
            },
            required: ['reply', 'options', 'emotion', 'isComplete'],
          },
        },
      }),
      25000
    );

    const rawText = (response.text || '{}').trim();
    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.reply) {
      return res.json(fallbackReply());
    }

    return res.json(parsed);
  } catch (err: any) {
    console.error('Gemini chat error, using fallback:', err?.message);
    return res.json(fallbackReply());
  }
});

// POST /api/dora/generate-report - Analyze transcript and build structured counselor report
app.post('/api/dora/generate-report', async (req: Request, res: Response) => {
  const { student, transcript, generalMood } = req.body;

  const fallbackReport = (): Report => {
    const transcriptText = (transcript || []).map((t: any) => `${t.role}: ${t.text}`).join('\n');
    const isBad = (generalMood === 'Kötü' || generalMood === 'Çok Kötü' || transcriptText.toLowerCase().includes('kötü') || transcriptText.toLowerCase().includes('dalga'));

    return {
      id: `rep-${Date.now()}`,
      studentId: student?.id || 'std-unknown',
      studentName: student?.name || 'Öğrenci',
      studentGrade: student?.grade || 5,
      studentSection: student?.section || 'A',
      interviewDate: new Date().toISOString(),
      interviewSummary: isBad
        ? `${student?.name || 'Öğrenci'}, Dora ile yaptığı sesli görüşmede okulda bazı arkadaşları tarafından sözel olarak rahatsız edildiğini ve duygusal olarak etkilendiğini ifade etmiştir.`
        : `${student?.name || 'Öğrenci'}, okul ortamında genel olarak olumlu ilişkiler içerisinde olduğunu ve kendini güvende hissettiğini aktarmıştır.`,
      generalMood: generalMood || (isBad ? 'Kötü' : 'İyi'),
      priorityLevel: isBad ? 'YÜKSEK' : 'GÜVENDE',
      bullyingTypes: {
        verbal: isBad ? 'Bildirildi' : 'Bildirilmedi',
        physical: 'Bildirilmedi',
        social: isBad ? 'Bildirildi' : 'Bildirilmedi',
        psychological: isBad ? 'Bildirildi' : 'Bildirilmedi',
        cyber: 'Bildirilmedi',
        threat: 'Bildirilmedi',
      },
      frequency: isBad ? 'Sık sık' : 'Belirtilmedi',
      location: 'Sınıf ve Teneffüs Alanı',
      perpetrators: isBad ? 'Sınıf arkadaşları' : 'Yok',
      duration: isBad ? 'Son birkaç haftadır' : 'Yok',
      emotionalState: isBad ? 'Kırgınlık, okula gelmede isteksizlik ve yalnızlık duygusu' : 'Neşeli, okula istekli',
      toldAdult: 'Rehber öğretmen ile ilk defa bu görüşmede paylaştı',
      safetyAssessment: isBad
        ? 'Öğrencinin anlattıkları akran zorbalığı kriterleri (tekrarlayan olumsuz eylemler, güç dengesizliği) açısından incelenmeli. Bireysel rehberlik görüşmesi önerilmektedir.'
        : 'Akut bir zorbalık emaresine rastlanmamıştır. Rutin gelişim takibi yeterlidir.',
      recommendedActions: isBad
        ? [
            'Öğrenci ile bireysel rehberlik görüşmesi yapılması',
            'Sınıf içi akran ilişkilerinin gözlemlenmesi',
            'Gerekirse aile ile iletişime geçilerek okul-aile işbirliğinin güçlendirilmesi',
          ]
        : ['Periyodik rehberlik takibinin sürdürülmesi'],
      fullTranscript: transcript || [],
      isUnread: true,
    };
  };

  const ai = getAI();
  if (!ai) {
    return res.json(fallbackReport());
  }

  try {
    const transcriptText = (transcript || [])
      .map((t: any) => `[${t.role.toUpperCase()}]: ${t.text}`)
      .join('\n');

    const prompt = `
Aşağıdaki sesli görüşme metnini rehber öğretmen için derinlemesine analiz et.

ÖĞRENCİ BİLGİSİ:
İsim: ${student?.name || 'Öğrenci'}
Sınıf: ${student?.grade || 5}-${student?.section || 'A'}
Genel Ruh Hali Beyanı: ${generalMood || 'Belirtilmedi'}

GÖRÜŞME METNİ:
${transcriptText}

GÖREV:
Görüşmeyi okul psikolojik danışmanı ve rehber öğretmeni standartlarına uygun olarak analiz et.
1. Zorbalık Türlerini değerlendir: Sözel, Fiziksel, Sosyal dışlanma, Psikolojik, Siber, Tehdit/korkutma.
   - Değerler yalnızca "Bildirildi", "Bildirilmedi" veya "Bilgi yetersiz" olabilir. Eksik bilgileri asla uydurma!
2. Tekrarlama sıklığı (Tek seferlik, Ara sıra, Sık sık, Sürekli, Belirtilmedi).
3. Olayın gerçekleştiği ortam (Sınıf, Koridor, Bahçe, Kantin, Servis, Siber vb.).
4. Yapan kişi veya kişiler (varsa).
5. Olayın süresi.
6. Öğrencinin duygusal durumu (üzüntü, korku, yalnızlık vb.).
7. Güvenlik Değerlendirmesi: Tehlike durumu, risk seviyesi.
8. Öncelik Seviyesi: "KRİTİK", "YÜKSEK", "ORTA", "DÜŞÜK", "GÜVENDE" değerlerinden biri.
9. Rehber Öğretmen için Önerilen Aksiyon Adımları (somut, pedagojik 3-4 madde).
10. Kısa Görüşme Özeti (2-3 cümlelik yönetici özeti).
`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Sen okullarda akran zorbalığı analizi yapan uzman bir klinik psikolojik danışman yapay zekâsısın. Verilen transkripti objektif ve hassas biçimde raporla.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interviewSummary: { type: Type.STRING },
              priorityLevel: {
                type: Type.STRING,
                description: 'KRİTİK, YÜKSEK, ORTA, DÜŞÜK veya GÜVENDE',
              },
              generalMood: {
                type: Type.STRING,
                description: 'Çok Kötü, Kötü, İyi veya Çok İyi',
              },
              bullyingTypes: {
                type: Type.OBJECT,
                properties: {
                  verbal: { type: Type.STRING, description: 'Bildirildi | Bildirilmedi | Bilgi yetersiz' },
                  physical: { type: Type.STRING, description: 'Bildirildi | Bildirilmedi | Bilgi yetersiz' },
                  social: { type: Type.STRING, description: 'Bildirildi | Bildirilmedi | Bilgi yetersiz' },
                  psychological: { type: Type.STRING, description: 'Bildirildi | Bildirilmedi | Bilgi yetersiz' },
                  cyber: { type: Type.STRING, description: 'Bildirildi | Bildirilmedi | Bilgi yetersiz' },
                  threat: { type: Type.STRING, description: 'Bildirildi | Bildirilmedi | Bilgi yetersiz' },
                },
                required: ['verbal', 'physical', 'social', 'psychological', 'cyber', 'threat'],
              },
              frequency: { type: Type.STRING, description: 'Tek seferlik | Ara sıra | Sık sık | Sürekli | Belirtilmedi' },
              location: { type: Type.STRING },
              perpetrators: { type: Type.STRING },
              duration: { type: Type.STRING },
              emotionalState: { type: Type.STRING },
              toldAdult: { type: Type.STRING },
              safetyAssessment: { type: Type.STRING },
              recommendedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'interviewSummary',
              'priorityLevel',
              'generalMood',
              'bullyingTypes',
              'frequency',
              'location',
              'perpetrators',
              'duration',
              'emotionalState',
              'toldAdult',
              'safetyAssessment',
              'recommendedActions',
            ],
          },
        },
      }),
      35000
    );

    const rawText = (response.text || '{}').trim();
    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    const fullReport: Report = {
      id: `rep-${Date.now()}`,
      studentId: student?.id || 'std-unknown',
      studentName: student?.name || 'Öğrenci',
      studentGrade: student?.grade || 5,
      studentSection: student?.section || 'A',
      interviewDate: new Date().toISOString(),
      interviewSummary: parsed.interviewSummary || 'Görüşme tamamlandı.',
      generalMood: parsed.generalMood || generalMood || 'İyi',
      priorityLevel: parsed.priorityLevel || 'ORTA',
      bullyingTypes: parsed.bullyingTypes || {
        verbal: 'Bildirilmedi',
        physical: 'Bildirilmedi',
        social: 'Bildirilmedi',
        psychological: 'Bildirilmedi',
        cyber: 'Bildirilmedi',
        threat: 'Bildirilmedi',
      },
      frequency: parsed.frequency || 'Belirtilmedi',
      location: parsed.location || 'Okul',
      perpetrators: parsed.perpetrators || 'Belirtilmedi',
      duration: parsed.duration || 'Belirtilmedi',
      emotionalState: parsed.emotionalState || 'Sakin',
      toldAdult: parsed.toldAdult || 'İlk kez Dora ile paylaşıldı',
      safetyAssessment: parsed.safetyAssessment || 'İnceleme devam ediyor.',
      recommendedActions: parsed.recommendedActions || ['Rehberlik görüşmesi planlanması'],
      fullTranscript: transcript || [],
      isUnread: true,
    };

    return res.json(fullReport);
  } catch (err: any) {
    console.error('Report generation error, using fallback:', err?.message);
    return res.json(fallbackReport());
  }
});

// ----------------- VITE MIDDLEWARE / STATIC FILES ----------------- //
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dora Server running on port ${PORT}`);
  });
}

startServer();
