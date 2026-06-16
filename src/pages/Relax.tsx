import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, ArrowLeft, Wind, Dumbbell, Music, SkipBack, SkipForward } from 'lucide-react';
import { MUSCLE_GROUPS } from '@/types';
import { speak, stopSpeaking } from '@/utils/speech';
import { generateId } from '@/utils/time';
import { useStore } from '@/store/useStore';
import { noisePlayer, MUSIC_TRACKS } from '@/utils/noisePlayer';

type ViewMode = 'main' | 'breathing' | 'muscle' | 'music';
type BreathingPhase = 'inhale' | 'hold' | 'exhale';

const PHASE_CONFIG: Record<BreathingPhase, { duration: number; text: string; next: BreathingPhase }> = {
  inhale: { duration: 4, text: '慢慢吸气...', next: 'hold' },
  hold: { duration: 7, text: '屏住呼吸...', next: 'exhale' },
  exhale: { duration: 8, text: '慢慢呼气...', next: 'inhale' },
};

const TIMER_OPTIONS = [15, 30, 45];

export default function Relax() {
  const addRelaxSession = useStore((s) => s.addRelaxSession);
  const [view, setView] = useState<ViewMode>('main');

  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<BreathingPhase | null>(null);
  const [breathCountdown, setBreathCountdown] = useState(0);
  const [breathCycles, setBreathCycles] = useState(0);
  const [breathAnimKey, setBreathAnimKey] = useState(0);
  const breathStartRef = useRef(0);

  const [muscleIndex, setMuscleIndex] = useState(0);
  const [muscleTensing, setMuscleTensing] = useState(false);
  const [muscleCountdown, setMuscleCountdown] = useState(0);
  const [muscleRelaxed, setMuscleRelaxed] = useState(false);

  const [musicTrack, setMusicTrack] = useState<string | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicTimer, setMusicTimer] = useState(15);
  const [musicCountdown, setMusicCountdown] = useState(0);

  const goBack = useCallback(() => {
    stopSpeaking();
    noisePlayer.stop();
    setIsBreathing(false);
    setBreathPhase(null);
    setBreathCycles(0);
    setBreathCountdown(0);
    setMuscleIndex(0);
    setMuscleTensing(false);
    setMuscleRelaxed(false);
    setMuscleCountdown(0);
    setMusicPlaying(false);
    setMusicCountdown(0);
    setMusicTrack(null);
    setView('main');
  }, []);

  useEffect(() => {
    if (!isBreathing || !breathPhase) return;
    const timeout = setTimeout(() => {
      if (breathCountdown <= 1) {
        const next = PHASE_CONFIG[breathPhase].next;
        setBreathAnimKey((k) => k + 1);
        if (next === 'inhale') setBreathCycles((c) => c + 1);
        setBreathPhase(next);
        setBreathCountdown(PHASE_CONFIG[next].duration);
      } else {
        setBreathCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [isBreathing, breathPhase, breathCountdown]);

  const startBreathing = useCallback(() => {
    breathStartRef.current = Date.now();
    setIsBreathing(true);
    setBreathPhase('inhale');
    setBreathCountdown(4);
    setBreathCycles(0);
    setBreathAnimKey((k) => k + 1);
  }, []);

  const stopBreathing = useCallback(() => {
    const elapsed = Math.round((Date.now() - breathStartRef.current) / 1000);
    if (breathCycles > 0) {
      addRelaxSession({
        id: generateId(),
        type: 'breathing',
        duration: elapsed,
        completedAt: new Date().toISOString(),
      });
    }
    setIsBreathing(false);
    setBreathPhase(null);
    setBreathCycles(0);
    setBreathCountdown(0);
  }, [breathCycles, addRelaxSession]);

  useEffect(() => {
    if (!muscleTensing) return;
    const timeout = setTimeout(() => {
      if (muscleCountdown <= 1) {
        setMuscleTensing(false);
        setMuscleRelaxed(true);
        speak('放松');
      } else {
        setMuscleCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [muscleTensing, muscleCountdown]);

  const startTensing = useCallback(() => {
    setMuscleTensing(true);
    setMuscleRelaxed(false);
    setMuscleCountdown(5);
    speak(MUSCLE_GROUPS[muscleIndex].instruction);
  }, [muscleIndex]);

  const nextMuscleGroup = useCallback(() => {
    if (muscleIndex < MUSCLE_GROUPS.length - 1) {
      const nextIdx = muscleIndex + 1;
      setMuscleIndex(nextIdx);
      setMuscleRelaxed(false);
      setMuscleTensing(false);
      speak(MUSCLE_GROUPS[nextIdx].instruction);
    } else {
      addRelaxSession({
        id: generateId(),
        type: 'muscle',
        duration: MUSCLE_GROUPS.length * 10,
        completedAt: new Date().toISOString(),
      });
      goBack();
    }
  }, [muscleIndex, addRelaxSession, goBack]);

  const currentTrackIndex = MUSIC_TRACKS.findIndex((t) => t.id === musicTrack);

  useEffect(() => {
    if (!musicPlaying || musicCountdown <= 0) return;
    const timeout = setTimeout(() => {
      if (musicCountdown <= 1) {
        noisePlayer.stop();
        setMusicPlaying(false);
        setMusicCountdown(0);
        addRelaxSession({
          id: generateId(),
          type: 'music',
          duration: musicTimer,
          completedAt: new Date().toISOString(),
        });
      } else {
        setMusicCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [musicPlaying, musicCountdown, musicTimer, addRelaxSession]);

  const toggleMusic = useCallback(() => {
    if (!musicPlaying) {
      const track = MUSIC_TRACKS.find((t) => t.id === musicTrack);
      if (track) {
        noisePlayer.play(track.type);
      }
      setMusicPlaying(true);
      if (musicCountdown <= 0) setMusicCountdown(musicTimer * 60);
    } else {
      noisePlayer.stop();
      setMusicPlaying(false);
    }
  }, [musicPlaying, musicTrack, musicCountdown, musicTimer]);

  const playTrack = useCallback((trackId: string) => {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId);
    setMusicTrack(trackId);
    if (musicPlaying && track) {
      noisePlayer.play(track.type);
    }
  }, [musicPlaying]);

  const prevTrack = useCallback(() => {
    if (currentTrackIndex < 0) return;
    const nextIdx = (currentTrackIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    playTrack(MUSIC_TRACKS[nextIdx].id);
  }, [currentTrackIndex, playTrack]);

  const nextTrack = useCallback(() => {
    if (currentTrackIndex < 0) return;
    const nextIdx = (currentTrackIndex + 1) % MUSIC_TRACKS.length;
    playTrack(MUSIC_TRACKS[nextIdx].id);
  }, [currentTrackIndex, playTrack]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (view === 'breathing') {
    const config = breathPhase ? PHASE_CONFIG[breathPhase] : null;
    const animClass =
      breathPhase === 'inhale'
        ? 'animate-breathe-in'
        : breathPhase === 'hold'
          ? 'animate-breathe-hold'
          : breathPhase === 'exhale'
            ? 'animate-breathe-out'
            : '';

    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <button
          onClick={goBack}
          className="flex items-center gap-2 p-6 text-elder-lg text-warm-600 min-h-[60px]"
        >
          <ArrowLeft className="w-8 h-8" />
          返回
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
          <div
            key={breathAnimKey}
            className={`w-64 h-64 rounded-full flex items-center justify-center transition-colors duration-500 ${
              isBreathing ? 'bg-sleep-400 text-white' : 'bg-sleep-200 text-sleep-600'
            } ${animClass}`}
          >
            <span className="text-elder-xl font-bold text-center px-4">
              {config ? config.text : '准备开始'}
            </span>
          </div>

          {isBreathing && (
            <div className="text-center">
              <div className="text-elder-xl text-warm-800 font-bold">
                {breathCountdown} 秒
              </div>
              <div className="text-elder-lg text-warm-600 mt-2">
                已完成 {breathCycles} 个循环
              </div>
            </div>
          )}

          <button
            onClick={isBreathing ? stopBreathing : startBreathing}
            className={`min-h-[60px] px-12 py-4 rounded-elder text-elder-lg font-bold transition-all ${
              isBreathing
                ? 'bg-warm-400 text-white shadow-elder-btn active:shadow-elder-btn-active'
                : 'elder-btn-primary'
            }`}
          >
            {isBreathing ? '停止' : '开始练习'}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'muscle') {
    const group = MUSCLE_GROUPS[muscleIndex];
    const progress = ((muscleIndex + 1) / MUSCLE_GROUPS.length) * 100;

    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <button
          onClick={goBack}
          className="flex items-center gap-2 p-6 text-elder-lg text-warm-600 min-h-[60px]"
        >
          <ArrowLeft className="w-8 h-8" />
          返回
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          <div className="w-full max-w-md">
            <div className="flex justify-between text-elder-sm text-warm-500 mb-2">
              <span>第 {muscleIndex + 1} / {MUSCLE_GROUPS.length} 组</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-warm-100 rounded-full h-4">
              <div
                className="bg-sleep-400 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="text-center mt-4">
            <div className="text-elder-xl font-bold text-warm-800">{group.name}</div>
            <div className="text-elder-lg text-warm-600 mt-2">{group.instruction}</div>
          </div>

          {muscleTensing && (
            <div className="text-elder-xl text-sleep-500 font-bold">
              {muscleCountdown} 秒
            </div>
          )}

          {muscleRelaxed && (
            <div className="text-elder-xl text-green-600 font-bold">
              已放松 ✓
            </div>
          )}

          <div className="flex gap-4 mt-4">
            {!muscleTensing && !muscleRelaxed && (
              <button onClick={startTensing} className="elder-btn-primary">
                开始收紧
              </button>
            )}
            {muscleTensing && (
              <button disabled className="elder-btn-primary opacity-50 cursor-not-allowed">
                收紧中 {muscleCountdown}s
              </button>
            )}
            {muscleRelaxed && (
              <button onClick={nextMuscleGroup} className="elder-btn-primary">
                {muscleIndex < MUSCLE_GROUPS.length - 1 ? '下一个部位' : '完成练习'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'music') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <button
          onClick={goBack}
          className="flex items-center gap-2 p-6 text-elder-lg text-warm-600 min-h-[60px]"
        >
          <ArrowLeft className="w-8 h-8" />
          返回
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
          <div className="flex flex-col gap-3 w-full max-w-md">
            {MUSIC_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => playTrack(track.id)}
                className={`elder-card p-5 flex items-center gap-4 cursor-pointer transition-all ${
                  musicTrack === track.id ? 'ring-2 ring-sleep-400 bg-sleep-50' : ''
                }`}
              >
                <span className="text-4xl flex-shrink-0">{track.emoji}</span>
                <div className="flex-1 text-left">
                  <div className="text-elder-base font-bold text-warm-800">{track.name}</div>
                  <div className="text-elder-xs text-warm-500 mt-0.5">{track.desc}</div>
                </div>
                {musicTrack === track.id && musicPlaying && (
                  <div className="flex items-end gap-0.5 h-6">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-sleep-400 rounded-full"
                        style={{
                          height: '20px',
                          animation: `waveform 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {musicTrack && (
            <>
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={prevTrack}
                  className="w-14 h-14 rounded-full bg-sleep-100 text-sleep-600 flex items-center justify-center hover:bg-sleep-200 transition-colors min-h-[56px]"
                >
                  <SkipBack className="w-6 h-6" />
                </button>

                <button
                  onClick={toggleMusic}
                  className="w-24 h-24 rounded-full bg-sleep-400 text-white flex items-center justify-center shadow-elder-btn active:shadow-elder-btn-active transition-all active:scale-95"
                >
                  {musicPlaying ? (
                    <Pause className="w-10 h-10" />
                  ) : (
                    <Play className="w-10 h-10 ml-1" />
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="w-14 h-14 rounded-full bg-sleep-100 text-sleep-600 flex items-center justify-center hover:bg-sleep-200 transition-colors min-h-[56px]"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center">
                <div className="text-elder-lg font-bold text-warm-800">
                  {MUSIC_TRACKS.find((t) => t.id === musicTrack)?.name}
                </div>
                {musicCountdown > 0 && (
                  <div className="text-elder-sm text-warm-500 mt-1">
                    剩余 {fmtTime(musicCountdown)}
                  </div>
                )}
              </div>

              <div className="flex gap-3 flex-wrap justify-center">
                {TIMER_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setMusicTimer(t);
                      if (!musicPlaying) setMusicCountdown(0);
                    }}
                    className={`px-5 py-3 rounded-elder text-elder-base font-bold min-h-[56px] transition-all ${
                      musicTimer === t
                        ? 'bg-sleep-400 text-white'
                        : 'bg-sleep-100 text-sleep-600 hover:bg-sleep-200'
                    }`}
                  >
                    {t}分钟
                  </button>
                ))}
              </div>

              <p className="text-elder-xs text-warm-400 text-center">
                舒缓环境音，帮助放松入睡
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <h1 className="text-elder-xl font-bold text-warm-800 mb-8 text-center">
        放松练习
      </h1>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <button
          onClick={() => setView('breathing')}
          className="elder-card p-8 flex items-center gap-6 min-h-[100px] cursor-pointer hover:shadow-elder-lg transition"
        >
          <Wind className="w-12 h-12 text-sleep-400 flex-shrink-0" />
          <div className="text-left">
            <div className="text-elder-lg font-bold text-warm-800">舒缓呼吸</div>
            <div className="text-elder-base text-warm-600">4-7-8呼吸法，帮助放松入睡</div>
          </div>
        </button>

        <button
          onClick={() => {
            setView('muscle');
            speak(MUSCLE_GROUPS[0].instruction);
          }}
          className="elder-card p-8 flex items-center gap-6 min-h-[100px] cursor-pointer hover:shadow-elder-lg transition"
        >
          <Dumbbell className="w-12 h-12 text-sleep-400 flex-shrink-0" />
          <div className="text-left">
            <div className="text-elder-lg font-bold text-warm-800">肌肉放松</div>
            <div className="text-elder-base text-warm-600">从头到脚逐步放松身体</div>
          </div>
        </button>

        <button
          onClick={() => setView('music')}
          className="elder-card p-8 flex items-center gap-6 min-h-[100px] cursor-pointer hover:shadow-elder-lg transition"
        >
          <Music className="w-12 h-12 text-sleep-400 flex-shrink-0" />
          <div className="text-left">
            <div className="text-elder-lg font-bold text-warm-800">轻音乐</div>
            <div className="text-elder-base text-warm-600">听舒缓音乐，安心入睡</div>
          </div>
        </button>
      </div>
    </div>
  );
}
