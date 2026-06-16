export interface UserProfile {
  id: string;
  name: string;
  wakeUpTime: string;
  bedtime: string;
  timeInBed: number;
  onboardingDone: boolean;
  familyPin: string;
  createdAt: string;
}

export interface SleepRecord {
  id: string;
  date: string;
  sleepTime: string;
  awakenings: number;
  sleepiness: number;
  medicationNote: string;
  filledByFamily: boolean;
  notes: string;
  createdAt: string;
}

export interface DailySchedule {
  id: string;
  date: string;
  napReminder: string;
  walkReminder: string;
  bedtimeRoutineStarted: boolean;
  outOfBedTriggered: boolean;
}

export interface RelaxSession {
  id: string;
  type: 'breathing' | 'muscle' | 'music';
  duration: number;
  completedAt: string;
}

export type SleepinessLevel = 1 | 2 | 3;

export const SLEEPINESS_LABELS: Record<SleepinessLevel, string> = {
  1: '精神很好 😊',
  2: '一般般 😐',
  3: '犯困没精神 😴',
};

export const BEDTIME_STEPS = [
  { icon: '📱', label: '放下手机和电子产品', duration: 0 },
  { icon: '🪥', label: '洗漱准备睡觉', duration: 0 },
  { icon: '🧘', label: '做放松呼吸练习', duration: 300 },
  { icon: '🛏️', label: '躺到床上，关灯', duration: 0 },
] as const;

export const MUSCLE_GROUPS = [
  { name: '双脚', instruction: '用力蜷起脚趾，坚持5秒，然后放松' },
  { name: '小腿', instruction: '绷紧小腿肌肉，坚持5秒，然后放松' },
  { name: '大腿', instruction: '夹紧大腿，坚持5秒，然后放松' },
  { name: '肚子', instruction: '收紧肚子，坚持5秒，然后放松' },
  { name: '双手', instruction: '握紧拳头，坚持5秒，然后放松' },
  { name: '手臂', instruction: '弯曲手臂绷紧肌肉，坚持5秒，然后放松' },
  { name: '肩膀', instruction: '耸起肩膀到耳朵，坚持5秒，然后放松' },
  { name: '脸部', instruction: '挤紧眼睛和嘴巴，坚持5秒，然后放松' },
] as const;

export const OUT_OF_BED_ACTIVITIES = [
  '📖 翻看一本轻松的书',
  '🎵 听听舒缓的音乐',
  '🧘 做几次深呼吸',
  '☕ 喝一杯温水',
  '✍️ 写几行日记',
  '🌙 坐在柔和的灯光下休息',
];

export const JARGON_MAP: Record<string, string> = {
  '睡眠效率': '睡得好不好',
  '刺激控制': '床只用来睡觉',
  '睡眠限制': '缩短在床时间，睡得更香',
  '认知重构': '放下对睡眠的担心',
  '睡眠卫生': '好的睡眠习惯',
  '在床时间': '躺在床上的总时间',
  '睡眠潜伏期': '从躺下到睡着的时间',
  '睡眠维持困难': '半夜醒来不容易再睡',
  '入睡困难': '躺很久睡不着',
  '早醒': '比平时提前很多醒过来',
};
