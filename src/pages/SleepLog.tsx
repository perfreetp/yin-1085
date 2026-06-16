import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { type SleepRecord, SLEEPINESS_LABELS } from '@/types';
import { getTimeOptions, todayStr, generateId } from '@/utils/time';
import { cn } from '@/lib/utils';
import { Lock, PencilLine } from 'lucide-react';

const AWAKENING_OPTIONS = [0, 1, 2, 3, 4, 5];

const SLEEPINESS_CARDS = [
  { value: 1, emoji: '😊', text: '精神很好', selectedClass: 'border-green-400 bg-green-50' },
  { value: 2, emoji: '😐', text: '一般般', selectedClass: 'border-yellow-400 bg-yellow-50' },
  { value: 3, emoji: '😴', text: '犯困没精神', selectedClass: 'border-red-400 bg-red-50' },
] as const;

function getRecentDays(): { iso: string; label: string; dayLabel: string; isToday: boolean }[] {
  const result = [];
  const today = new Date();
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({
      iso,
      label,
      dayLabel: i === 0 ? '今天' : i === 1 ? '昨天' : dayNames[d.getDay()],
      isToday: i === 0,
    });
  }
  return result;
}

export default function SleepLog() {
  const addSleepRecord = useStore((s) => s.addSleepRecord);
  const updateSleepRecord = useStore((s) => s.updateSleepRecord);
  const getTodayRecord = useStore((s) => s.getTodayRecord);
  const getRecordByDate = useStore((s) => s.getRecordByDate);
  const familyMode = useStore((s) => s.familyMode);

  const recentDays = useMemo(() => getRecentDays(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const existingRecord = getRecordByDate(selectedDate);
  const dayInfo = recentDays.find((d) => d.iso === selectedDate) || recentDays[recentDays.length - 1];
  const isBackfill = !dayInfo.isToday;
  const isToday = dayInfo.isToday;

  const [sleepTime, setSleepTime] = useState('');
  const [awakenings, setAwakenings] = useState(-1);
  const [sleepiness, setSleepiness] = useState(0);
  const [medicationNote, setMedicationNote] = useState('');
  const [showMedication, setShowMedication] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const canSubmit = sleepTime !== '' && sleepiness !== 0;

  const handleSelectDate = (iso: string) => {
    setSelectedDate(iso);
    setIsEditing(false);
    setSaved(false);
    setSleepTime('');
    setAwakenings(-1);
    setSleepiness(0);
    setMedicationNote('');
    setShowMedication(false);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (isEditing && existingRecord) {
      updateSleepRecord(existingRecord.id, {
        sleepTime,
        awakenings: awakenings === -1 ? 0 : awakenings,
        sleepiness,
        medicationNote,
        filledByFamily: familyMode,
      });
    } else {
      const record: SleepRecord = {
        id: generateId(),
        date: selectedDate,
        sleepTime,
        awakenings: awakenings === -1 ? 0 : awakenings,
        sleepiness,
        medicationNote,
        filledByFamily: familyMode,
        notes: '',
        isBackfilled: isBackfill,
        backfilledAt: isBackfill ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      };
      addSleepRecord(record);
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsEditing(false);
      setSleepTime('');
      setAwakenings(-1);
      setSleepiness(0);
      setMedicationNote('');
      setShowMedication(false);
    }, 2000);
  };

  const handleEdit = () => {
    if (!existingRecord) return;
    setSleepTime(existingRecord.sleepTime);
    setAwakenings(existingRecord.awakenings);
    setSleepiness(existingRecord.sleepiness);
    setMedicationNote(existingRecord.medicationNote);
    if (existingRecord.medicationNote) setShowMedication(true);
    setIsEditing(true);
  };

  const getEditInfo = () => {
    if (!existingRecord) return null;
    const recordDate = new Date(existingRecord.date);
    const todayDate = new Date(todayStr());
    const diffDays = Math.round(
      (todayDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (familyMode) {
      if (diffDays <= 7) return { canEdit: true, message: '家属可修改最近7天记录' };
      return { canEdit: false, message: '超过7天的历史记录不可修改' };
    }

    if (existingRecord.isBackfilled) {
      const backfilledAt = existingRecord.backfilledAt
        ? new Date(existingRecord.backfilledAt)
        : new Date(existingRecord.createdAt);
      const canEdit = Date.now() - backfilledAt.getTime() < 24 * 60 * 60 * 1000;
      return {
        canEdit,
        message: canEdit ? '补记后24小时内可修改' : '补记超过24小时不可修改',
      };
    }

    const isRecent =
      Date.now() - new Date(existingRecord.createdAt).getTime() <
      24 * 60 * 60 * 1000;
    if (!isToday) return { canEdit: false, message: '非当日记录请家属代改' };
    if (isRecent) return { canEdit: true, message: '' };
    return { canEdit: false, message: '超过24小时请家属代改' };
  };

  const dateDisplay = `${dayInfo.dayLabel} ${new Date(selectedDate).getMonth() + 1}月${new Date(selectedDate).getDate()}日`;

  if (existingRecord && !isEditing) {
    const editInfo = getEditInfo();
    return (
      <div className="min-h-screen p-6 space-y-6 animate-fade-in">
        <div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            {recentDays.map((d) => {
              const r = getRecordByDate(d.iso);
              return (
                <button
                  key={d.iso}
                  onClick={() => handleSelectDate(d.iso)}
                  className={cn(
                    'flex-shrink-0 w-16 rounded-elder p-2 flex flex-col items-center border-2 transition-all',
                    selectedDate === d.iso
                      ? 'bg-warm-400 text-white border-warm-400'
                      : r
                      ? 'bg-warm-50 text-warm-700 border-warm-200'
                      : 'bg-white text-warm-400 border-warm-200 border-dashed'
                  )}
                >
                  <span className="text-elder-xs font-bold">{d.dayLabel}</span>
                  <span className="text-elder-sm font-bold mt-0.5">{d.label}</span>
                  {r && (
                    <span className="text-sm mt-0.5">
                      {selectedDate === d.iso ? '✓' : SNOOZE_EMOJI[r.sleepiness as 1 | 2 | 3] || '✓'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="elder-card text-center space-y-4">
            <div className="text-elder-xl font-bold flex items-center justify-center gap-2">
              {isBackfill ? '补记完成' : '今日已记录'} ✓
              {existingRecord.isBackfilled && (
                <span className="text-elder-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-normal">
                  补记
                </span>
              )}
            </div>
            <div className="text-elder-base text-warm-600">{dateDisplay}</div>
          </div>

          <div className="elder-card space-y-4">
            <div className="flex justify-between text-elder-base">
              <span className="text-warm-600">入睡时间</span>
              <span>{existingRecord.sleepTime}</span>
            </div>
            <div className="flex justify-between text-elder-base">
              <span className="text-warm-600">醒来次数</span>
              <span>{existingRecord.awakenings}次</span>
            </div>
            <div className="flex justify-between text-elder-base">
              <span className="text-warm-600">白天状态</span>
              <span>{SLEEPINESS_LABELS[existingRecord.sleepiness as 1 | 2 | 3]}</span>
            </div>
            {existingRecord.medicationNote && (
              <div className="flex justify-between text-elder-base">
                <span className="text-warm-600">服药备注</span>
                <span>{existingRecord.medicationNote}</span>
              </div>
            )}
            {existingRecord.filledByFamily && (
              <div className="text-elder-sm text-sleep-600 bg-sleep-50 rounded-lg p-2">
                由家属代填
              </div>
            )}
          </div>

          {editInfo && (
            <>
              {editInfo.message && (
                <div className="text-elder-sm text-warm-500 text-center flex items-center justify-center gap-1">
                  {editInfo.canEdit ? <PencilLine className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {editInfo.message}
                </div>
              )}
              {editInfo.canEdit && (
                <button
                  className="elder-btn-secondary w-full"
                  onClick={handleEdit}
                >
                  修改
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-elder-xl font-bold">
          📋 {isBackfill ? '补记睡眠记录' : '睡眠记录'}
        </h1>
        <div className="text-elder-base text-warm-600">{dateDisplay}</div>
        {isBackfill && (
          <div className="text-elder-sm text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-xl">
            📝 这是补记，将标记为补记记录
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {recentDays.map((d) => {
          const r = getRecordByDate(d.iso);
          const isSelected = selectedDate === d.iso;
          return (
            <button
              key={d.iso}
              onClick={() => handleSelectDate(d.iso)}
              className={cn(
                'flex-shrink-0 w-16 rounded-elder p-2 flex flex-col items-center border-2 transition-all',
                isSelected
                  ? 'bg-warm-400 text-white border-warm-400'
                  : r
                  ? 'bg-warm-50 text-warm-700 border-warm-200'
                  : 'bg-white text-warm-400 border-warm-200 border-dashed hover:border-warm-400'
              )}
            >
              <span className="text-elder-xs font-bold">{d.dayLabel}</span>
              <span className="text-elder-sm font-bold mt-0.5">{d.label}</span>
              {r ? (
                <span className="text-sm mt-0.5">
                  {isSelected ? '✓' : SNOOZE_EMOJI[r.sleepiness as 1 | 2 | 3] || '✓'}
                </span>
              ) : (
                <span className="text-lg mt-0.5 opacity-50">+</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="elder-card space-y-4">
        <div className="text-elder-lg font-bold">
          {isBackfill ? '那天晚上几点睡的？' : '昨晚几点睡的？'}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {getTimeOptions().map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSleepTime(opt.value)}
              className={cn(
                'elder-card text-elder-base min-h-[56px] flex items-center justify-center p-2',
                sleepTime === opt.value && 'ring-4 ring-warm-400 bg-warm-100'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="elder-card space-y-4">
        <div className="text-elder-lg font-bold">
          {isBackfill ? '那天夜里醒了几次？' : '昨晚醒了几次？'}
        </div>
        <div className="flex justify-between gap-3">
          {AWAKENING_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setAwakenings(n)}
              className={cn(
                'w-16 h-16 rounded-full text-elder-base font-bold flex items-center justify-center border-2 border-warm-200',
                awakenings === n && 'bg-warm-400 text-white ring-4 ring-warm-300'
              )}
            >
              {n === 5 ? '5+' : n}
            </button>
          ))}
        </div>
      </div>

      <div className="elder-card space-y-4">
        <div className="text-elder-lg font-bold">
          {isBackfill ? '那天白天感觉怎么样？' : '今天感觉怎么样？'}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {SLEEPINESS_CARDS.map((card) => (
            <button
              key={card.value}
              onClick={() => setSleepiness(card.value)}
              className={cn(
                'elder-card flex flex-col items-center justify-center py-6 border-2 border-transparent min-h-[100px]',
                sleepiness === card.value && card.selectedClass
              )}
            >
              <span className="text-4xl mb-2">{card.emoji}</span>
              <span className="text-elder-sm">{card.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="elder-card">
        <button
          className="w-full flex items-center justify-between text-elder-base font-bold"
          onClick={() => setShowMedication(!showMedication)}
        >
          <span>💊 服药备注（可选）</span>
          <span
            className={cn('transition-transform', showMedication && 'rotate-180')}
          >
            ▼
          </span>
        </button>
        {showMedication && (
          <div className="mt-4 space-y-2">
            <textarea
              className="w-full border-2 border-warm-200 rounded-elder p-4 text-elder-base min-h-[120px] resize-none focus:outline-none focus:border-warm-400"
              placeholder="记录服药情况..."
              value={medicationNote}
              onChange={(e) => setMedicationNote(e.target.value)}
            />
            <div className="text-elder-xs text-warm-500">
              记录安眠药或助眠药物的变化，方便区分药物效果和排程效果
            </div>
          </div>
        )}
      </div>

      <button
        className={cn(
          'elder-btn-primary w-full',
          !canSubmit && 'opacity-50 cursor-not-allowed'
        )}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {saved ? '记录已保存 ✓' : isBackfill ? '📝 保存补记' : '✅ 保存记录'}
      </button>
    </div>
  );
}

const SNOOZE_EMOJI: Record<1 | 2 | 3, string> = {
  1: '😊',
  2: '😐',
  3: '😴',
};
