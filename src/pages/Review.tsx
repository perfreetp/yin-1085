import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import type { SleepRecord, CareNote, MorningFeeling } from '@/types';
import { MORNING_FEELING_LABELS, CARE_NOTE_MOOD_OPTIONS } from '@/types';
import { getSleepinessEmoji, getSleepinessColor } from '@/utils/time';
import {
  AlertTriangle,
  Printer,
  ChevronLeft,
  ChevronRight,
  Info,
  Pill,
  Stethoscope,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Coffee,
  Smile,
  Frown,
  Meh,
  Sun,
  Moon,
  Heart,
  Activity,
  NotebookPen,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JargonTerm, JargonExplainer } from '@/components/JargonTerm';

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const SLEEPINESS_LABELS = {
  1: '精神很好',
  2: '一般般',
  3: '犯困没精神',
};

const CATEGORY_COLORS: Record<string, string> = {
  作息: 'bg-indigo-100 text-indigo-700',
  夜醒: 'bg-purple-100 text-purple-700',
  白天犯困: 'bg-amber-100 text-amber-700',
  晨间感受: 'bg-rose-100 text-rose-700',
  服药变化: 'bg-orange-100 text-orange-700',
  照护备忘: 'bg-teal-100 text-teal-700',
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-red-400 bg-red-50 border-2',
  medium: 'border-orange-400 bg-orange-50 border-2',
  low: 'border-gray-300 bg-gray-50 border-2',
};

function getWeekStartDate(offset: number): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setDate(monday.getDate() + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateCN(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${formatDateCN(monday)} — ${formatDateCN(sunday)}`;
}

function getTrendDisplay(trend: 'improving' | 'stable' | 'declining') {
  if (trend === 'improving') return { icon: '📈', text: '趋势向好', color: 'text-green-600', bg: 'bg-green-50' };
  if (trend === 'stable') return { icon: '➡️', text: '保持稳定', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { icon: '📉', text: '需要注意', color: 'text-red-600', bg: 'bg-red-50' };
}

function sleepTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  let min = h * 60 + m;
  if (h < 12) min += 24 * 60;
  return min;
}

function minutesToSleepTime(min: number): string {
  let m = min % (24 * 60);
  if (m < 0) m += 24 * 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${mm.toString().padStart(2, '0')}`;
}

function getMorningFeelingEmoji(feeling?: MorningFeeling): string {
  if (feeling === 'good') return '😌';
  if (feeling === 'normal') return '😐';
  if (feeling === 'bad') return '😞';
  return '';
}

function getCareNoteSummary(note: CareNote): string[] {
  const parts: string[] = [];
  if (note.nap) parts.push(`午睡${note.napMinutes ?? 0}分钟`);
  if (note.caffeine) parts.push('喝咖啡/茶');
  if (note.mood && note.mood !== 'normal' && note.mood !== 'happy') {
    const moodOpt = CARE_NOTE_MOOD_OPTIONS.find((o) => o.value === note.mood);
    if (moodOpt) parts.push(moodOpt.label);
  }
  if (note.exercised) parts.push(note.exerciseType || '运动');
  if (note.otherNote) parts.push('有备注');
  return parts;
}

export default function Review() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedMedDay, setExpandedMedDay] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'detail' | 'clinic'>('chart');

  const getWeekRecords = useStore((s) => s.getWeekRecords);
  const checkConsecutiveAbnormal = useStore((s) => s.checkConsecutiveAbnormal);
  const getWeekTrend = useStore((s) => s.getWeekTrend);
  const getConsecutiveAbnormalDays = useStore((s) => s.getConsecutiveAbnormalDays);
  const getClinicSummary = useStore((s) => s.getClinicSummary);
  const getDoctorConclusions = useStore((s) => s.getDoctorConclusions);
  const getWeekCareNotes = useStore((s) => s.getWeekCareNotes);
  const getCareNoteByDate = useStore((s) => s.getCareNoteByDate);
  const familyMode = useStore((s) => s.familyMode);

  const monday = getWeekStartDate(weekOffset);
  const weekStartISO = formatDateISO(monday);

  const records = getWeekRecords(weekStartISO);
  const hasAbnormal = checkConsecutiveAbnormal();
  const trend = getWeekTrend(weekStartISO);
  const abnormalDays = getConsecutiveAbnormalDays();
  const clinic = getClinicSummary(weekStartISO);
  const doctorConclusions = getDoctorConclusions(weekStartISO);
  const weekCareNotes = getWeekCareNotes(weekStartISO);

  const recordMap = useMemo(() => {
    const m = new Map<string, SleepRecord>();
    for (const r of records) m.set(r.date, r);
    return m;
  }, [records]);

  const careNoteMap = useMemo(() => {
    const m = new Map<string, CareNote>();
    for (const n of weekCareNotes) m.set(n.date, n);
    return m;
  }, [weekCareNotes]);

  const weekDays = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [monday]);

  const avgSleepiness = records.length > 0
    ? records.reduce((s, r) => s + r.sleepiness, 0) / records.length
    : 0;
  const avgAwakenings = records.length > 0
    ? records.reduce((s, r) => s + r.awakenings, 0) / records.length
    : 0;

  const avgSleepTime = useMemo(() => {
    if (records.length === 0) return null;
    const total = records.reduce((s, r) => s + sleepTimeToMinutes(r.sleepTime), 0);
    return Math.round(total / records.length);
  }, [records]);

  const medChangeDays = records.filter((r) => r.medicationNote?.trim()).length;
  const careNoteDays = weekCareNotes.length;
  const trendDisplay = getTrendDisplay(trend);

  const handlePrint = () => window.print();

  const DoctorConclusions = () => {
    if (doctorConclusions.length === 0) return null;

    return (
      <div className="elder-card mx-4 mt-4 no-print">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-warm-100">
          <Stethoscope className="w-6 h-6 text-sleep-600" />
          <div>
            <h3 className="text-elder-base font-bold text-warm-800">🎯 医生自动结论</h3>
            <p className="text-elder-xs text-warm-500 mt-0.5">基于本周数据自动分析生成</p>
          </div>
        </div>
        <div className="space-y-2">
          {doctorConclusions.slice(0, 3).map((c, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-elder p-3 transition-all',
                PRIORITY_STYLES[c.priority]
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'rounded-lg px-2 py-0.5 text-elder-xs font-bold flex-shrink-0 mt-0.5',
                    CATEGORY_COLORS[c.category] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  {c.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-elder-sm font-bold text-warm-800">{c.title}</p>
                  <p className="text-elder-xs text-warm-600 mt-0.5">{c.detail}</p>
                </div>
                {c.priority === 'high' && (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CareNoteBadges = ({ note }: { note: CareNote }) => {
    const items: Array<{ icon: JSX.Element; text: string; color: string }> = [];
    if (note.nap) {
      items.push({
        icon: <Moon className="w-3.5 h-3.5" />,
        text: `午睡${note.napMinutes ?? 0}分`,
        color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      });
    }
    if (note.caffeine) {
      items.push({
        icon: <Coffee className="w-3.5 h-3.5" />,
        text: '咖啡/茶',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      });
    }
    if (note.mood && note.mood !== 'normal' && note.mood !== 'happy') {
      const isSad = note.mood === 'sad';
      items.push({
        icon: isSad ? <Frown className="w-3.5 h-3.5" /> : <Meh className="w-3.5 h-3.5" />,
        text: isSad ? '情绪低落' : '焦虑',
        color: 'bg-rose-50 text-rose-600 border-rose-200',
      });
    }
    if (note.exercised) {
      items.push({
        icon: <Activity className="w-3.5 h-3.5" />,
        text: note.exerciseType || '运动',
        color: 'bg-green-50 text-green-600 border-green-200',
      });
    }
    if (note.otherNote) {
      items.push({
        icon: <NotebookPen className="w-3.5 h-3.5" />,
        text: '备注',
        color: 'bg-slate-50 text-slate-600 border-slate-200',
      });
    }

    if (items.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5 mt-2 ml-14">
        {items.map((it, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium border',
              it.color
            )}
          >
            {it.icon}
            {it.text}
          </span>
        ))}
        {note.otherNote && (
          <p className="w-full text-elder-xs text-warm-500 mt-1 pl-1">
            📝 {note.otherNote}
          </p>
        )}
      </div>
    );
  };

  const ClinicSummary = () => {
    if (clinic.totalRecords === 0) {
      return (
        <div className="elder-card mx-4 text-center p-10">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-elder-base text-warm-500">
            本周还没有记录，填写后再来查看门诊小结
          </p>
        </div>
      );
    }

    const items: Array<{
      icon: string;
      question: string;
      data: string[] | { date: string; note: string }[];
      good: string;
      label: string;
      color: string;
      badgeColor: string;
      isMedication?: boolean;
    }> = [
      {
        icon: '⏰',
        question: '这周哪几天入睡比较晚（过了12点）？',
        data: clinic.lateNights,
        good: '入睡时间都比较早，继续保持',
        label: '入睡晚',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeColor: 'bg-indigo-100 text-indigo-800',
      },
      {
        icon: '🌙',
        question: '这周哪几天夜里醒得比较多（≥3次）？',
        data: clinic.manyAwakenings,
        good: '夜里醒来不多，睡眠连续性不错',
        label: '醒得多',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeColor: 'bg-purple-100 text-purple-800',
      },
      {
        icon: '😪',
        question: '这周哪几天白天犯困没精神？',
        data: clinic.sleepyDays,
        good: '白天精神状态都不错',
        label: '白天困',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeColor: 'bg-amber-100 text-amber-800',
      },
      {
        icon: '😞',
        question: '这周哪几天起床后感觉睡得不太好？',
        data: clinic.badMorningDays,
        good: '晨起感觉都还不错',
        label: '晨起差',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeColor: 'bg-rose-100 text-rose-800',
      },
      {
        icon: '💊',
        question: '这周哪几天有服药变化或备注？',
        data: clinic.medicationDays,
        good: '本周没有记录服药变化',
        label: '服药变化',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        badgeColor: 'bg-orange-100 text-orange-800',
        isMedication: true,
      },
    ];

    const multiIssueDaysWithCare = useMemo(() => {
      return clinic.multiIssueDays.map((d) => {
        const issues = [...d.issues];
        const isoDate = weekDays.find(
          (wd) => formatDateCN(wd) === d.date
        );
        if (isoDate) {
          const careNote = careNoteMap.get(formatDateISO(isoDate));
          if (careNote && getCareNoteSummary(careNote).length > 0) {
            issues.push('照护备忘');
          }
        }
        return { ...d, issues };
      });
    }, [clinic.multiIssueDays, weekDays, careNoteMap]);

    return (
      <>
        <div className="elder-card mx-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-warm-100">
            <Stethoscope className="w-7 h-7 text-sleep-600" />
            <div>
              <h3 className="text-elder-base font-bold text-warm-800">🏥 门诊沟通问答小结</h3>
              <p className="text-elder-xs text-warm-500 mt-0.5">拿给医生看，不用自己对着图表推</p>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((it) => {
              const hasData = it.data.length > 0;
              return (
                <div
                  key={it.label}
                  className={cn(
                    'rounded-elder border-2 p-4',
                    hasData ? it.color : 'bg-warm-50/60 text-warm-600 border-warm-200'
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-2xl">{it.icon}</span>
                    <div className="flex-1">
                      <p className="text-elder-sm font-bold mb-2">{it.question}</p>
                      {hasData ? (
                        <div className="flex flex-wrap gap-1.5">
                          {it.isMedication
                            ? (it.data as { date: string; note: string }[]).map((d, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-elder-xs font-medium',
                                    it.badgeColor
                                  )}
                                >
                                  <span className="font-bold">{d.date}</span>
                                  {d.note && `：${d.note}`}
                                </div>
                              ))
                            : (it.data as string[]).map((d, idx) => (
                                <span
                                  key={idx}
                                  className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-elder-xs font-bold',
                                    it.badgeColor
                                  )}
                                >
                                  {d}
                                </span>
                              ))}
                        </div>
                      ) : (
                        <p className="text-elder-sm flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {it.good}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {multiIssueDaysWithCare.length > 0 && (
          <div className="elder-card mx-4 mt-4 border-2 border-red-200 bg-red-50/50">
            <div className="flex items-start gap-2 mb-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-elder-sm font-bold text-red-800">
                  ⚠️ 同一天出现多个问题的日子
                </h4>
                <p className="text-elder-xs text-red-600 mt-0.5">
                  这些日子可能值得和医生重点讨论
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {multiIssueDaysWithCare.map((d, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-elder p-3 flex items-center gap-3 border border-red-100"
                >
                  <span className="text-elder-sm font-bold text-warm-800 w-20 flex-shrink-0">
                    {d.date}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {d.issues.map((issue) => (
                      <span
                        key={issue}
                        className={cn(
                          'rounded-lg px-2 py-1 text-elder-xs font-medium',
                          issue === '照护备忘'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="elder-card mx-4 mt-4 bg-warm-50/60">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-6 h-6 text-warm-600" />
            <h4 className="text-elder-sm font-bold text-warm-800">📝 本周记录统计</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-white rounded-elder p-3 text-center border border-warm-100">
              <p className="text-2xl font-bold text-warm-800">{clinic.totalRecords}</p>
              <p className="text-elder-xs text-warm-500 mt-0.5">本周记录天数</p>
            </div>
            <div className="bg-white rounded-elder p-3 text-center border border-warm-100">
              <p className="text-2xl font-bold text-warm-800">{multiIssueDaysWithCare.length}</p>
              <p className="text-elder-xs text-warm-500 mt-0.5">多问题并存天数</p>
            </div>
            <div className="bg-white rounded-elder p-3 text-center border border-warm-100">
              <p className="text-2xl font-bold text-warm-800">{medChangeDays}</p>
              <p className="text-elder-xs text-warm-500 mt-0.5">服药变化天数</p>
            </div>
            <div className="bg-white rounded-elder p-3 text-center border border-warm-100">
              <p className="text-2xl font-bold text-teal-700">{careNoteDays}</p>
              <p className="text-elder-xs text-warm-500 mt-0.5">照护备忘天数</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-4xl mx-auto">
        {hasAbnormal && !alertDismissed && (
          <div className="no-print bg-danger-bg border-2 border-danger-border rounded-xl p-5 m-4 mb-0 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-8 h-8 text-danger-text flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-elder-base font-bold text-danger-text">
                  ⚠️ 最近{abnormalDays}天连续睡眠状态不佳
                </p>
                <p className="text-elder-sm text-danger-text/80 mt-1">
                  建议尽快联系专业睡眠医生咨询
                </p>
              </div>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="mt-3 w-full bg-white/60 hover:bg-white/80 text-danger-text rounded-elder py-2 text-elder-sm font-bold transition-colors"
            >
              我知道了
            </button>
          </div>
        )}

        <DoctorConclusions />

        <div className="no-print flex items-center justify-between p-4 pb-2">
          <div>
            <h1 className="text-elder-lg font-bold text-warm-800">📊 阶段回顾</h1>
            <p className="text-elder-sm text-warm-500">{formatWeekRange(monday)}</p>
          </div>
          <div className="flex items-center gap-2">
            <JargonExplainer />
          </div>
        </div>

        <div className="no-print flex gap-2 px-4 mb-3">
          <button
            onClick={() => setActiveTab('chart')}
            className={cn(
              'px-4 py-2 rounded-elder text-elder-sm font-medium min-h-[44px] transition-colors',
              activeTab === 'chart'
                ? 'bg-warm-400 text-white'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            )}
          >
            趋势图
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={cn(
              'px-4 py-2 rounded-elder text-elder-sm font-medium min-h-[44px] transition-colors',
              activeTab === 'detail'
                ? 'bg-warm-400 text-white'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            )}
          >
            每日详情
          </button>
          <button
            onClick={() => setActiveTab('clinic')}
            className={cn(
              'px-4 py-2 rounded-elder text-elder-sm font-medium min-h-[44px] transition-colors flex items-center gap-1.5',
              activeTab === 'clinic'
                ? 'bg-warm-400 text-white'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            )}
          >
            <Stethoscope className="w-4 h-4" />
            门诊小结
          </button>
        </div>

        <div className="no-print flex items-center gap-2 px-4 mb-4">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="elder-btn-ghost flex items-center gap-1 !py-2 !px-3 !text-elder-sm"
          >
            <ChevronLeft className="w-5 h-5" />
            上周
          </button>
          <span className="flex-1 text-center text-elder-sm text-warm-600">
            {weekOffset === 0 ? '本周' : weekOffset === -1 ? '上周' : `${Math.abs(weekOffset)}周前`}
          </span>
          <button
            onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
            disabled={weekOffset === 0}
            className={cn(
              'elder-btn-ghost flex items-center gap-1 !py-2 !px-3 !text-elder-sm',
              weekOffset === 0 && 'opacity-40 pointer-events-none'
            )}
          >
            下周
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {activeTab === 'chart' && (
          <div className="space-y-4 px-4 no-print">
            <div className="elder-card">
              <h3 className="text-elder-base font-bold text-warm-800 mb-3 flex items-center gap-2">
                😊 <JargonTerm term="睡眠效率" />趋势
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => {
                  const iso = formatDateISO(day);
                  const record = recordMap.get(iso);
                  const isToday = iso === formatDateISO(new Date());
                  const hasBadMorning = record?.morningFeeling === 'bad';
                  return (
                    <div
                      key={iso}
                      className={cn(
                        'flex flex-col items-center rounded-lg p-1 transition-all',
                        isToday && 'ring-2 ring-warm-400'
                      )}
                    >
                      <span className="text-elder-xs font-medium text-warm-600">
                        {DAY_NAMES[i]}
                      </span>
                      <span className="text-elder-xs text-warm-400">
                        {day.getDate()}日
                      </span>
                      <div className={cn(
                        'w-full flex-1 min-h-[80px] rounded-lg mt-1 flex items-end justify-center relative',
                        record ? getSleepinessColor(record.sleepiness) : 'bg-warm-100'
                      )}>
                        {record ? (
                          <>
                            <span className="text-2xl pb-2">
                              {getSleepinessEmoji(record.sleepiness)}
                            </span>
                            {hasBadMorning && (
                              <span className="absolute top-1 right-1 text-base leading-none">
                                ⚠️
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-warm-300 text-elder-xs pb-2">—</span>
                        )}
                      </div>
                      {record?.medicationNote && (
                        <Pill className="w-4 h-4 text-orange-500 mt-1" />
                      )}
                      {record?.isBackfilled && (
                        <span className="text-[10px] text-gray-400 mt-1">补记</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-elder-xs text-warm-400 mt-2 text-center">
                ⚠️ 表示起床后感觉睡得不太好
              </p>
            </div>

            <div className="elder-card">
              <h3 className="text-elder-base font-bold text-warm-800 mb-3 flex items-center gap-2">
                🌙 醒来次数
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => {
                  const iso = formatDateISO(day);
                  const record = recordMap.get(iso);
                  const isToday = iso === formatDateISO(new Date());
                  const count = record?.awakenings ?? 0;
                  const maxHeight = 80;
                  const heightRatio = record ? Math.min(1, count / 5) : 0;

                  return (
                    <div
                      key={iso}
                      className={cn(
                        'flex flex-col items-center',
                        isToday && 'ring-2 ring-warm-400 rounded-lg p-0.5'
                      )}
                    >
                      <span className="text-elder-xs font-medium text-warm-600">
                        {DAY_NAMES[i]}
                      </span>
                      <div className="w-full flex-1 min-h-[80px] flex items-end justify-center pb-1">
                        {record ? (
                          <div
                            className={cn(
                              'w-6 rounded-t transition-all duration-500',
                              count <= 1 ? 'bg-green-400' : count <= 2 ? 'bg-yellow-400' : 'bg-red-400'
                            )}
                            style={{ height: `${Math.max(12, maxHeight * heightRatio)}px` }}
                          />
                        ) : (
                          <div className="w-6 bg-warm-100 rounded-t opacity-30" style={{ height: '12px' }} />
                        )}
                      </div>
                      <span className="text-elder-xs text-warm-500 font-bold">
                        {record ? `${count}次` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="elder-card">
              <h3 className="text-elder-base font-bold text-warm-800 mb-3 flex items-center gap-2">
                ⏰ 入睡时间
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => {
                  const iso = formatDateISO(day);
                  const record = recordMap.get(iso);
                  const isToday = iso === formatDateISO(new Date());

                  let position = 0;
                  if (record) {
                    const min = sleepTimeToMinutes(record.sleepTime);
                    const rangeStart = 20 * 60;
                    const rangeEnd = 27 * 60;
                    position = (min - rangeStart) / (rangeEnd - rangeStart);
                    position = Math.max(0, Math.min(1, position));
                  }

                  return (
                    <div
                      key={iso}
                      className={cn(
                        'flex flex-col items-center',
                        isToday && 'ring-2 ring-warm-400 rounded-lg p-0.5'
                      )}
                    >
                      <span className="text-elder-xs font-medium text-warm-600">
                        {DAY_NAMES[i]}
                      </span>
                      <div className="w-full h-20 relative bg-warm-100 rounded-lg">
                        <div className="absolute top-2 left-0 right-0 border-t border-dashed border-warm-300" />
                        <div className="absolute bottom-2 left-0 right-0 border-t border-dashed border-warm-300" />
                        {record && (
                          <div
                            className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-sleep-400 flex items-center justify-center text-white shadow-md"
                            style={{ top: `${position * 60 + 4}px` }}
                          >
                            <span className="text-[10px] font-bold">
                              {record.sleepTime.split(':')[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-elder-xs text-warm-500">
                        {record ? record.sleepTime : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-elder-xs text-warm-400 mt-2 text-center">
                线越靠上睡得越早，越靠下睡得越晚
              </p>
            </div>
          </div>
        )}

        {activeTab === 'detail' && (
          <div className="elder-card mx-4 no-print">
            <h3 className="text-elder-base font-bold text-warm-800 mb-3">📋 每日详情</h3>
            <div className="space-y-3">
              {weekDays.map((day, i) => {
                const iso = formatDateISO(day);
                const record = recordMap.get(iso);
                const careNote = careNoteMap.get(iso);
                const isToday = iso === formatDateISO(new Date());
                const isWeekend = i >= 5;

                return (
                  <div
                    key={iso}
                    className={cn(
                      'rounded-elder p-4 transition-all',
                      isToday
                        ? 'bg-warm-50 ring-2 ring-warm-300'
                        : isWeekend
                        ? 'bg-warm-50/50'
                        : 'bg-white border border-warm-100'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-14 text-center">
                        <div className="text-elder-sm font-bold text-warm-700">{DAY_NAMES[i]}</div>
                        <div className="text-elder-xs text-warm-400">{day.getDate()}日</div>
                      </div>
                      {record ? (
                        <>
                          <div className="text-3xl">{getSleepinessEmoji(record.sleepiness)}</div>
                          <div className="flex-1 space-y-1">
                            <div className="text-elder-sm text-warm-700">
                              入睡 {record.sleepTime} · 醒来 {record.awakenings} 次
                            </div>
                            <div className="text-elder-xs text-warm-500 flex items-center gap-2 flex-wrap">
                              <span>{SLEEPINESS_LABELS[record.sleepiness as 1 | 2 | 3]}</span>
                              {record.isBackfilled && (
                                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">
                                  补记
                                </span>
                              )}
                              {record.filledByFamily && (
                                <span className="bg-sleep-100 text-sleep-600 px-1.5 py-0.5 rounded text-[10px]">
                                  家属代填
                                </span>
                              )}
                            </div>
                            {record.morningFeeling && (
                              <div className="flex items-start gap-1.5 text-elder-xs">
                                <span className="text-lg leading-none">
                                  {getMorningFeelingEmoji(record.morningFeeling)}
                                </span>
                                <div>
                                  <span className={cn(
                                    'font-medium',
                                    record.morningFeeling === 'bad' ? 'text-rose-600' : 'text-warm-600'
                                  )}>
                                    晨起：{MORNING_FEELING_LABELS[record.morningFeeling]}
                                  </span>
                                  {record.morningNote && (
                                    <p className="text-warm-500 mt-0.5">
                                      💭 {record.morningNote}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {record.medicationNote && (
                            <button
                              onClick={() => setExpandedMedDay(expandedMedDay === iso ? null : iso)}
                              className="flex-shrink-0 flex items-center gap-1 text-orange-500 text-elder-xs bg-orange-50 px-2 py-1 rounded-lg"
                            >
                              <Pill className="w-4 h-4" />
                              服药
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex-1 text-elder-sm text-warm-300 text-center">
                          未记录
                        </div>
                      )}
                    </div>
                    {expandedMedDay === iso && record?.medicationNote && (
                      <div className="bg-orange-50 rounded-lg p-3 ml-14">
                        <p className="text-elder-sm text-orange-800">
                          💊 {record.medicationNote}
                        </p>
                      </div>
                    )}
                    {careNote && <CareNoteBadges note={careNote} />}
                  </div>
                );
              })}
            </div>
            {(medChangeDays > 0 || careNoteDays > 0) && (
              <div className="mt-3 pt-3 border-t border-warm-100 flex flex-col gap-1.5">
                {medChangeDays > 0 && (
                  <p className="text-elder-xs text-warm-500 flex items-center gap-1">
                    <Pill className="w-4 h-4 text-orange-500" />
                    本周有 <b className="text-orange-600">{medChangeDays}</b> 天记录了服药变化
                  </p>
                )}
                {careNoteDays > 0 && (
                  <p className="text-elder-xs text-warm-500 flex items-center gap-1">
                    <Heart className="w-4 h-4 text-teal-500" />
                    本周有 <b className="text-teal-600">{careNoteDays}</b> 天记录了照护备忘
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clinic' && (
          <div className="no-print">
            <ClinicSummary />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mx-4 mt-4 no-print">
          <div className={cn('elder-card flex flex-col items-center', trendDisplay.bg)}>
            <span className="text-3xl mb-1">{trendDisplay.icon}</span>
            <span className="text-elder-sm font-bold text-warm-700">{trendDisplay.text}</span>
            <span className="text-elder-xs text-warm-500 mt-0.5">整体趋势</span>
          </div>
          <div className="elder-card flex flex-col items-center bg-sleep-50">
            <span className="text-3xl mb-1">🌙</span>
            <span className="text-elder-sm font-bold text-warm-700">
              {records.length > 0 ? avgAwakenings.toFixed(1) : '—'} 次
            </span>
            <span className="text-elder-xs text-warm-500 mt-0.5">平均醒来次数</span>
          </div>
          <div className="elder-card flex flex-col items-center bg-warm-50">
            <span className="text-3xl mb-1">{getSleepinessEmoji(Math.round(avgSleepiness))}</span>
            <span className="text-elder-sm font-bold text-warm-700">
              {avgSleepiness > 0 ? avgSleepiness.toFixed(1) : '—'} 分
            </span>
            <span className="text-elder-xs text-warm-500 mt-0.5">平均白天状态</span>
          </div>
        </div>

        {avgSleepTime && (
          <div className="elder-card mx-4 mt-3 no-print">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-elder-base font-bold text-warm-800">⏰ 平均入睡时间</h3>
                <p className="text-elder-sm text-warm-500 mt-1">
                  本周平均 <b className="text-warm-700">{minutesToSleepTime(avgSleepTime)}</b> 上床
                </p>
              </div>
              <div className="text-4xl">😴</div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-6 mb-4 no-print">
          <button
            onClick={handlePrint}
            className="elder-btn-secondary flex items-center gap-2"
          >
            <Printer className="w-6 h-6" />
            🖨️ 打印本周简报
          </button>
        </div>

        {familyMode && (
          <div className="mx-4 mb-4 p-3 bg-sleep-50 rounded-elder text-center no-print">
            <p className="text-elder-sm text-sleep-600">
              💡 家属提示：点击带 <Info className="w-4 h-4 inline" /> 的术语可以查看原词和解释
            </p>
          </div>
        )}

        <div className="print-only">
          <div className="p-4 text-black">
            <h1 className="text-2xl font-bold text-center mb-1">好眠排程 — 睡眠周报</h1>
            <p className="text-center text-sm text-gray-600 mb-4">{formatWeekRange(monday)}</p>

            {doctorConclusions.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded">
                <p className="font-bold text-red-800 mb-2">🎯 医生关注重点</p>
                <div className="space-y-1.5">
                  {doctorConclusions.slice(0, 3).map((c, idx) => (
                    <div key={idx} className="text-sm">
                      <span className={cn(
                        'inline-block px-2 py-0.5 rounded text-xs font-bold mr-2',
                        CATEGORY_COLORS[c.category] || 'bg-gray-100 text-gray-700'
                      )}>
                        {c.category}
                      </span>
                      <span className="font-medium text-gray-800">{c.title}</span>
                      <span className="text-gray-600"> — {c.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="border p-2 text-left">日期</th>
                  <th className="border p-2 text-left">入睡时间</th>
                  <th className="border p-2 text-left">醒来次数</th>
                  <th className="border p-2 text-left">白天状态</th>
                  <th className="border p-2 text-left">晨间感受</th>
                  <th className="border p-2 text-left">服药备注</th>
                  <th className="border p-2 text-left">照护备忘</th>
                </tr>
              </thead>
              <tbody>
                {weekDays.map((day, i) => {
                  const iso = formatDateISO(day);
                  const record = recordMap.get(iso);
                  const careNote = careNoteMap.get(iso);
                  const careNoteSummary = careNote ? getCareNoteSummary(careNote) : [];
                  return (
                    <tr key={iso} className="border-b">
                      <td className="border p-2">
                        {DAY_NAMES[i]} {formatDateCN(day)}
                        {record?.isBackfilled && <span className="text-xs text-gray-400 ml-1">（补记）</span>}
                      </td>
                      <td className="border p-2">{record?.sleepTime || '—'}</td>
                      <td className="border p-2">
                        {record ? `${record.awakenings} 次` : '—'}
                      </td>
                      <td className="border p-2">
                        {record ? getSleepinessEmoji(record.sleepiness) + ' ' + SLEEPINESS_LABELS[record.sleepiness as 1 | 2 | 3] : '—'}
                      </td>
                      <td className="border p-2">
                        {record?.morningFeeling
                          ? getMorningFeelingEmoji(record.morningFeeling) + ' ' + MORNING_FEELING_LABELS[record.morningFeeling]
                          : '—'}
                      </td>
                      <td className="border p-2 text-xs">
                        {record?.medicationNote || '—'}
                      </td>
                      <td className="border p-2 text-xs">
                        {careNoteSummary.length > 0 ? careNoteSummary.join('、') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-bold">平均醒来次数</p>
                <p className="text-xl">{records.length > 0 ? avgAwakenings.toFixed(1) : '—'} 次</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-bold">平均白天状态</p>
                <p className="text-xl">
                  {avgSleepiness > 0 ? avgSleepiness.toFixed(1) + ' 分' : '—'}
                  {avgSleepiness > 0 && ` (${getSleepinessEmoji(Math.round(avgSleepiness))})`}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-bold">平均入睡时间</p>
                <p className="text-xl">{avgSleepTime ? minutesToSleepTime(avgSleepTime) : '—'}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <p className="font-bold">本周趋势</p>
                <p className="text-xl">{trendDisplay.icon} {trendDisplay.text}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded text-sm">
              <p className="font-bold text-indigo-800 mb-2">🏥 门诊沟通小结</p>
              <div className="space-y-1.5 text-gray-700">
                <p>
                  <span className="font-medium">⏰ 入睡晚的日子：</span>
                  {clinic.lateNights.length > 0 ? clinic.lateNights.join('、') : '无'}
                </p>
                <p>
                  <span className="font-medium">🌙 醒得多的日子：</span>
                  {clinic.manyAwakenings.length > 0 ? clinic.manyAwakenings.join('、') : '无'}
                </p>
                <p>
                  <span className="font-medium">😪 白天犯困的日子：</span>
                  {clinic.sleepyDays.length > 0 ? clinic.sleepyDays.join('、') : '无'}
                </p>
                <p>
                  <span className="font-medium">😞 晨起差的日子：</span>
                  {clinic.badMorningDays.length > 0 ? clinic.badMorningDays.join('、') : '无'}
                </p>
              </div>
              {clinic.multiIssueDays.length > 0 && (
                <div className="mt-2 pt-2 border-t border-indigo-200">
                  <p className="font-medium text-gray-800">⚠️ 同日多问题（需重点讨论）：</p>
                  <ul className="mt-1 text-xs text-gray-600">
                    {clinic.multiIssueDays.map((d, idx) => (
                      <li key={idx}>• {d.date}：{d.issues.join('、')}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {medChangeDays > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-sm">
                <p className="font-bold text-orange-800">💊 服药变化</p>
                <p className="text-orange-700 mt-1">
                  本周有 {medChangeDays} 天记录了服药变化，请注意区分药物效果和排程效果。
                </p>
                <ul className="mt-2 text-xs text-orange-600 space-y-1">
                  {records.filter(r => r.medicationNote?.trim()).map(r => (
                    <li key={r.id}>• {r.date}: {r.medicationNote}</li>
                  ))}
                </ul>
              </div>
            )}

            {careNoteDays > 0 && (
              <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded text-sm">
                <p className="font-bold text-teal-800">📝 重点照护备忘</p>
                <ul className="mt-2 text-xs text-teal-700 space-y-1">
                  {weekCareNotes.map((n) => {
                    const summary = getCareNoteSummary(n);
                    if (summary.length === 0) return null;
                    return (
                      <li key={n.id}>
                        • {formatDateCN(new Date(n.date))}：{summary.join('、')}
                        {n.otherNote && `（备注：${n.otherNote}）`}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {hasAbnormal && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="font-bold text-red-800">⚠️ 最近{abnormalDays}天连续状态不佳</p>
                <p className="text-red-700 mt-1">
                  建议联系专业睡眠医生进一步评估。
                </p>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500 text-center">
              本简报由「好眠排程」生成，仅供参考，不替代专业医疗建议
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
