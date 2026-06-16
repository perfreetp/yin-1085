import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import type { UserProfile } from '@/types';
import { getWakeTimeOptions, calcBedtime, generateId } from '@/utils/time';
import { speak } from '@/utils/speech';

const QUESTIONS = [
  '请告诉我您的名字 🌙',
  '您每天早上几点起床？☀️',
  '您希望每天在床上躺多久？🛏️',
  '设置一个家属密码 🔐',
];

const TIME_IN_BED_OPTIONS = [
  { hours: 5, label: '5小时' },
  { hours: 5.5, label: '5个半小时' },
  { hours: 6, label: '6小时' },
  { hours: 6.5, label: '6个半小时' },
  { hours: 7, label: '7小时' },
  { hours: 7.5, label: '7个半小时' },
  { hours: 8, label: '8小时' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState('');
  const [timeInBed, setTimeInBed] = useState(0);
  const [pin, setPin] = useState(['', '', '', '']);
  const [pinConfirm, setPinConfirm] = useState(['', '', '', '']);
  const [pinPhase, setPinPhase] = useState<'set' | 'confirm'>('set');
  const [pinError, setPinError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinConfirmRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setProfile = useStore((s) => s.setProfile);
  const navigate = useNavigate();

  useEffect(() => {
    speak(QUESTIONS[step]);
  }, [step]);

  useEffect(() => {
    if (step === 0) {
      nameRef.current?.focus();
    }
  }, [step]);

  const canNext = useCallback(() => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return wakeUpTime !== '';
    if (step === 2) return timeInBed > 0;
    if (step === 3) {
      const currentPin = pinPhase === 'set' ? pin : pinConfirm;
      return currentPin.every((d) => d.length === 1);
    }
    return false;
  }, [step, name, wakeUpTime, timeInBed, pin, pinConfirm, pinPhase]);

  const handlePinInput = (
    index: number,
    value: string,
    phase: 'set' | 'confirm'
  ) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const current = phase === 'set' ? [...pin] : [...pinConfirm];
    current[index] = digit;
    if (phase === 'set') {
      setPin(current);
    } else {
      setPinConfirm(current);
      setPinError('');
    }
    if (digit && index < 3) {
      const refs = phase === 'set' ? pinRefs : pinConfirmRefs;
      refs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    phase: 'set' | 'confirm'
  ) => {
    if (e.key === 'Backspace') {
      const current = phase === 'set' ? [...pin] : [...pinConfirm];
      if (current[index] === '' && index > 0) {
        const refs = phase === 'set' ? pinRefs : pinConfirmRefs;
        refs.current[index - 1]?.focus();
        if (phase === 'set') {
          const updated = [...pin];
          updated[index - 1] = '';
          setPin(updated);
        } else {
          const updated = [...pinConfirm];
          updated[index - 1] = '';
          setPinConfirm(updated);
        }
      }
    }
  };

  const handleNext = () => {
    if (step === 3 && pinPhase === 'set') {
      const pinStr = pin.join('');
      setPinPhase('confirm');
      setTimeout(() => pinConfirmRefs.current[0]?.focus(), 100);
      return;
    }
    if (step === 3 && pinPhase === 'confirm') {
      const pinStr = pin.join('');
      const confirmStr = pinConfirm.join('');
      if (pinStr !== confirmStr) {
        setPinError('两次输入不一致，请重新输入');
        setPinConfirm(['', '', '', '']);
        setPinPhase('set');
        setTimeout(() => pinRefs.current[0]?.focus(), 100);
        return;
      }
      const profile: UserProfile = {
        id: generateId(),
        name: name.trim(),
        wakeUpTime,
        timeInBed: timeInBed * 60,
        bedtime: calcBedtime(wakeUpTime, timeInBed * 60),
        onboardingDone: true,
        familyPin: pinStr,
        createdAt: new Date().toISOString(),
      };
      setProfile(profile);
      navigate('/today');
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handlePrev = () => {
    if (step === 3 && pinPhase === 'confirm') {
      setPinPhase('set');
      setPinConfirm(['', '', '', '']);
      setPinError('');
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="animate-fade-in space-y-6">
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入您的名字"
              className="w-full text-elder-lg text-center border-2 border-warm-300 rounded-elder px-6 py-4 focus:border-warm-500 focus:outline-none bg-white min-h-[60px]"
              maxLength={10}
            />
          </div>
        );

      case 1:
        return (
          <div className="animate-fade-in grid grid-cols-3 gap-3">
            {getWakeTimeOptions().map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWakeUpTime(opt.value)}
                className={`text-elder-lg rounded-elder py-3 min-h-[60px] transition-all duration-150 select-none ${
                  wakeUpTime === opt.value
                    ? 'bg-warm-400 text-white shadow-elder-btn'
                    : 'bg-warm-100 text-warm-800 hover:bg-warm-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="animate-fade-in grid grid-cols-2 gap-4">
            {TIME_IN_BED_OPTIONS.map((opt) => (
              <button
                key={opt.hours}
                onClick={() => setTimeInBed(opt.hours)}
                className={`text-elder-lg rounded-elder py-4 min-h-[60px] transition-all duration-150 select-none ${
                  timeInBed === opt.hours
                    ? 'bg-warm-400 text-white shadow-elder-btn'
                    : 'bg-warm-100 text-warm-800 hover:bg-warm-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );

      case 3:
        return (
          <div className="animate-fade-in space-y-4">
            <p className="text-elder-lg text-warm-700 text-center">
              {pinPhase === 'set' ? '请输入4位数字密码' : '请再次输入确认密码'}
            </p>
            <div className="flex justify-center gap-4">
              {(pinPhase === 'set' ? pin : pinConfirm).map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    const refs =
                      pinPhase === 'set' ? pinRefs : pinConfirmRefs;
                    refs.current[i] = el;
                  }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInput(i, e.target.value, pinPhase)}
                  onKeyDown={(e) => handlePinKeyDown(i, e, pinPhase)}
                  className="w-16 h-20 text-elder-xl text-center border-2 border-warm-300 rounded-elder focus:border-warm-500 focus:outline-none bg-white"
                />
              ))}
            </div>
            {pinError && (
              <p className="text-danger-text text-elder-sm text-center animate-fade-in">
                {pinError}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-cream flex flex-col items-center justify-center p-6">
      <div className="elder-card max-w-2xl w-full mx-auto space-y-8">
        <div className="text-center text-elder-sm text-warm-500">
          第 {step + 1} 步 / 共 4 步
        </div>

        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-10 bg-warm-400'
                  : i < step
                  ? 'w-6 bg-warm-300'
                  : 'w-6 bg-warm-200'
              }`}
            />
          ))}
        </div>

        <h1 className="text-elder-xl text-warm-800 text-center">
          {QUESTIONS[step]}
        </h1>

        {renderStep()}

        <div className="flex justify-between pt-4">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className={`elder-btn-ghost ${
              step === 0 ? 'opacity-0 pointer-events-none' : ''
            }`}
          >
            上一步
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className={`elder-btn-primary ${
              !canNext() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {step === 3 && pinPhase === 'set'
              ? '确认密码'
              : step === 3 && pinPhase === 'confirm'
              ? '完成设置'
              : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}
