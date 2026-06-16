import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { type SleepRecord, SLEEPINESS_LABELS } from '@/types';
import { getTimeOptions, todayStr, generateId } from '@/utils/time';
import { cn } from '@/lib/utils';
import { Lock, Printer, AlertTriangle, LogOut } from 'lucide-react';

const AWAKENING_OPTIONS = [0, 1, 2, 3, 4, 5];

const SLEEPINESS_CARDS = [
  { value: 1, emoji: '😊', text: '精神很好', selectedClass: 'border-green-400 bg-green-50' },
  { value: 2, emoji: '😐', text: '一般般', selectedClass: 'border-yellow-400 bg-yellow-50' },
  { value: 3, emoji: '😴', text: '犯困没精神', selectedClass: 'border-red-400 bg-red-50' },
] as const;

const NUMPAD = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [null, 0, 'del'],
];

export default function Family() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const familyMode = useStore((s) => s.familyMode);
  const setFamilyMode = useStore((s) => s.setFamilyMode);
  const addSleepRecord = useStore((s) => s.addSleepRecord);
  const updateSleepRecord = useStore((s) => s.updateSleepRecord);
  const getTodayRecord = useStore((s) => s.getTodayRecord);
  const sleepRecords = useStore((s) => s.sleepRecords);
  const checkConsecutiveAbnormal = useStore((s) => s.checkConsecutiveAbnormal);

  const [pinInput, setPinInput] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [sleepTime, setSleepTime] = useState('');
  const [awakenings, setAwakenings] = useState(-1);
  const [sleepiness, setSleepiness] = useState(0);
  const [medicationNote, setMedicationNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const existingRecord = getTodayRecord();
  const canSubmit = sleepTime !== '' && sleepiness !== 0;
  const hasAbnormal = checkConsecutiveAbnormal();
  const recentRecords = [...sleepRecords]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  function handlePinDigit(digit: number | string | null) {
    if (digit === null) return;
    if (digit === 'del') {
      const newPin = [...pinInput];
      const lastFilled = newPin.reduce((acc, d, i) => (d !== '' ? i : acc), -1);
      if (lastFilled >= 0) {
        newPin[lastFilled] = '';
        setPinInput(newPin);
      }
      return;
    }
    const newPin = [...pinInput];
    const firstEmpty = newPin.findIndex((d) => d === '');
    if (firstEmpty >= 0) {
      newPin[firstEmpty] = String(digit);
      setPinInput(newPin);
      if (firstEmpty === 3) {
        const entered = newPin.join('');
        const correct = profile?.familyPin || '0000';
        if (entered === correct) {
          setFamilyMode(true);
          setPinInput(['', '', '', '']);
          setPinError(false);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPinInput(['', '', '', '']);
            setPinError(false);
          }, 600);
        }
      }
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;
    if (isEditing && existingRecord) {
      updateSleepRecord(existingRecord.id, {
        sleepTime,
        awakenings: awakenings === -1 ? 0 : awakenings,
        sleepiness,
        medicationNote,
        filledByFamily: true,
      });
    } else {
      const record: SleepRecord = {
        id: generateId(),
        date: todayStr(),
        sleepTime,
        awakenings: awakenings === -1 ? 0 : awakenings,
        sleepiness,
        medicationNote,
        filledByFamily: true,
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
    }, 2000);
  }

  function handleEditRecord(record: SleepRecord) {
    if (record.date !== todayStr()) return;
    setSleepTime(record.sleepTime);
    setAwakenings(record.awakenings);
    setSleepiness(record.sleepiness);
    setMedicationNote(record.medicationNote);
    setIsEditing(true);
  }

  if (!familyMode) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
        <div className="elder-card max-w-md w-full mx-auto space-y-8 text-center">
          <Lock className="w-16 h-16 text-warm-400 mx-auto" />
          <h1 className="text-elder-xl font-bold text-warm-800">🔐 家属协助模式</h1>
          <p className="text-elder-base text-warm-600">请输入4位协助密码</p>

          <div className="flex justify-center gap-4">
            {pinInput.map((digit, i) => (
              <div
                key={i}
                className={cn(
                  'w-16 h-20 rounded-elder border-2 flex items-center justify-center text-elder-xl bg-white transition-colors',
                  pinError ? 'border-red-400 animate-[shake_0.3s_ease-in-out]' : 'border-warm-300',
                  digit && 'border-warm-500 bg-warm-50'
                )}
              >
                {digit ? '●' : ''}
              </div>
            ))}
          </div>

          {pinError && (
            <p className="text-red-600 text-elder-base animate-fade-in">
              密码不对，请再试一次
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {NUMPAD.flat().map((key, i) => (
              <button
                key={i}
                onClick={() => handlePinDigit(key)}
                className={cn(
                  'rounded-elder text-elder-xl font-bold min-h-[56px] transition-all active:scale-95 select-none',
                  key === 'del'
                    ? 'bg-warm-200 text-warm-700 col-start-2'
                    : key === null
                    ? 'invisible'
                    : 'bg-warm-100 text-warm-800 hover:bg-warm-200'
                )}
              >
                {key === 'del' ? '⌫' : key}
              </button>
            ))}
          </div>

          <p className="text-elder-xs text-warm-400">
            默认密码为设置时输入的4位数字
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-8">
      <div className="bg-orange-500 text-white px-6 py-4 flex items-center justify-between no-print">
        <span className="text-elder-base font-bold">👤 家属代填模式</span>
        <button
          onClick={() => setFamilyMode(false)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 rounded-elder px-4 py-2 min-h-[44px] transition-colors"
        >
          <LogOut className="w-5 h-5" />
          退出
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {hasAbnormal && !alertDismissed && (
          <div className="no-print bg-danger-bg border-2 border-danger-border rounded-elder p-5 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-8 h-8 text-danger-text flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-elder-base font-bold text-danger-text">
                  ⚠️ 连续多天睡眠状态不佳，建议联系专业睡眠医生
                </p>
              </div>
            </div>
            <button
              onClick={() => setAlertDismissed(true)}
              className="elder-btn-ghost w-full mt-3"
            >
              知道了
            </button>
          </div>
        )}

        <div className="elder-card space-y-5 no-print">
          <h2 className="text-elder-lg font-bold text-warm-800">📝 帮长辈记录昨晚睡眠</h2>

          <div className="space-y-3">
            <p className="text-elder-base font-bold">昨晚几点睡的？</p>
            <div className="grid grid-cols-4 gap-2">
              {getTimeOptions().map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSleepTime(opt.value)}
                  className={cn(
                    'bg-white rounded-elder py-2 text-elder-sm min-h-[48px] border-2 transition-all select-none',
                    sleepTime === opt.value
                      ? 'border-warm-400 bg-warm-100 text-warm-800'
                      : 'border-warm-200 text-warm-700 hover:bg-warm-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-elder-base font-bold">昨晚醒了几次？</p>
            <div className="flex gap-2">
              {AWAKENING_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setAwakenings(n)}
                  className={cn(
                    'w-14 h-14 rounded-full text-elder-base font-bold flex items-center justify-center border-2 border-warm-200 transition-all select-none',
                    awakenings === n
                      ? 'bg-warm-400 text-white border-warm-400'
                      : 'bg-white text-warm-700 hover:bg-warm-50'
                  )}
                >
                  {n === 5 ? '5+' : n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-elder-base font-bold">今天感觉怎么样？</p>
            <div className="grid grid-cols-3 gap-3">
              {SLEEPINESS_CARDS.map((card) => (
                <button
                  key={card.value}
                  onClick={() => setSleepiness(card.value)}
                  className={cn(
                    'elder-card flex flex-col items-center justify-center py-4 border-2 border-transparent min-h-[80px] transition-all select-none',
                    sleepiness === card.value && card.selectedClass
                  )}
                >
                  <span className="text-3xl mb-1">{card.emoji}</span>
                  <span className="text-elder-xs">{card.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-elder-base font-bold mb-2">💊 服药备注（可选）</p>
            <textarea
              className="w-full border-2 border-warm-200 rounded-elder p-3 text-elder-sm min-h-[80px] resize-none focus:outline-none focus:border-warm-400 bg-white"
              placeholder="记录安眠药变化..."
              value={medicationNote}
              onChange={(e) => setMedicationNote(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'elder-btn-primary w-full',
              !canSubmit && 'opacity-50 cursor-not-allowed'
            )}
          >
            {saved ? '记录已保存 ✓' : isEditing ? '✅ 修改记录' : '✅ 保存记录'}
          </button>
        </div>

        <div className="elder-card space-y-4 no-print">
          <h2 className="text-elder-lg font-bold text-warm-800">📊 最近7天记录</h2>
          {recentRecords.length === 0 ? (
            <p className="text-elder-base text-warm-500 text-center py-4">暂无记录</p>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record) => {
                const isToday = record.date === todayStr();
                return (
                  <div
                    key={record.id}
                    className="flex items-center gap-3 bg-warm-50 rounded-elder p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-elder-sm font-bold text-warm-800">
                          {record.date}
                        </span>
                        {record.filledByFamily && (
                          <span className="text-elder-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                            家属代填
                          </span>
                        )}
                      </div>
                      <div className="text-elder-sm text-warm-600 mt-1">
                        入睡 {record.sleepTime} · 醒来 {record.awakenings}次 ·{' '}
                        {SLEEPINESS_LABELS[record.sleepiness as 1 | 2 | 3]}
                      </div>
                      {record.medicationNote && (
                        <div className="text-elder-xs text-warm-500 mt-1">
                          💊 {record.medicationNote}
                        </div>
                      )}
                    </div>
                    {isToday ? (
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="text-elder-sm text-sleep-500 font-bold min-h-[44px] px-3"
                      >
                        🔓 修改
                      </button>
                    ) : (
                      <span className="text-elder-xs text-warm-400 flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        不可改
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="no-print">
          <button
            onClick={() => navigate('/review')}
            className="elder-btn-secondary w-full flex items-center justify-center gap-3"
          >
            <Printer className="w-6 h-6" />
            🖨️ 打印本周简报
          </button>
        </div>
      </div>
    </div>
  );
}
