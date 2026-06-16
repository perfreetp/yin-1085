import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { BEDTIME_STEPS } from '@/types';
import { todayDisplay, todayWeekday, formatTimeCN } from '@/utils/time';
import { speak, stopSpeaking } from '@/utils/speech';
import { Moon, Sun, Clock, Footprints, Volume2, VolumeX } from 'lucide-react';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function formatTimeInBed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}小时${m}分钟`;
  if (h > 0) return `${h}小时`;
  return `${m}分钟`;
}

export default function Today() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const getTodayRecord = useStore((s) => s.getTodayRecord);

  const [dismissedNap, setDismissedNap] = useState(false);
  const [dismissedWalk, setDismissedWalk] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [showModal, setShowModal] = useState(false);

  const todayRecord = getTodayRecord();

  function handlePlaySteps() {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      setCurrentStep(-1);
      return;
    }
    setIsPlaying(true);
    const texts = BEDTIME_STEPS.map((s) => s.label);
    let i = 0;
    function playNext() {
      if (i >= texts.length) {
        setIsPlaying(false);
        setCurrentStep(-1);
        return;
      }
      setCurrentStep(i);
      const utterance = new SpeechSynthesisUtterance(texts[i]);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find((v) => v.lang.startsWith('zh') && v.localService);
      if (zhVoice) utterance.voice = zhVoice;
      utterance.onend = () => {
        i++;
        playNext();
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentStep(-1);
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
    playNext();
  }

  return (
    <div className="min-h-screen bg-cream overflow-y-auto pb-8">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        <header className="space-y-1">
          <p className="text-elder-sm text-warm-600">
            {todayDisplay()} {todayWeekday()}
          </p>
          <h1 className="text-elder-xl text-warm-800 font-bold">
            {getGreeting()}，{profile?.name || '朋友'}
          </h1>
        </header>

        <div className="space-y-3">
          <div className="elder-card flex items-center gap-4">
            <div className="text-4xl">
              <Sun className="w-10 h-10 text-warm-400" />
            </div>
            <div className="flex-1">
              <p className="text-elder-sm text-warm-600">☀️ 起床时间</p>
              <p className="text-elder-lg text-warm-800 font-bold">
                {formatTimeCN(profile?.wakeUpTime || '7:00')}
              </p>
            </div>
          </div>

          <div className="elder-card flex items-center gap-4">
            <div className="text-4xl">
              <Moon className="w-10 h-10 text-sleep-400" />
            </div>
            <div className="flex-1">
              <p className="text-elder-sm text-warm-600">🛏️ 上床时间</p>
              <p className="text-elder-lg text-warm-800 font-bold">
                {formatTimeCN(profile?.bedtime || '22:30')}
              </p>
            </div>
          </div>

          <div className="elder-card flex items-center gap-4">
            <div className="text-4xl">
              <Clock className="w-10 h-10 text-warm-400" />
            </div>
            <div className="flex-1">
              <p className="text-elder-sm text-warm-600">😴 在床时长</p>
              <p className="text-elder-lg text-warm-800 font-bold">
                {formatTimeInBed(profile?.timeInBed || 480)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {!dismissedNap && (
            <div className="bg-nap-bg text-nap-text rounded-elder p-5 flex items-start gap-3 relative">
              <Footprints className="w-7 h-7 mt-1 shrink-0" />
              <div className="flex-1">
                <p className="text-elder-sm font-bold">午睡提醒</p>
                <p className="text-elder-sm mt-1">
                  下午1点左右可以小睡，不要超过30分钟哦
                </p>
              </div>
              <button
                onClick={() => setDismissedNap(true)}
                className="text-nap-text/60 hover:text-nap-text text-2xl leading-none min-h-[60px] flex items-center"
              >
                ×
              </button>
            </div>
          )}

          {!dismissedWalk && (
            <div className="bg-walk-bg text-walk-text rounded-elder p-5 flex items-start gap-3 relative">
              <Footprints className="w-7 h-7 mt-1 shrink-0" />
              <div className="flex-1">
                <p className="text-elder-sm font-bold">散步提示</p>
                <p className="text-elder-sm mt-1">
                  晚饭后出去走走，帮助晚上睡得香
                </p>
              </div>
              <button
                onClick={() => setDismissedWalk(true)}
                className="text-walk-text/60 hover:text-walk-text text-2xl leading-none min-h-[60px] flex items-center"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <section className="space-y-3">
          <h2 className="text-elder-base text-warm-800 font-bold">🛏️ 睡前准备</h2>
          <div className="elder-card space-y-4">
            {BEDTIME_STEPS.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-4 p-2 rounded-xl transition-colors ${
                  currentStep === idx ? 'bg-warm-100' : ''
                }`}
              >
                <span className="text-3xl">{step.icon}</span>
                <span className="text-elder-base text-warm-800">{step.label}</span>
              </div>
            ))}
            <button
              onClick={handlePlaySteps}
              className={`w-full flex items-center justify-center gap-3 min-h-[60px] text-elder-base font-bold rounded-elder transition-all ${
                isPlaying
                  ? 'bg-red-100 text-red-700 active:bg-red-200'
                  : 'elder-btn-primary'
              }`}
            >
              {isPlaying ? (
                <>
                  <VolumeX className="w-7 h-7" />
                  ⏹ 停止播报
                </>
              ) : (
                <>
                  <Volume2 className="w-7 h-7" />
                  ▶ 开始语音播报
                </>
              )}
            </button>
          </div>
        </section>

        <section>
          <div className="elder-card space-y-4">
            <p className="text-elder-base text-warm-800 font-bold">
              在床上躺了很久还是睡不着？
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="elder-btn-secondary w-full"
            >
              我越躺越清醒
            </button>
          </div>
        </section>

        {showModal && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-elder-lg shadow-elder-lg max-w-md w-full p-8 space-y-6 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-elder-lg text-warm-800 font-bold">没关系的 💛</p>
              <p className="text-elder-base text-warm-700 leading-relaxed">
                没关系，这是正常的。起来做点放松的事，有困意了再回床。
              </p>
              <button
                onClick={() => navigate('/relax')}
                className="elder-btn-primary w-full"
              >
                去做放松练习 🧘
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="elder-btn-ghost w-full"
              >
                我知道了
              </button>
            </div>
          </div>
        )}

        {!todayRecord && (
          <button
            onClick={() => navigate('/sleep-log')}
            className="elder-card w-full flex items-center gap-4 text-left hover:bg-warm-50 transition-colors"
          >
            <span className="text-4xl">📋</span>
            <div>
              <p className="text-elder-base text-warm-800 font-bold">
                记录昨晚的睡眠
              </p>
              <p className="text-elder-sm text-warm-600">
                点击填写昨晚的睡眠日记
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
