import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, SleepRecord, DailySchedule, RelaxSession, CareNote, MorningFeeling } from '@/types';

interface AppState {
  profile: UserProfile | null;
  sleepRecords: SleepRecord[];
  careNotes: CareNote[];
  dailySchedules: DailySchedule[];
  relaxSessions: RelaxSession[];
  familyMode: boolean;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addSleepRecord: (record: SleepRecord) => void;
  updateSleepRecord: (id: string, partial: Partial<SleepRecord>) => void;
  upsertSleepRecord: (record: SleepRecord) => void;
  getTodayRecord: () => SleepRecord | undefined;
  getRecordByDate: (date: string) => SleepRecord | undefined;
  getWeekRecords: (weekStart?: string) => SleepRecord[];
  setDailySchedule: (schedule: DailySchedule) => void;
  getTodaySchedule: () => DailySchedule | undefined;
  addRelaxSession: (session: RelaxSession) => void;
  setFamilyMode: (mode: boolean) => void;
  addOrUpdateCareNote: (note: Omit<CareNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  getCareNoteByDate: (date: string) => CareNote | undefined;
  getWeekCareNotes: (weekStart?: string) => CareNote[];
  checkConsecutiveAbnormal: () => boolean;
  getConsecutiveAbnormalDays: () => number;
  getWeekTrend: (weekStart?: string) => 'improving' | 'stable' | 'declining';
  getClinicSummary: (weekStart?: string) => {
    lateNights: string[];
    manyAwakenings: string[];
    sleepyDays: string[];
    badMorningDays: string[];
    medicationDays: { date: string; note: string }[];
    multiIssueDays: { date: string; issues: string[] }[];
    totalRecords: number;
  };
  getDoctorConclusions: (weekStart?: string) => Array<{
    category: '作息' | '夜醒' | '白天犯困' | '晨间感受' | '服药变化' | '照护备忘';
    priority: 'high' | 'medium' | 'low';
    title: string;
    detail: string;
  }>;
  getCompanionAdvice: (weekStart?: string) => {
    dos: string[];
    donts: string[];
    avgSleepiness: number;
    avgAwakenings: number;
    avgBedtime: number;
  };
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      sleepRecords: [],
      careNotes: [],
      dailySchedules: [],
      relaxSessions: [],
      familyMode: false,

      setProfile: (profile) => set({ profile }),

      updateProfile: (partial) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...partial } : null,
        })),

      addSleepRecord: (record) =>
        set((state) => ({
          sleepRecords: [...state.sleepRecords, record],
        })),

      updateSleepRecord: (id, partial) =>
        set((state) => ({
          sleepRecords: state.sleepRecords.map((r) =>
            r.id === id ? { ...r, ...partial } : r
          ),
        })),

      upsertSleepRecord: (record) =>
        set((state) => {
          const existing = state.sleepRecords.find((r) => r.date === record.date);
          if (existing) {
            return {
              sleepRecords: state.sleepRecords.map((r) =>
                r.id === existing.id ? { ...existing, ...record } : r
              ),
            };
          }
          return { sleepRecords: [...state.sleepRecords, record] };
        }),

      getTodayRecord: () => {
        const today = getTodayStr();
        return get().sleepRecords.find((r) => r.date === today);
      },

      getRecordByDate: (date) => {
        return get().sleepRecords.find((r) => r.date === date);
      },

      getWeekRecords: (weekStart?: string) => {
        const start = weekStart || getWeekStart();
        const startDate = new Date(start);
        const records = get().sleepRecords;
        return records.filter((r) => {
          const d = new Date(r.date);
          return d >= startDate && d < new Date(startDate.getTime() + 7 * 86400000);
        });
      },

      setDailySchedule: (schedule) =>
        set((state) => {
          const filtered = state.dailySchedules.filter(
            (s) => s.date !== schedule.date
          );
          return { dailySchedules: [...filtered, schedule] };
        }),

      getTodaySchedule: () => {
        const today = getTodayStr();
        return get().dailySchedules.find((s) => s.date === today);
      },

      addRelaxSession: (session) =>
        set((state) => ({
          relaxSessions: [...state.relaxSessions, session],
        })),

      setFamilyMode: (mode) => set({ familyMode: mode }),

      addOrUpdateCareNote: (note) =>
        set((state) => {
          const existing = state.careNotes.find((n) => n.date === note.date);
          const now = new Date().toISOString();
          if (existing) {
            return {
              careNotes: state.careNotes.map((n) =>
                n.id === existing.id ? { ...existing, ...note, updatedAt: now } : n
              ),
            };
          }
          const newNote: CareNote = {
            ...note,
            id: 'care_' + Date.now(),
            createdAt: now,
            updatedAt: now,
          };
          return { careNotes: [...state.careNotes, newNote] };
        }),

      getCareNoteByDate: (date) => {
        return get().careNotes.find((n) => n.date === date);
      },

      getWeekCareNotes: (weekStart) => {
        const start = weekStart || getWeekStart();
        const startDate = new Date(start);
        return get().careNotes.filter((n) => {
          const d = new Date(n.date);
          return d >= startDate && d < new Date(startDate.getTime() + 7 * 86400000);
        });
      },

      checkConsecutiveAbnormal: () => {
        return get().getConsecutiveAbnormalDays() >= 3;
      },

      getConsecutiveAbnormalDays: () => {
        const records = get().sleepRecords;
        const recordMap = new Map<string, SleepRecord>();
        for (const r of records) {
          recordMap.set(r.date, r);
        }

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (!recordMap.has(todayStr)) {
          return 0;
        }

        let consecutiveDays = 0;
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const record = recordMap.get(dateStr);

          if (!record) break;

          const isAbnormal = record.sleepiness >= 3 || record.awakenings >= 3;
          if (isAbnormal) {
            consecutiveDays++;
          } else {
            break;
          }
        }
        return consecutiveDays;
      },

      getWeekTrend: (weekStart) => {
        const records = get().getWeekRecords(weekStart);
        if (records.length < 3) return 'stable';
        const half = Math.floor(records.length / 2);
        const firstHalf = records.slice(0, half);
        const secondHalf = records.slice(half);
        const avgFirst =
          firstHalf.reduce((s, r) => s + r.sleepiness, 0) / firstHalf.length;
        const avgSecond =
          secondHalf.reduce((s, r) => s + r.sleepiness, 0) / secondHalf.length;
        if (avgSecond < avgFirst - 0.3) return 'improving';
        if (avgSecond > avgFirst + 0.3) return 'declining';
        return 'stable';
      },

      getClinicSummary: (weekStart) => {
        const records = get().getWeekRecords(weekStart);
        const formatLabel = (dateStr: string) => {
          const d = new Date(dateStr);
          return `${d.getMonth() + 1}月${d.getDate()}日`;
        };
        const timeToMin = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          const mins = h * 60 + m;
          return mins < 12 * 60 ? mins + 24 * 60 : mins;
        };
        const lateNights = records
          .filter(r => timeToMin(r.sleepTime) >= 24 * 60)
          .map(r => formatLabel(r.date));
        const manyAwakenings = records
          .filter(r => r.awakenings >= 3)
          .map(r => formatLabel(r.date));
        const sleepyDays = records
          .filter(r => r.sleepiness >= 3)
          .map(r => formatLabel(r.date));
        const badMorningDays = records
          .filter(r => r.morningFeeling === 'bad')
          .map(r => formatLabel(r.date));
        const medicationDays = records
          .filter(r => r.medicationNote && r.medicationNote.trim())
          .map(r => ({ date: formatLabel(r.date), note: r.medicationNote }));

        const multiIssueDays = records
          .filter(r => {
            let count = 0;
            if (timeToMin(r.sleepTime) >= 24 * 60) count++;
            if (r.awakenings >= 3) count++;
            if (r.sleepiness >= 3) count++;
            if (r.morningFeeling === 'bad') count++;
            if (r.medicationNote && r.medicationNote.trim()) count++;
            return count >= 2;
          })
          .map(r => {
            const issues: string[] = [];
            if (timeToMin(r.sleepTime) >= 24 * 60) issues.push('入睡晚');
            if (r.awakenings >= 3) issues.push('醒得多');
            if (r.sleepiness >= 3) issues.push('白天困');
            if (r.morningFeeling === 'bad') issues.push('晨起差');
            if (r.medicationNote && r.medicationNote.trim()) issues.push('服药变化');
            return { date: formatLabel(r.date), issues };
          });

        return {
          lateNights,
          manyAwakenings,
          sleepyDays,
          badMorningDays,
          medicationDays,
          multiIssueDays,
          totalRecords: records.length,
        };
      },

      getDoctorConclusions: (weekStart) => {
        const records = get().getWeekRecords(weekStart);
        const careNotes = get().getWeekCareNotes(weekStart);
        const timeToMin = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          const mins = h * 60 + m;
          return mins < 12 * 60 ? mins + 24 * 60 : mins;
        };

        const conclusions: ReturnType<AppState['getDoctorConclusions']> = [];

        const lateNights = records.filter(r => timeToMin(r.sleepTime) >= 24 * 60);
        if (lateNights.length >= 2) {
          const avgMin =
            lateNights.reduce((s, r) => s + timeToMin(r.sleepTime), 0) / lateNights.length;
          const avgH = Math.floor(avgMin / 60) - 24;
          const avgM = avgMin % 60;
          conclusions.push({
            category: '作息',
            priority: lateNights.length >= 3 ? 'high' : 'medium',
            title: `有${lateNights.length}天入睡过晚`,
            detail: `平均约 ${avgH}:${avgM.toString().padStart(2, '0')} 才上床，涉及日期：${lateNights.map(r => `${new Date(r.date).getMonth() + 1}/${new Date(r.date).getDate()}`).join('、')}`,
          });
        }

        const manyAwakenings = records.filter(r => r.awakenings >= 3);
        if (manyAwakenings.length >= 2) {
          const avg =
            manyAwakenings.reduce((s, r) => s + r.awakenings, 0) / manyAwakenings.length;
          conclusions.push({
            category: '夜醒',
            priority: manyAwakenings.length >= 3 ? 'high' : 'medium',
            title: `有${manyAwakenings.length}天夜里醒得多`,
            detail: `平均每晚醒 ${avg.toFixed(1)} 次，涉及日期：${manyAwakenings.map(r => `${new Date(r.date).getMonth() + 1}/${new Date(r.date).getDate()}`).join('、')}`,
          });
        }

        const sleepyDays = records.filter(r => r.sleepiness >= 3);
        if (sleepyDays.length >= 2) {
          conclusions.push({
            category: '白天犯困',
            priority: sleepyDays.length >= 3 ? 'high' : 'medium',
            title: `有${sleepyDays.length}天白天犯困`,
            detail: `影响了白天的精神状态，涉及日期：${sleepyDays.map(r => `${new Date(r.date).getMonth() + 1}/${new Date(r.date).getDate()}`).join('、')}`,
          });
        }

        const badMornings = records.filter(r => r.morningFeeling === 'bad');
        if (badMornings.length >= 1) {
          conclusions.push({
            category: '晨间感受',
            priority: badMornings.length >= 3 ? 'high' : 'low',
            title: `有${badMornings.length}天起床后感觉睡得不太好`,
            detail: `${badMornings.map(r => `${new Date(r.date).getMonth() + 1}/${new Date(r.date).getDate()}`).join('、')}`,
          });
        }

        const medChanges = records.filter(r => r.medicationNote && r.medicationNote.trim());
        if (medChanges.length >= 1) {
          conclusions.push({
            category: '服药变化',
            priority: 'high',
            title: `有${medChanges.length}天记录了服药变化`,
            detail: medChanges.map(r => `${new Date(r.date).getMonth() + 1}/${new Date(r.date).getDate()}：${r.medicationNote}`).join('；'),
          });
        }

        const importantCareNotes = careNotes.filter(n =>
          n.caffeine === true ||
          n.mood === 'anxious' ||
          n.mood === 'sad' ||
          (n.nap && (n.napMinutes ?? 0) > 60)
        );
        if (importantCareNotes.length >= 1) {
          const details = importantCareNotes.map(n => {
            const parts: string[] = [];
            if (n.caffeine) parts.push('喝咖啡/茶');
            if (n.mood === 'anxious') parts.push('焦虑');
            if (n.mood === 'sad') parts.push('情绪低落');
            if (n.nap && (n.napMinutes ?? 0) > 60) parts.push(`午睡${n.napMinutes}分钟`);
            return `${new Date(n.date).getMonth() + 1}/${new Date(n.date).getDate()}：${parts.join('、')}`;
          });
          conclusions.push({
            category: '照护备忘',
            priority: 'medium',
            title: `有${importantCareNotes.length}天存在可能影响睡眠的因素`,
            detail: details.join('；'),
          });
        }

        if (conclusions.length === 0) {
          conclusions.push({
            category: '作息',
            priority: 'low',
            title: '本周睡眠整体平稳',
            detail: '作息规律、夜醒和白天犯困都不明显，建议继续保持。',
          });
        }

        conclusions.sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.priority] - order[b.priority];
        });

        return conclusions.slice(0, 3);
      },

      getCompanionAdvice: (weekStart) => {
        const records = get().getWeekRecords(weekStart);
        const avgSleepiness = records.length
          ? records.reduce((s, r) => s + r.sleepiness, 0) / records.length
          : 2;
        const avgAwakenings = records.length
          ? records.reduce((s, r) => s + r.awakenings, 0) / records.length
          : 0;
        const avgBedtime = records.length
          ? records.reduce((s, r) => {
              const [h, m] = r.sleepTime.split(':').map(Number);
              let mins = h * 60 + m;
              if (h < 12) mins += 24 * 60;
              return s + mins;
            }, 0) / records.length
          : 23 * 60;

        const dos: string[] = [
          '按时陪伴散步，保持傍晚的小运动习惯',
          '提醒到点上床，不用多问"困不困"',
          '帮着放轻音乐或打开放松练习页面',
          '看到"越躺越清醒"提示，帮助老人离床坐坐',
        ];
        const donts: string[] = [
          '不要催着"快睡"或反复询问睡着没',
          '不要责备"怎么又醒了"或"昨天睡得不好吧"',
          '不要私自调整安眠药物剂量',
          '不要在睡前聊让老人焦虑或兴奋的话题',
        ];

        if (avgSleepiness >= 2.5) {
          dos.unshift('白天提醒老人少打盹，多晒太阳');
          donts.unshift('不要因为白天困就让老人长时间午睡');
        }
        if (avgAwakenings >= 2.5) {
          dos.unshift('睡前帮着检查窗帘是否遮光、室温是否舒适');
          donts.unshift('不要在夜里频繁起身查看老人睡眠');
        }
        if (avgBedtime >= 24 * 60) {
          dos.unshift('提醒老人固定时间上床，不要熬太晚');
        }

        return { dos, donts, avgSleepiness, avgAwakenings, avgBedtime };
      },
    }),
    {
      name: 'haoMian-storage',
    }
  )
);
