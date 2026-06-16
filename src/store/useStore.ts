import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, SleepRecord, DailySchedule, RelaxSession } from '@/types';

interface AppState {
  profile: UserProfile | null;
  sleepRecords: SleepRecord[];
  dailySchedules: DailySchedule[];
  relaxSessions: RelaxSession[];
  familyMode: boolean;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  addSleepRecord: (record: SleepRecord) => void;
  updateSleepRecord: (id: string, partial: Partial<SleepRecord>) => void;
  getTodayRecord: () => SleepRecord | undefined;
  getRecordByDate: (date: string) => SleepRecord | undefined;
  getWeekRecords: (weekStart?: string) => SleepRecord[];
  setDailySchedule: (schedule: DailySchedule) => void;
  getTodaySchedule: () => DailySchedule | undefined;
  addRelaxSession: (session: RelaxSession) => void;
  setFamilyMode: (mode: boolean) => void;
  checkConsecutiveAbnormal: () => boolean;
  getConsecutiveAbnormalDays: () => number;
  getWeekTrend: () => 'improving' | 'stable' | 'declining';
  getClinicSummary: () => {
    lateNights: string[];
    manyAwakenings: string[];
    sleepyDays: string[];
    medicationDays: { date: string; note: string }[];
    multiIssueDays: { date: string; issues: string[] }[];
    totalRecords: number;
  };
  getCompanionAdvice: () => {
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

        let startOffset = 0;
        if (!recordMap.has(todayStr)) {
          for (let i = 1; i <= 14; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            if (recordMap.has(ds)) {
              startOffset = i;
              break;
            }
            if (i === 14) return 0;
          }
        }

        let consecutiveDays = 0;
        for (let i = startOffset; i < 30; i++) {
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

      getWeekTrend: () => {
        const records = get().getWeekRecords();
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

      getClinicSummary: () => {
        const records = get().getWeekRecords();
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
        const medicationDays = records
          .filter(r => r.medicationNote && r.medicationNote.trim())
          .map(r => ({ date: formatLabel(r.date), note: r.medicationNote }));

        const multiIssueDays = records
          .filter(r => {
            let count = 0;
            if (timeToMin(r.sleepTime) >= 24 * 60) count++;
            if (r.awakenings >= 3) count++;
            if (r.sleepiness >= 3) count++;
            if (r.medicationNote && r.medicationNote.trim()) count++;
            return count >= 2;
          })
          .map(r => {
            const issues: string[] = [];
            if (timeToMin(r.sleepTime) >= 24 * 60) issues.push('入睡晚');
            if (r.awakenings >= 3) issues.push('醒得多');
            if (r.sleepiness >= 3) issues.push('白天困');
            if (r.medicationNote && r.medicationNote.trim()) issues.push('服药变化');
            return { date: formatLabel(r.date), issues };
          });

        return {
          lateNights,
          manyAwakenings,
          sleepyDays,
          medicationDays,
          multiIssueDays,
          totalRecords: records.length,
        };
      },

      getCompanionAdvice: () => {
        const records = get().getWeekRecords();
        const avgSleepiness = records.length
          ? records.reduce((s, r) => s + r.sleepiness, 0) / records.length
          : 2;
        const avgAwakenings = records.length
          ? records.reduce((s, r) => s + r.awakenings, 0) / records.length
          : 0;
        const avgBedtime = records.length
          ? records.reduce((s, r) => {
              const [h, m] = r.sleepTime.split(':').map(Number);
              return s + h * 60 + m;
            }, 0) / records.length
          : 23 * 60;

        const dos: string[] = [
          '按时陪伴散步，保持傍晚的小运动习惯',
          '提醒到点上床，不用多问“困不困”',
          '帮着放轻音乐或打开放松练习页面',
          '看到“越躺越清醒”提示，帮助老人离床坐坐',
        ];
        const donts: string[] = [
          '不要催着“快睡”或反复询问睡着没',
          '不要责备“怎么又醒了”或“昨天睡得不好吧”',
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
        if (avgBedtime < 23 * 60 + 30) {
          dos.unshift('提醒老人固定时间上床，形成节律');
        }

        return { dos, donts, avgSleepiness, avgAwakenings, avgBedtime };
      },
    }),
    {
      name: 'haoMian-storage',
    }
  )
);
