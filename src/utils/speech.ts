export function speak(text: string, rate: number = 0.85): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(
    (v) => v.lang.startsWith('zh') && v.localService
  );
  if (zhVoice) utterance.voice = zhVoice;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechAvailable(): boolean {
  return 'speechSynthesis' in window;
}
