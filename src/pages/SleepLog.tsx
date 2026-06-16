import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { type SleepRecord, SLEEPINESS_LABELS } from '@/types';
import { getTimeOptions, todayStr, generateId } from '@/utils/time';
import { cn } from '@/lib/utils';

const AWAKENING_OPTIONS = [0, 1, 2, 3, 4, 5];

const SLEEPINESS_CARDS = [
  { value: 1, emoji: '😊', text: '精神很好', selectedClass: 'border-green-400 bg-green-50' },
  { value: 2, emoji: '😐', text: '一般般', selectedClass: 'border-yellow-400 bg-yellow-50' },
  { value: 3, emoji: '😴', text: '犯困没精神', selectedClass: 'border-red-400 bg-red-50' },
] as const;

export default function SleepLog() {
  const addSleepRecord = useStore((s) => s.addSleepRecord);
  const updateSleepRecord = useStore((s) => s.updateSleepRecord);
  const getTodayRecord = useStore((s) => s.getTodayRecord);
  const familyMode = useStore((s) => s.familyMode);

  const existingRecord = getTodayRecord();

  const [sleepTime, setSleepTime] = useState('');
  const [awakenings, setAwakenings] = useState(-1);
  const [sleepiness, setSleepiness] = useState(0);
  const [medicationNote, setMedicationNote] = useState('');
  const [showMedication, setShowMedication] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const canSubmit = sleepTime !== '' && sleepiness !== 0;

  const d = new Date();
  const dateDisplay = `${d.getMonth() + 1}月${d.getDate()}日`;

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
        date: todayStr(),
        sleepTime,
        awakenings: awakenings === -1 ? 0 : awakenings,
        sleepiness,
        medicationNote,
        filledByFamily: familyMode,
        notes: '',
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
    const isToday = existingRecord.date === todayStr();
    const isRecent =
      Date.now() - new Date(existingRecord.createdAt).getTime() <
      24 * 60 * 60 * 1000;
    if (!isToday) return { canEdit: false, message: '历史记录不可修改' };
    if (familyMode) return { canEdit: true, message: '家属可修改今日记录' };
    if (isRecent) return { canEdit: true, message: '' };
    return { canEdit: false, message: '历史记录不可修改' };
  };

  if (existingRecord && !isEditing) {
    const editInfo = getEditInfo();
    return (
      <div className="min-h-screen p-6 space-y-6 animate-fade-in">
        <div className="elder-card text-center space-y-4">
          <div className="text-elder-xl font-bold">今日已记录 ✓</div>
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
            <span className="text-warm-600">今日状态</span>
            <span>{SLEEPINESS_LABELS[existingRecord.sleepiness as 1 | 2 | 3]}</span>
          </div>
          {existingRecord.medicationNote && (
            <div className="flex justify-between text-elder-base">
              <span className="text-warm-600">服药备注</span>
              <span>{existingRecord.medicationNote}</span>
            </div>
          )}
          {existingRecord.filledByFamily && (
            <div className="text-elder-sm text-warm-400">由家属代填</div>
          )}
        </div>

        {editInfo && (
          <>
            {editInfo.message && (
              <div className="text-elder-sm text-warm-500 text-center">
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
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-elder-xl font-bold">📋 睡眠记录</h1>
        <div className="text-elder-base text-warm-600">{dateDisplay}</div>
      </div>

      <div className="elder-card space-y-4">
        <div className="text-elder-lg font-bold">昨晚几点睡的？</div>
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
        <div className="text-elder-lg font-bold">昨晚醒了几次？</div>
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
        <div className="text-elder-lg font-bold">今天感觉怎么样？</div>
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
        {saved ? '记录已保存 ✓' : '✅ 保存记录'}
      </button>
    </div>
  );
}
