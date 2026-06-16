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
  getWeekRecords: (weekStart?: string) => SleepRecord[];
  setDailySchedule: (schedule: DailySchedule) => void;
  getTodaySchedule: () => DailySchedule | undefined;
  addRelaxSession: (session: RelaxSession) => void;
  setFamilyMode: (mode: boolean) => void;
  checkConsecutiveAbnormal: () => boolean;
  getWeekTrend: () => 'improving' | 'stable' | 'declining';
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
        const records = [...get().sleepRecords].sort(
          (a, b) => b.date.localeCompare(a.date)
        );
        if (records.length < 3) return false;
        let count = 0;
        for (const r of records.slice(0, 7)) {
          if (r.sleepiness >= 3 || r.awakenings >= 3) {
            count++;
            if (count >= 3) return true;
          } else {
            count = 0;
          }
        }
        return false;
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
    }),
    {
      name: 'haoMian-storage',
    }
  )
);
