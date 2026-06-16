export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h < 12 ? '上午' : h < 18 ? '下午' : '晚上';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${displayH}:${m.toString().padStart(2, '0')}`;
}

export function formatTimeCN(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  return `${h}点${m > 0 ? m + '分' : ''}`;
}

export function getTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 20; h <= 23; h++) {
    options.push({ value: `${h}:00`, label: formatTimeCN(`${h}:00`) });
    options.push({ value: `${h}:30`, label: formatTimeCN(`${h}:30`) });
  }
  for (let h = 0; h <= 2; h++) {
    options.push({ value: `${h}:00`, label: formatTimeCN(`${h}:00`) });
    options.push({ value: `${h}:30`, label: formatTimeCN(`${h}:30`) });
  }
  return options;
}

export function getWakeTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 5; h <= 9; h++) {
    options.push({ value: `${h}:00`, label: formatTimeCN(`${h}:00`) });
    options.push({ value: `${h}:30`, label: formatTimeCN(`${h}:30`) });
  }
  return options;
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function todayWeekday(): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `星期${days[new Date().getDay()]}`;
}

export function todayDisplay(): string {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function getNapTime(): string {
  return '13:00';
}

export function getWalkTime(): string {
  return '19:00';
}

export function calcBedtime(wakeTime: string, timeInBedMin: number): string {
  const [h, m] = wakeTime.split(':').map(Number);
  const totalMin = h * 60 + m - timeInBedMin;
  const bedMin = totalMin < 0 ? totalMin + 1440 : totalMin;
  const bedH = Math.floor(bedMin / 60);
  const bedM = bedMin % 60;
  return `${bedH}:${bedM.toString().padStart(2, '0')}`;
}

export function getSleepinessEmoji(level: number): string {
  if (level <= 1) return '😊';
  if (level <= 2) return '😐';
  return '😴';
}

export function getSleepinessColor(level: number): string {
  if (level <= 1) return 'bg-green-300';
  if (level <= 2) return 'bg-yellow-300';
  return 'bg-red-300';
}

export function getAwakeningColor(count: number): string {
  if (count <= 1) return 'bg-green-300';
  if (count <= 2) return 'bg-yellow-300';
  return 'bg-red-300';
}
