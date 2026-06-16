import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { SleepRecord } from '@/types';
import { getSleepinessEmoji, getSleepinessColor } from '@/utils/time';
import { AlertTriangle, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

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
  if (trend === 'improving') return { icon: '📈', text: '趋势向好' };
  if (trend === 'stable') return { icon: '➡️', text: '保持稳定' };
  return { icon: '📉', text: '需要注意' };
}

export default function Review() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedMedDay, setExpandedMedDay] = useState<string | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const getWeekRecords = useStore((s) => s.getWeekRecords);
  const checkConsecutiveAbnormal = useStore((s) => s.checkConsecutiveAbnormal);
  const getWeekTrend = useStore((s) => s.getWeekTrend);

  const monday = getWeekStartDate(weekOffset);
  const weekStartISO = formatDateISO(monday);

  const records = getWeekRecords(weekStartISO);
  const hasAbnormal = checkConsecutiveAbnormal();
  const trend = getWeekTrend();

  const recordMap = new Map<string, SleepRecord>();
  for (const r of records) {
    recordMap.set(r.date, r);
  }

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const avgSleepiness =
    records.length > 0
      ? records.reduce((s, r) => s + r.sleepiness, 0) / records.length
      : 0;
  const avgAwakenings =
    records.length > 0
      ? records.reduce((s, r) => s + r.awakenings, 0) / records.length
      : 0;

  const trendDisplay = getTrendDisplay(trend);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {hasAbnormal && !alertDismissed && (
        <div className="no-print bg-danger-bg border-2 border-danger-border rounded-elder p-6 mb-6 animate-fade-in">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-10 h-10 text-danger-text flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-elder-lg font-bold text-danger-text">
                ⚠️ 连续多天睡眠状态不佳，建议尽快联系专业睡眠医生
              </p>
              <p className="text-elder-base text-danger-text/80 mt-2">
                拨打电话建议：可拨打当地医院睡眠科电话
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="elder-btn-secondary mt-4 w-full"
          >
            我知道了
          </button>
        </div>
      )}

      <div className="no-print flex items-center justify-between mb-6">
        <h1 className="text-elder-xl font-bold">📊 阶段回顾</h1>
        <span className="text-elder-sm text-warm-600">{formatWeekRange(monday)}</span>
      </div>

      <div className="no-print flex items-center gap-3 mb-6">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="elder-btn-ghost flex items-center gap-2"
        >
          <ChevronLeft className="w-6 h-6" />
          查看上周
        </button>
        <span className="text-elder-sm text-warm-600">
          {weekOffset === 0 ? '本周' : weekOffset === -1 ? '上周' : `${Math.abs(weekOffset)}周前`}
        </span>
        <button
          onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
          disabled={weekOffset === 0}
          className={cn(
            'elder-btn-ghost flex items-center gap-2',
            weekOffset === 0 && 'opacity-40 pointer-events-none'
          )}
        >
          查看下周
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="no-print elder-card mb-6">
        <h2 className="text-elder-lg font-bold mb-4">本周趋势</h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const iso = formatDateISO(day);
            const record = recordMap.get(iso);
            const isToday = iso === formatDateISO(new Date());

            return (
              <div
                key={iso}
                className={cn(
                  'flex flex-col items-center rounded-elder p-2 transition-all',
                  isToday && 'ring-2 ring-warm-400'
                )}
              >
                <span className="text-elder-xs font-medium text-warm-600">
                  {DAY_NAMES[i]}
                </span>
                <span className="text-elder-xs text-warm-500">
                  {formatDateCN(day)}
                </span>

                {record ? (
                  <>
                    <span className="text-4xl mt-1">
                      {getSleepinessEmoji(record.sleepiness)}
                    </span>
                    <div
                      className={cn(
                        'w-full min-h-[60px] rounded-lg mt-1 flex flex-col items-center justify-center',
                        getSleepinessColor(record.sleepiness)
                      )}
                    >
                      {record.medicationNote && (
                        <span
                          className="text-lg cursor-pointer"
                          onClick={() =>
                            setExpandedMedDay(expandedMedDay === iso ? null : iso)
                          }
                        >
                          📋
                        </span>
                      )}
                      <span className="text-elder-xs font-medium mt-0.5">
                        醒来 {record.awakenings} 次
                      </span>
                    </div>
                    {expandedMedDay === iso && record.medicationNote && (
                      <div className="mt-1 text-elder-xs text-warm-700 bg-warm-50 rounded-lg p-2 w-full text-center">
                        {record.medicationNote}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-4xl mt-1 opacity-30">—</span>
                    <div className="w-full min-h-[60px] rounded-lg mt-1 bg-warm-100 flex items-center justify-center">
                      <span className="text-elder-xs text-warm-400">未记录</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-elder-xs text-warm-500 flex items-center gap-2">
          <span>📋 = 有服药变化备注</span>
        </div>
      </div>

      <div className="no-print elder-card mb-6">
        <h2 className="text-elder-lg font-bold mb-4">本周总结</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center bg-warm-50 rounded-elder p-4">
            <span className="text-4xl">{getSleepinessEmoji(Math.round(avgSleepiness))}</span>
            <span className="text-elder-sm font-medium mt-2">白天状态</span>
            <span className="text-elder-xs text-warm-500">
              平均 {avgSleepiness > 0 ? avgSleepiness.toFixed(1) : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center bg-sleep-100 rounded-elder p-4">
            <span className="text-4xl">🌙</span>
            <span className="text-elder-sm font-medium mt-2">醒来次数</span>
            <span className="text-elder-xs text-warm-500">
              平均 {records.length > 0 ? avgAwakenings.toFixed(1) : '—'} 次
            </span>
          </div>
          <div className="flex flex-col items-center bg-warm-50 rounded-elder p-4">
            <span className="text-4xl">{trendDisplay.icon}</span>
            <span className="text-elder-sm font-medium mt-2">趋势</span>
            <span className="text-elder-xs text-warm-500">{trendDisplay.text}</span>
          </div>
        </div>
      </div>

      <div className="no-print flex justify-center mb-6">
        <button onClick={handlePrint} className="elder-btn-secondary flex items-center gap-3">
          <Printer className="w-6 h-6" />
          🖨️ 打印本周简报
        </button>
      </div>

      <div className="print-only">
        <h1 className="text-2xl font-bold text-center mb-2">好眠排程 — 周报</h1>
        <p className="text-center text-sm mb-4">{formatWeekRange(monday)}</p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="border p-2 text-left">日期</th>
              <th className="border p-2 text-left">睡眠时间</th>
              <th className="border p-2 text-left">醒来次数</th>
              <th className="border p-2 text-left">白天状态</th>
              <th className="border p-2 text-left">服药备注</th>
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day, i) => {
              const iso = formatDateISO(day);
              const record = recordMap.get(iso);
              return (
                <tr key={iso} className="border-b">
                  <td className="border p-2">
                    {DAY_NAMES[i]} {formatDateCN(day)}
                  </td>
                  <td className="border p-2">{record?.sleepTime || '—'}</td>
                  <td className="border p-2">{record ? `${record.awakenings} 次` : '—'}</td>
                  <td className="border p-2">
                    {record ? getSleepinessEmoji(record.sleepiness) : '—'}
                  </td>
                  <td className="border p-2">{record?.medicationNote || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-4 text-sm">
          趋势总结：{trendDisplay.icon} {trendDisplay.text}
        </p>
      </div>
    </div>
  );
}
