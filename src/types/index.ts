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
  isBackfilled?: boolean;
  backfilledAt?: string;
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

export interface JargonItem {
  term: string;
  simple: string;
  detail: string;
}

export const JARGON_LIST: JargonItem[] = [
  {
    term: '睡眠效率',
    simple: '睡得好不好',
    detail: '真正睡着的时间除以躺在床上的时间，比例越高说明睡眠质量越好。一般85%以上算正常。',
  },
  {
    term: '刺激控制',
    simple: '床只用来睡觉',
    detail: '让大脑建立"床=睡觉"的条件反射。睡不着就起来，有困意再回床，不在床上玩手机、看电视。',
  },
  {
    term: '睡眠限制',
    simple: '缩短在床时间，睡得更香',
    detail: '先缩短每天躺在床上的时间，等睡眠质量提高后再慢慢增加，让睡眠更"浓缩"。',
  },
  {
    term: '认知重构',
    simple: '放下对睡眠的担心',
    detail: '改变"睡不好就全完了"这类想法，减少对失眠的焦虑，反而更容易入睡。',
  },
  {
    term: '睡眠卫生',
    simple: '好的睡眠习惯',
    detail: '帮助睡眠的生活习惯，比如规律作息、下午不喝咖啡、卧室安静黑暗等。',
  },
  {
    term: '在床时间',
    simple: '躺在床上的总时间',
    detail: '从关灯上床到早上起床之间的全部时间，包括睡着和醒着的时间。',
  },
  {
    term: '睡眠潜伏期',
    simple: '从躺下到睡着的时间',
    detail: '也叫"入睡潜伏期"，就是躺到床上后多久能睡着。通常15-30分钟算正常。',
  },
  {
    term: '睡眠维持困难',
    simple: '半夜醒来不容易再睡',
    detail: '入睡后半夜会醒来，而且醒了很久才能再睡着，或者醒得特别早。',
  },
  {
    term: '入睡困难',
    simple: '躺很久睡不着',
    detail: '躺在床上翻来覆去，超过30分钟还没睡着。',
  },
  {
    term: '早醒',
    simple: '比平时提前很多醒过来',
    detail: '比自己期望的起床时间早1-2小时以上醒来，而且很难再睡着。',
  },
  {
    term: 'CBT-I',
    simple: '不用吃药的失眠疗法',
    detail: '认知行为疗法治疗失眠的简称。通过调整作息和想法来改善睡眠，是国际公认的首选方法。',
  },
  {
    term: '睡眠节律',
    simple: '生物钟',
    detail: '身体内部的24小时作息规律。固定起床和睡觉时间，能让生物钟更稳定。',
  },
];
