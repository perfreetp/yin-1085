import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { type SleepRecord, SLEEPINESS_LABELS } from '@/types';
import { getTimeOptions, todayStr, generateId } from '@/utils/time';
import { cn } from '@/lib/utils';
import {
  Lock,
  Printer,
  AlertTriangle,
  LogOut,
  HeartHandshake,
  ClipboardList,
  Pencil,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

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

export default function Family() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const familyMode = useStore((s) => s.familyMode);
  const setFamilyMode = useStore((s) => s.setFamilyMode);
  const addSleepRecord = useStore((s) => s.addSleepRecord);
  const updateSleepRecord = useStore((s) => s.updateSleepRecord);
  const getTodayRecord = useStore((s) => s.getTodayRecord);
  const getRecordByDate = useStore((s) => s.getRecordByDate);
  const sleepRecords = useStore((s) => s.sleepRecords);
  const checkConsecutiveAbnormal = useStore((s) => s.checkConsecutiveAbnormal);
  const getConsecutiveAbnormalDays = useStore((s) => s.getConsecutiveAbnormalDays);
  const getCompanionAdvice = useStore((s) => s.getCompanionAdvice);

  const [activeTab, setActiveTab] = useState<'fill' | 'history' | 'advice'>('fill');
  const [pinInput, setPinInput] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const recentDays = useMemo(() => getRecentDays(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const [sleepTime, setSleepTime] = useState('');
  const [awakenings, setAwakenings] = useState(-1);
  const [sleepiness, setSleepiness] = useState(0);
  const [medicationNote, setMedicationNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const dayInfo = recentDays.find((d) => d.iso === selectedDate) || recentDays[recentDays.length - 1];
  const isBackfill = !dayInfo.isToday;
  const existingRecord = getRecordByDate(selectedDate);
  const canSubmit = sleepTime !== '' && sleepiness !== 0;
  const hasAbnormal = checkConsecutiveAbnormal();
  const abnormalDays = getConsecutiveAbnormalDays();
  const companionAdvice = getCompanionAdvice();
  const recentRecords = useMemo(() => {
    return [...sleepRecords]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);
  }, [sleepRecords]);

  const handleSelectDate = (iso: string) => {
    setSelectedDate(iso);
    setIsEditing(false);
    setSaved(false);
    setSleepTime('');
    setAwakenings(-1);
    setSleepiness(0);
    setMedicationNote('');
  };

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
        date: selectedDate,
        sleepTime,
        awakenings: awakenings === -1 ? 0 : awakenings,
        sleepiness,
        medicationNote,
        filledByFamily: true,
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
    }, 2000);
  }

  function handleEditRecord(record: SleepRecord) {
    const recordDate = new Date(record.date);
    const todayDate = new Date(todayStr());
    const diffDays = Math.round(
      (todayDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 7) return;

    setSelectedDate(record.date);
    setSleepTime(record.sleepTime);
    setAwakenings(record.awakenings);
    setSleepiness(record.sleepiness);
    setMedicationNote(record.medicationNote);
    setIsEditing(true);
    setActiveTab('fill');
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
                  ⚠️ 最近{abnormalDays}天连续睡眠状态不佳
                </p>
                <p className="text-elder-sm text-danger-text/80 mt-1">
                  建议联系专业睡眠医生咨询
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

        <div className="flex gap-2 no-print">
          <button
            onClick={() => setActiveTab('fill')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-elder text-elder-sm font-bold min-h-[52px] transition-colors',
              activeTab === 'fill'
                ? 'bg-orange-500 text-white'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            )}
          >
            <Pencil className="w-5 h-5" />
            代填记录
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-elder text-elder-sm font-bold min-h-[52px] transition-colors',
              activeTab === 'history'
                ? 'bg-orange-500 text-white'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            )}
          >
            <ClipboardList className="w-5 h-5" />
            最近记录
          </button>
          <button
            onClick={() => setActiveTab('advice')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-elder text-elder-sm font-bold min-h-[52px] transition-colors',
              activeTab === 'advice'
                ? 'bg-orange-500 text-white'
                : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
            )}
          >
            <HeartHandshake className="w-5 h-5" />
            陪伴建议
          </button>
        </div>

        {activeTab === 'fill' && (
          <div className="elder-card space-y-5 no-print">
            <div className="flex items-center justify-between">
              <h2 className="text-elder-lg font-bold text-warm-800">
                📝 {isBackfill ? '补记睡眠记录' : '帮长辈记录昨晚睡眠'}
              </h2>
              {isEditing && (
                <span className="text-elder-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg font-medium">
                  修改中
                </span>
              )}
            </div>

            <div className="text-elder-sm text-warm-600 text-center bg-warm-50 rounded-elder p-3">
              {dayInfo.dayLabel} {new Date(selectedDate).getMonth() + 1}月{new Date(selectedDate).getDate()}日
              {isBackfill && <span className="ml-2 text-amber-600">（补记）</span>}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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

            <div className="space-y-3">
              <p className="text-elder-base font-bold">
                {isBackfill ? '那天晚上几点睡的？' : '昨晚几点睡的？'}
              </p>
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
              <p className="text-elder-base font-bold">
                {isBackfill ? '那天夜里醒了几次？' : '昨晚醒了几次？'}
              </p>
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
              <p className="text-elder-base font-bold">
                {isBackfill ? '那天白天感觉怎么样？' : '今天感觉怎么样？'}
              </p>
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
              {saved ? '记录已保存 ✓' : isEditing ? '✅ 修改记录' : isBackfill ? '📝 保存补记' : '✅ 保存记录'}
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="elder-card space-y-4 no-print">
            <h2 className="text-elder-lg font-bold text-warm-800">📊 最近7天记录</h2>
            {recentRecords.length === 0 ? (
              <p className="text-elder-base text-warm-500 text-center py-4">暂无记录</p>
            ) : (
              <div className="space-y-3">
                {recentRecords.map((record) => {
                  const recordDate = new Date(record.date);
                  const todayDate = new Date(todayStr());
                  const diffDays = Math.round(
                    (todayDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const canEdit = diffDays <= 7;
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 bg-warm-50 rounded-elder p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-elder-sm font-bold text-warm-800">
                            {record.date}
                          </span>
                          {record.filledByFamily && (
                            <span className="text-elder-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                              家属代填
                            </span>
                          )}
                          {record.isBackfilled && (
                            <span className="text-elder-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              补记
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
                      {canEdit ? (
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
        )}

        {activeTab === 'advice' && (
          <div className="space-y-4 no-print">
            <div className="elder-card">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-warm-100">
                <HeartHandshake className="w-7 h-7 text-pink-500" />
                <div>
                  <h2 className="text-elder-lg font-bold text-warm-800">💝 陪伴建议</h2>
                  <p className="text-elder-xs text-warm-500 mt-0.5">
                    结合最近一周情况给出的参考建议
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-amber-50 rounded-elder p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {companionAdvice.avgSleepiness.toFixed(1)}
                  </p>
                  <p className="text-elder-xs text-amber-600 mt-1">平均犯困指数</p>
                </div>
                <div className="bg-purple-50 rounded-elder p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {companionAdvice.avgAwakenings.toFixed(1)}
                  </p>
                  <p className="text-elder-xs text-purple-600 mt-1">平均夜醒次数</p>
                </div>
                <div className="bg-sleep-50 rounded-elder p-3 text-center">
                  <p className="text-2xl font-bold text-sleep-700">
                    {formatSleepTime(companionAdvice.avgBedtime)}
                  </p>
                  <p className="text-elder-xs text-sleep-600 mt-1">平均入睡时间</p>
                </div>
              </div>
            </div>

            <div className="elder-card bg-green-50/50 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <h3 className="text-elder-base font-bold text-green-800">
                  ✅ 建议这样做
                </h3>
              </div>
              <ul className="space-y-3">
                {companionAdvice.dos.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 text-elder-sm mt-0.5 flex-shrink-0">•</span>
                    <span className="text-elder-sm text-green-800 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="elder-card bg-red-50/50 border-2 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <h3 className="text-elder-base font-bold text-red-800">
                  ❌ 建议不要做
                </h3>
              </div>
              <ul className="space-y-3">
                {companionAdvice.donts.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 text-elder-sm mt-0.5 flex-shrink-0">•</span>
                    <span className="text-elder-sm text-red-800 leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="elder-card bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-pink-500 flex-shrink-0" />
                <h3 className="text-elder-base font-bold text-pink-800">
                  🌟 最关键的原则
                </h3>
              </div>
              <div className="bg-white/70 rounded-elder p-4">
                <p className="text-elder-sm text-pink-900 leading-loose">
                  睡眠是一个自然的过程，<b>越焦虑越难睡好</b>。
                  作为家属，我们能做的最重要的事，是<b>让长辈觉得"睡得不好也没关系"</b>，
                  而不是反复提醒他/她"要睡觉"。多陪伴，少催促，
                  把规律的作息变成习惯，就像每天散步一样自然。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="no-print">
          <button
            onClick={() => navigate('/review')}
            className="elder-btn-secondary w-full flex items-center justify-center gap-3"
          >
            <Printer className="w-6 h-6" />
            🖨️ 查看阶段回顾并打印简报
          </button>
        </div>
      </div>
    </div>
  );
}

const SNOOZE_EMOJI: Record<1 | 2 | 3, string> = {
  1: '😊',
  2: '😐',
  3: '😴',
};

function formatSleepTime(totalMin: number): string {
  let m = Math.round(totalMin) % (24 * 60);
  if (m < 0) m += 24 * 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${mm.toString().padStart(2, '0')}`;
}
