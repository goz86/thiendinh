import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Volume2, VolumeX, ArrowLeft, Music, Maximize, Minimize, Mic, MicOff, Timer, RefreshCw } from 'lucide-react';
import type { BreathingTechnique } from '../types';
import { addSession } from '../utils/storage';
import { supabase } from '../lib/supabase';

interface VisualizerProps {
  technique: BreathingTechnique;
  onClose: () => void;
}

type Phase = 'inhale' | 'hold1' | 'exhale' | 'hold2';
type AppState = 'idle' | 'countdown' | 'breathing';

const phaseText: Record<Phase, string> = {
  inhale: 'Hít vào',
  hold1: 'Giữ hơi',
  exhale: 'Thở ra',
  hold2: 'Giữ hơi'
};

const cosmicColors = [
  '#A37B5C', '#C2A385', '#8BA6B8', '#A195AD', '#DECAA4', '#B4C5D4',
];

const musicOptions = [
  { id: 'none', label: '🚫 Không có nhạc' },
  // Hertz Generated (Original)
  { id: 'hz_432', label: '💎 Tần số chữa lành (432Hz)' },
  { id: 'hz_528', label: '🌀 Tần số chuyển hoá (528Hz)' },
  
  // New Local Hz Files
  { id: '/417Hz.mp3', label: '✨ Tần số 417Hz (Xoá tiêu cực)' },
  { id: '/432hz.mp3', label: '🧘 Tần số 432Hz (Tĩnh tại)' },
  { id: '/528Hz.mp3', label: '🧬 Tần số 528Hz (Tái tạo)' },
  { id: '/852Hz.mp3', label: '🌌 Tần số 852Hz (Thức tỉnh)' },

  // Spiritual / Buddhist
  { id: '/bat%20nha%20tam%20kinh.mp3', label: '☸️ Bát Nhã Tâm Kinh' },
  { id: '/Nilakantha%20dharani.mp3', label: '📿 Chú Đại Bi' },
  { id: '/Budha_Music.mp3', label: '🎋 Nhạc Phật Giờ Thiền' },
  { id: '/ngan%20nam%20de%20cau%20nguyen.mp3', label: '🙏 Ngàn Năm Cầu Nguyện' },
  
  // Nature & Piano
  { id: '/Morning_in_the_Forest.mp3', label: '🌲 Rừng Sáng Sớm' },
  { id: '/Birds__forest.mp3', label: '🐦 Tiếng Chim Rừng' },
  { id: '/Bamboo_water_relaxation.mp3', label: '🎋 Tre Nước Thư Giãn' },
  { id: '/Autumn%20Wind.mp3', label: '🍂 Gió Mùa Thu' },
  { id: '/Piano_in_the_forest.mp3', label: '🎹 Piano Trong Rừng' },
  { id: '/Relaxing_piano.mp3', label: '🎼 Piano Thư Giãn' },
  { id: '/Beautiful_life.mp3', label: '🌈 Cuộc Sống Tươi Đẹp' },
  { id: '/Perfect_Beauty.mp3', label: '🌺 Vẻ Đẹp Hoàn Hảo' },
  { id: '/Meditation_Spiritual_Music.mp3', label: '☯️ Thiền Định Tâm Linh' },
  { id: '/Pachelbel_Canon%20nhe%20nhang.mp3', label: '🎻 Canon in D (Dịu êm)' },
  { id: '/Breath_of_Life_5_minutes.mp3', label: '🌬️ Hơi Thở Sự Sống' },
];

const durationPresets = [
  { value: 0, label: 'Không giới hạn' },
  { value: 3, label: '3 phút' },
  { value: 5, label: '5 phút' },
  { value: 10, label: '10 phút' },
  { value: 15, label: '15 phút' },
  { value: 20, label: '20 phút' },
];

const generateParticles = (count: number, minRadius: number, maxRadius: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    angle: Math.random() * 360,
    radius: minRadius + Math.random() * (maxRadius - minRadius),
    length: 3 + Math.random() * 15,
    thickness: 1 + Math.random() * 2.5,
    opacity: 0.15 + Math.random() * 0.7,
    color: cosmicColors[Math.floor(Math.random() * cosmicColors.length)],
    swirl: Math.random() * 40 - 20
  }));
};

export const Visualizer: React.FC<VisualizerProps> = ({ technique, onClose }) => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [countdownValue, setCountdownValue] = useState(3);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [timeLeft, setTimeLeft] = useState(technique.pattern.inhale);
  const [sessionTime, setSessionTime] = useState(0);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [bgMusic, setBgMusic] = useState<string>('/Morning_in_the_Forest.mp3');
  const [reverseAnimation, setReverseAnimation] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [targetDuration, setTargetDuration] = useState(0); // 0 = unlimited
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [customMusicList, setCustomMusicList] = useState<{id: string, label: string}[]>([]);
  const [bgVolume, setBgVolume] = useState(0.5);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const phaseStartRef = useRef(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const currentMusicSrc = useRef('');
  const inhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioRef = useRef<HTMLAudioElement | null>(null);
  const holdAudioRef = useRef<HTMLAudioElement | null>(null);

  const layer1 = useMemo(() => generateParticles(100, 60, 300), []);
  const layer2 = useMemo(() => generateParticles(80, 100, 450), []);
  const layer3 = useMemo(() => generateParticles(60, 150, 600), []);

  const isActive = appState === 'breathing';

  // Audio initialization is now handled in JSX for better browser compatibility
  useEffect(() => {
    // Volume control for pre-loaded refs
    if (audioRef.current) audioRef.current.volume = 0.5;
    if (inhaleAudioRef.current) inhaleAudioRef.current.volume = 0.9;
    if (exhaleAudioRef.current) exhaleAudioRef.current.volume = 0.9;
    if (holdAudioRef.current) holdAudioRef.current.volume = 0.9;
  }, []);

  const stopOscillator = useCallback(() => {
    if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
      const gain = gainNodeRef.current;
      const ctx = audioContextRef.current;
      // Fade out smoothly to avoid popping sound
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      setTimeout(() => {
        if (oscillatorRef.current) {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
          oscillatorRef.current = null;
        }
      }, 300);
    }
  }, []);

  const playOscillator = useCallback((freq: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    stopOscillator();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(bgVolume * 0.15, ctx.currentTime + 1); // Soft fade in, proportional to bgVolume
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
  }, [stopOscillator]);

  // Handle ALL Music (Play/Pause/Switch)
  useEffect(() => {
    const setupAudio = (src: string) => {
      if (!bgAudioRef.current) return;
      if (currentMusicSrc.current !== src) {
        bgAudioRef.current.src = src;
        currentMusicSrc.current = src;
      }
    };

    if (bgMusic === 'none') {
      stopOscillator();
      if (bgAudioRef.current) bgAudioRef.current.pause();
    } else if (bgMusic.startsWith('hz_')) {
      if (bgAudioRef.current) bgAudioRef.current.pause();
      if (isActive) {
        const freq = parseInt(bgMusic.split('_')[1]);
        playOscillator(freq);
      } else {
        stopOscillator();
      }
    } else {
      stopOscillator();
      setupAudio(bgMusic);
      if (bgAudioRef.current) bgAudioRef.current.volume = bgVolume;
      if (isActive) {
        bgAudioRef.current?.play().catch(() => {});
      } else {
        bgAudioRef.current?.pause();
      }
    }
  }, [bgMusic, isActive, playOscillator, stopOscillator]);

  // Sync volume to audio element and oscillator
  useEffect(() => {
    if (bgAudioRef.current) {
      bgAudioRef.current.volume = bgVolume;
    }
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(bgVolume * 0.15, audioContextRef.current.currentTime, 0.1);
    }
  }, [bgVolume]);

  // Overall cleanup on unmount
  useEffect(() => {
    return () => {
      stopOscillator();
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
    };
  }, [stopOscillator]);

  // Session timer
  useEffect(() => {
    let timer: number;
    if (isActive) {
      timer = window.setInterval(() => setSessionTime(s => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isActive]);

  // Check target duration reached
  useEffect(() => {
    if (targetDuration > 0 && sessionTime >= targetDuration * 60 && isActive) {
      handleFinish();
    }
  }, [sessionTime, targetDuration, isActive]);

  const playChime = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Lỗi phát tiếng chuông:", error);
        });
      }
    }
  }, [soundEnabled]);

  // Synthesized singing bowl / gong for finish
  const playFinishGong = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;

      // Create multiple harmonics for a rich singing bowl tone
      const frequencies = [261.6, 523.3, 784.9, 1046.5]; // C4, C5, G5, C6
      const gains = [0.4, 0.25, 0.15, 0.08];
      const durations = [4, 3.5, 3, 2.5];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        // Slight detune for warmth
        osc.detune.setValueAtTime(Math.random() * 6 - 3, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[i], now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + durations[i]);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + durations[i]);
      });

      // Add a soft metallic "ting" attack
      const noise = ctx.createBufferSource();
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.3;
      }
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(3000, now);
      noiseFilter.Q.setValueAtTime(5, now);
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // Clean up context after all sounds finish
      setTimeout(() => ctx.close(), 5000);
    } catch (e) {
      console.error('Lỗi phát tiếng gong:', e);
      // Fallback to regular chime
      if (audioRef.current) {
        audioRef.current.volume = 0.8;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }
  }, [soundEnabled]);

  const speakPhase = useCallback((text: string) => {
    if (!voiceEnabled) return;

    // Vietnamese Voice Cleanup: use high quality audio files for inhale/exhale
    if (text === 'Hít vào' && inhaleAudioRef.current) {
      inhaleAudioRef.current.currentTime = 0;
      inhaleAudioRef.current.play().catch(() => {});
      return;
    } 
    
    if (text === 'Thở ra' && exhaleAudioRef.current) {
      exhaleAudioRef.current.currentTime = 0;
      exhaleAudioRef.current.play().catch(() => {});
      return;
    }

    // For "Giữ hơi" (Hold), we now use the custom audio file
    if (text === 'Giữ hơi' && holdAudioRef.current) {
      holdAudioRef.current.currentTime = 0;
      holdAudioRef.current.play().catch(() => {});
      return;
    }
  }, [voiceEnabled]);

  // Countdown logic
  useEffect(() => {
    if (appState !== 'countdown') return;
    if (countdownValue <= 0) {
      setAppState('breathing');
      playChime();
      speakPhase('Hít vào');
      return;
    }
    const timer = window.setTimeout(() => setCountdownValue(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [appState, countdownValue, playChime, speakPhase]);

  // Breathing timer logic
  useEffect(() => {
    let timer: number;
    let currentPhase = phase;
    let currentTime = timeLeft;

    if (isActive) {
      timer = window.setInterval(() => {
        if (currentTime > 1) {
          currentTime -= 1;
          setTimeLeft(currentTime);
        } else {
          let nextPhase: Phase = 'inhale';
          if (currentPhase === 'inhale') {
            nextPhase = technique.pattern.hold1 > 0 ? 'hold1' : 'exhale';
          } else if (currentPhase === 'hold1') {
            nextPhase = 'exhale';
          } else if (currentPhase === 'exhale') {
            nextPhase = technique.pattern.hold2 > 0 ? 'hold2' : 'inhale';
          } else if (currentPhase === 'hold2') {
            nextPhase = 'inhale';
          }

          currentPhase = nextPhase;
          currentTime = technique.pattern[nextPhase];
          setPhase(nextPhase);
          setTimeLeft(currentTime);
          playChime();
          speakPhase(phaseText[nextPhase]);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase, timeLeft, technique, playChime, speakPhase]);

  const handleStart = () => {
    // Unlock Audio Context and Audio elements on first user interaction
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
      }).catch(() => {});
    }

    if (inhaleAudioRef.current) inhaleAudioRef.current.load();
    if (exhaleAudioRef.current) exhaleAudioRef.current.load();
    if (holdAudioRef.current) holdAudioRef.current.load();

    setCountdownValue(3);
    setAppState('countdown');
  };

  const handlePause = () => {
    setAppState('idle');
  };

  const handleResume = () => {
    setAppState('breathing');
  };

  const handleFinish = () => {
    setAppState('idle');
    if (sessionTime > 0) {
      addSession({
        date: new Date().toISOString().split('T')[0],
        techniqueId: technique.id,
        techniqueName: technique.name,
        durationSeconds: sessionTime,
      });

      // Save to Supabase if logged in
      const saveToCloud = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('meditation_sessions').insert({
            user_id: user.id,
            technique_id: technique.id,
            technique_name: technique.name,
            duration_seconds: sessionTime
          });
        }
      };
      saveToCloud();
      
      // Play finish gong sound
      setTimeout(() => playFinishGong(), 100);
      
      // Auto-reset timer
      setSessionTime(0);
    }
  };

  const resetTimer = () => {
    setAppState('idle');
    setPhase('inhale');
    setTimeLeft(technique.pattern.inhale);
    if (sessionTime > 0) {
      addSession({
        date: new Date().toISOString().split('T')[0],
        techniqueId: technique.id,
        techniqueName: technique.name,
        durationSeconds: sessionTime,
      });

      // Save to Supabase if logged in
      const saveToCloud = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('meditation_sessions').insert({
            user_id: user.id,
            technique_id: technique.id,
            technique_name: technique.name,
            duration_seconds: sessionTime
          });
        }
      };
      saveToCloud();
    }
    setSessionTime(0);
  };

  const toggleTimer = () => {
    if (appState === 'idle' && sessionTime === 0) {
      handleStart();
    } else if (appState === 'idle' && sessionTime > 0) {
      handleResume();
    } else if (isActive) {
      handlePause();
    }
  };

  const getScale = (multiplier: number = 1) => {
    if (!isActive) return 1;
    let target = 1;
    if (reverseAnimation) {
      target = phase === 'inhale' || phase === 'hold1' ? 0.4 : 1.7;
    } else {
      target = phase === 'inhale' || phase === 'hold1' ? 1.7 : 0.4;
    }
    return 1 + (target - 1) * multiplier;
  };

  const getDuration = () => {
    if (!isActive) return 1;
    return technique.pattern[phase];
  };

  const renderParticles = (particles: typeof layer1) => {
    return particles.map(p => (
      <div
        key={p.id}
        className="absolute rounded-full"
        style={{
          width: `${p.length}px`,
          height: `${p.thickness}px`,
          backgroundColor: p.color,
          opacity: p.opacity,
          transform: `rotate(${p.angle}deg) translateX(${p.radius}px) rotate(${p.swirl}deg)`,
          transformOrigin: '0 0'
        }}
      />
    ));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 60fps smooth progress bar via requestAnimationFrame (direct DOM)
  useEffect(() => {
    if (!isActive || !progressRef.current) {
      if (progressRef.current) progressRef.current.style.width = '0%';
      cancelAnimationFrame(rafRef.current);
      return;
    }
    phaseStartRef.current = Date.now();

    const animate = () => {
      if (!progressRef.current) return;
      const elapsed = (Date.now() - phaseStartRef.current) / 1000;
      const total = technique.pattern[phase];
      let pct = 0;
      if (phase === 'inhale') {
        pct = total > 0 ? Math.min((elapsed / total) * 100, 100) : 100;
      } else if (phase === 'hold1') {
        pct = 100;
      } else if (phase === 'exhale') {
        pct = total > 0 ? Math.max((1 - elapsed / total) * 100, 0) : 0;
      }
      progressRef.current.style.width = `${pct}%`;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, phase, technique]);

  const toggleZenMode = () => {
    if (!zenMode) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setZenMode(!zenMode);
  };

  const remainingTime = targetDuration > 0 ? Math.max(0, targetDuration * 60 - sessionTime) : null;

  return (
    <div 
      className="absolute inset-0 bg-gradient-to-b from-[#FCF9F3]/80 to-[#FCF9F3]/95 dark:from-[#1a1612]/95 dark:to-[#0d0b09]/98 backdrop-blur-[3px] flex flex-col items-center justify-center z-50 overflow-hidden"
    >
      
      {/* Header — hidden in zen mode */}
      <AnimatePresence>
        {!zenMode && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute top-0 left-0 right-0 px-1.5 sm:px-6 pt-6 pb-6 flex justify-between items-start z-50 w-full max-w-4xl mx-auto"
          >
            <div className="flex-1 flex justify-start mt-20 sm:mt-0">
              <button
                onClick={() => { resetTimer(); onClose(); }}
                className="p-3 bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 shadow-sm rounded-full transition-all cursor-pointer border border-[#E8DFC9] dark:border-white/10"
              >
                <ArrowLeft className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
              </button>
            </div>
            
            <div className="absolute left-1/2 top-6 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-[#4A3C31] dark:text-[#F5EDE0] whitespace-nowrap">{technique.name}</h2>
                <div className="flex space-x-2 text-base text-[#C2A385] font-mono mt-1 justify-center">
                  <span className={phase === 'inhale' ? 'text-[#5A4D41] dark:text-[#F5EDE0] font-bold scale-110 transition-transform' : ''}>{technique.pattern.inhale}</span>-
                  <span className={phase === 'hold1' ? 'text-[#5A4D41] dark:text-[#F5EDE0] font-bold scale-110 transition-transform' : ''}>{technique.pattern.hold1}</span>-
                  <span className={phase === 'exhale' ? 'text-[#5A4D41] dark:text-[#F5EDE0] font-bold scale-110 transition-transform' : ''}>{technique.pattern.exhale}</span>-
                  <span className={phase === 'hold2' ? 'text-[#5A4D41] dark:text-[#F5EDE0] font-bold scale-110 transition-transform' : ''}>{technique.pattern.hold2}</span>
                </div>
                {/* Session time or remaining time */}
                <div className={`mt-3 py-1.5 px-4 rounded-full border border-[#DECAA4]/50 dark:border-white/10 bg-white/40 dark:bg-white/5 shadow-sm transition-opacity duration-1000 ${(isActive || sessionTime > 0) ? 'opacity-100' : 'opacity-0'} pointer-events-auto`}>
                  {remainingTime !== null ? (
                    <>
                      <span className="text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090]">Còn lại: </span>
                      <span className="text-[#A37B5C] dark:text-[#DECAA4] font-mono text-base ml-1">{formatTime(remainingTime)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090]">Thời gian: </span>
                      <span className="text-[#A37B5C] dark:text-[#DECAA4] font-mono text-base ml-1">{formatTime(sessionTime)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex justify-end relative z-10 mt-16 sm:mt-0">
              <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 shadow-sm rounded-full transition-all cursor-pointer border border-[#E8DFC9] dark:border-white/10"
              >
                <Settings className="w-6 h-6 text-[#A37B5C] dark:text-[#DECAA4]" />
              </button>
              <button
                onClick={toggleZenMode}
                className="p-3 bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 shadow-sm rounded-full transition-all cursor-pointer border border-[#E8DFC9] dark:border-white/10"
              >
                <Maximize className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]" />
              </button>
              <button
                onClick={() => setShowMusicPicker(!showMusicPicker)}
                className={`p-3 shadow-sm rounded-full transition-all cursor-pointer border ${
                  bgMusic !== 'none'
                    ? 'bg-[#C2A385]/20 dark:bg-[#DECAA4]/15 border-[#C2A385] dark:border-[#DECAA4]/40'
                    : 'bg-white/50 dark:bg-white/10 border-[#E8DFC9] dark:border-white/10 hover:bg-white dark:hover:bg-white/20'
                }`}
              >
                <Music className={`w-5 h-5 ${bgMusic !== 'none' ? 'text-[#5A4D41] dark:text-[#DECAA4]' : 'text-[#A37B5C] dark:text-[#DECAA4]'}`} />
              </button>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-3 shadow-sm rounded-full transition-all cursor-pointer border ${
                  voiceEnabled
                    ? 'bg-[#C2A385]/20 dark:bg-[#DECAA4]/15 border-[#C2A385] dark:border-[#DECAA4]/40'
                    : 'bg-white/50 dark:bg-white/10 border-[#E8DFC9] dark:border-white/10 hover:bg-white dark:hover:bg-white/20'
                }`}
                title="Hướng dẫn giọng nói"
              >
                {voiceEnabled ? <Mic className="w-5 h-5 text-[#5A4D41] dark:text-[#DECAA4]" /> : <MicOff className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]" />}
              </button>
              <button
                onClick={() => setReverseAnimation(!reverseAnimation)}
                className={`p-3 shadow-sm rounded-full transition-all cursor-pointer border ${
                  reverseAnimation
                    ? 'bg-[#A37B5C]/20 dark:bg-[#C2A385]/15 border-[#A37B5C] dark:border-[#C2A385]/40'
                    : 'bg-white/50 dark:bg-white/10 border-[#E8DFC9] dark:border-white/10 hover:bg-white dark:hover:bg-white/20'
                }`}
                title="Đảo ngược hiệu ứng"
              >
                <RefreshCw className={`w-5 h-5 ${reverseAnimation ? 'text-[#5A4D41] dark:text-[#F5EDE0]' : 'text-[#A37B5C] dark:text-[#DECAA4]'}`} />
              </button>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Zen mode exit button */}
      {zenMode && (
        <button
          onClick={toggleZenMode}
          className="absolute top-4 right-4 z-50 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-all cursor-pointer"
        >
          <Minimize className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]" />
        </button>
      )}

      {/* Quick Music Picker */}
      <AnimatePresence>
        {showMusicPicker && (
          <motion.div
            key="music-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40"
            onClick={() => setShowMusicPicker(false)}
          />
        )}
        {showMusicPicker && (
          <motion.div
            key="music-panel"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="absolute top-36 right-6 bg-white/95 dark:bg-[#2a2420]/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl z-50 border border-[#E8DFC9] dark:border-white/10 w-56"
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#F2EAE0] dark:border-white/10">
              <span className="text-sm font-medium text-[#4A3C31] dark:text-[#F5EDE0] flex items-center gap-2">
                <Music className="w-4 h-4 text-[#A37B5C] dark:text-[#DECAA4]" />
                Nhạc nền
              </span>
              <button className="cursor-pointer" onClick={() => setShowMusicPicker(false)}>
                <X className="w-4 h-4 text-[#C2A385] hover:text-[#8B7D6E]" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {musicOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setBgMusic(opt.id); }}
                  className={`text-left px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                    bgMusic === opt.id
                      ? 'bg-[#5A4D41] text-white'
                      : 'text-[#5A4D41] dark:text-[#DECAA4] hover:bg-[#FCF9F3] dark:hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Volume Slider */}
            {bgMusic !== 'none' && (
              <div className="mt-3 pt-3 border-t border-[#F2EAE0] dark:border-white/10">
                <div className="flex items-center gap-2 mb-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#A37B5C] dark:text-[#DECAA4] flex-shrink-0" />
                  <span className="text-xs text-[#8B7D6E] dark:text-[#B0A090]">Âm lượng</span>
                  <span className="text-xs text-[#A37B5C] dark:text-[#DECAA4] ml-auto font-mono">{Math.round(bgVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bgVolume}
                  onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #A37B5C ${bgVolume * 100}%, #E8DFC9 ${bgVolume * 100}%)`
                  }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40"
            onClick={() => setShowSettings(false)}
          />
        )}
        {showSettings && (
          <motion.div
            key="settings-panel"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-24 right-6 bg-white/95 dark:bg-[#2a2420]/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl z-50 border border-[#E8DFC9] dark:border-white/10 w-80"
          >
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#F2EAE0] dark:border-white/10">
              <h3 className="font-medium text-[#4A3C31] dark:text-[#F5EDE0] text-lg">Cài đặt</h3>
              <button className="cursor-pointer" onClick={() => setShowSettings(false)}>
                <X className="w-6 h-6 text-[#C2A385] hover:text-[#8B7D6E]" />
              </button>
            </div>
            
            <div className="space-y-5">
              {/* Duration */}
              <div className="flex flex-col gap-2">
                <span className="text-[15px] font-medium text-[#5A4D41] dark:text-[#F5EDE0] flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]"/>
                  Thời gian thiền
                </span>
                <div className="flex flex-wrap gap-2">
                  {durationPresets.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { 
                        setTargetDuration(opt.value); 
                        setShowCustomInput(false); 
                        setCustomMinutes(''); 
                        if (appState === 'idle') setSessionTime(0);
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all ${
                        targetDuration === opt.value && !showCustomInput
                          ? 'bg-[#5A4D41] text-white'
                          : 'bg-[#FCF9F3] dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 text-[#5A4D41] dark:text-[#DECAA4] hover:bg-white dark:hover:bg-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all ${
                      showCustomInput
                        ? 'bg-[#5A4D41] text-white'
                        : 'bg-[#FCF9F3] dark:bg-white/5 border border-[#E8DFC9] dark:border-white/10 text-[#5A4D41] dark:text-[#DECAA4] hover:bg-white dark:hover:bg-white/10'
                    }`}
                  >
                    Tuỳ chỉnh
                  </button>
                </div>
                {showCustomInput && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customMinutes}
                      onChange={(e) => {
                        setCustomMinutes(e.target.value);
                        const val = parseInt(e.target.value);
                        if (val > 0 && val <= 180) {
                          setTargetDuration(val);
                          if (appState === 'idle') setSessionTime(0);
                        }
                      }}
                      placeholder="Nhập số phút"
                      className="w-28 px-3 py-2 rounded-xl bg-[#FCF9F3] dark:bg-white/5 border border-[#DECAA4] dark:border-white/10 text-[#5A4D41] dark:text-[#DECAA4] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A385] font-mono"
                    />
                    <span className="text-sm text-[#8B7D6E] dark:text-[#B0A090]">phút</span>
                    {customMinutes && parseInt(customMinutes) > 0 && (
                      <span className="text-xs text-[#A37B5C] dark:text-[#DECAA4]">= {Math.floor(parseInt(customMinutes)/60) > 0 ? `${Math.floor(parseInt(customMinutes)/60)}h ` : ''}{parseInt(customMinutes)%60 > 0 ? `${parseInt(customMinutes)%60}m` : ''}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Background Music Volume */}
              {bgMusic !== 'none' && (
                <div className="flex flex-col gap-3 pt-1 border-t border-[#F2EAE0] dark:border-white/10 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] text-[#5A4D41] dark:text-[#F5EDE0] flex items-center gap-2 font-medium">
                      <Music className="w-5 h-5 text-[#A37B5C]"/>
                      Âm lượng nhạc
                    </span>
                    <span className="text-sm font-mono text-[#A37B5C] dark:text-[#DECAA4]">{Math.round(bgVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgVolume}
                    onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#E8DFC9] dark:bg-white/10 accent-[#A37B5C]"
                    style={{
                      background: `linear-gradient(to right, #A37B5C ${bgVolume * 100}%, #E8DFC9 ${bgVolume * 100}%)`
                    }}
                  />
                </div>
              )}

              {/* Chime toggle */}
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-[#5A4D41] dark:text-[#F5EDE0] flex items-center gap-2 font-medium">
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-[#A37B5C]"/> : <VolumeX className="w-5 h-5 text-[#C2A385]"/>}
                  Tiếng chuông
                </span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${soundEnabled ? 'bg-[#C2A385]' : 'bg-[#E8DFC9] dark:bg-white/10'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${soundEnabled ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Voice guidance */}
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-[#5A4D41] dark:text-[#F5EDE0] flex items-center gap-2 font-medium">
                  {voiceEnabled ? <Mic className="w-5 h-5 text-[#A37B5C]"/> : <MicOff className="w-5 h-5 text-[#C2A385]"/>}
                  Hướng dẫn giọng nói
                </span>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${voiceEnabled ? 'bg-[#C2A385]' : 'bg-[#E8DFC9] dark:bg-white/10'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${voiceEnabled ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Reverse */}
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <span className="text-[15px] font-medium text-[#5A4D41] dark:text-[#F5EDE0] block">Đảo ngược hiệu ứng</span>
                  <span className="text-xs text-[#A37B5C] dark:text-[#DECAA4]">{reverseAnimation ? "Hít = Thu nhỏ" : "Hít = Khai mở"}</span>
                </div>
                <button
                  onClick={() => setReverseAnimation(!reverseAnimation)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${reverseAnimation ? 'bg-[#A37B5C]' : 'bg-[#E8DFC9] dark:bg-white/10'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition shadow-sm ${reverseAnimation ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Music */}
              <div className="flex flex-col space-y-3 pt-4 border-t border-[#F2EAE0] dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-[#5A4D41] dark:text-[#F5EDE0] flex items-center gap-2">
                    <Music className="w-5 h-5 text-[#A37B5C] dark:text-[#DECAA4]"/>
                    Nhạc nền & Tần số
                  </span>
                  <label className="text-xs font-medium text-white bg-[#A37B5C] dark:bg-[#C2A385] dark:text-[#2a2420] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#8B6B50] dark:hover:bg-[#DECAA4] transition-colors shadow-sm whitespace-nowrap overflow-hidden">
                    Tải nhạc lên
                    <input 
                       type="file" 
                       accept="audio/*" 
                       className="hidden" 
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const url = URL.createObjectURL(file);
                           const newCustom = { id: url, label: `🎵 ${file.name}` };
                           setCustomMusicList(prev => [...prev, newCustom]);
                           setBgMusic(url);
                         }
                         // Reset input to allow same file re-upload if needed
                         e.target.value = '';
                       }} 
                     />
                  </label>
                </div>
                <div className="relative">
                  <select
                    value={bgMusic}
                    onChange={(e) => setBgMusic(e.target.value)}
                    className="w-full appearance-none p-3 pl-4 pr-10 rounded-xl bg-[#FCF9F3] dark:bg-white/5 border border-[#DECAA4] dark:border-white/10 text-[#5A4D41] dark:text-[#DECAA4] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A385] cursor-pointer font-sans transition-all hover:bg-white dark:hover:bg-white/10"
                  >
                    {[...musicOptions, ...customMusicList].map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#A37B5C]">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Core breathing orb */}
      <div className="relative flex items-center justify-center w-[300px] h-[300px] z-20 mt-12 bg-transparent">
        
        
        {/* Cosmic Vortex Layers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 w-full h-full opacity-90">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 120, ease: "linear" }} className="absolute flex items-center justify-center">
            <motion.div animate={{ scale: getScale(0.8) }} transition={{ duration: getDuration(), ease: "easeInOut" }} className="absolute flex items-center justify-center">
              {renderParticles(layer1)}
            </motion.div>
          </motion.div>

          <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 180, ease: "linear" }} className="absolute flex items-center justify-center">
            <motion.div animate={{ scale: getScale(1.1) }} transition={{ duration: getDuration(), ease: "easeInOut" }} className="absolute flex items-center justify-center">
              {renderParticles(layer2)}
            </motion.div>
          </motion.div>

          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 250, ease: "linear" }} className="absolute flex items-center justify-center">
            <motion.div animate={{ scale: getScale(1.4) }} transition={{ duration: getDuration(), ease: "easeInOut" }} className="absolute flex items-center justify-center">
              {renderParticles(layer3)}
            </motion.div>
          </motion.div>

          {/* Glow rings that pulse with breathing */}
          {isActive && (
            <>
              <motion.div
                animate={{ scale: getScale(0.6), opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: getDuration(), ease: "easeInOut", opacity: { repeat: Infinity, duration: 3 } }}
                className="absolute w-[400px] h-[400px] rounded-full border border-[#DECAA4]/20 dark:border-[#DECAA4]/10"
              />
              <motion.div
                animate={{ scale: getScale(0.9), opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: getDuration(), ease: "easeInOut", opacity: { repeat: Infinity, duration: 4 } }}
                className="absolute w-[550px] h-[550px] rounded-full border border-[#8BA6B8]/15 dark:border-[#8BA6B8]/10"
              />
            </>
          )}
        </div>
        <motion.div
          animate={{ scale: getScale(1.2) }}
          transition={{ duration: getDuration(), ease: "easeInOut" }}
          className="absolute w-40 h-40 rounded-full opacity-30 filter blur-3xl bg-[#C2A385] mix-blend-multiply dark:mix-blend-screen"
        />
        
        <motion.div
          animate={{ scale: getScale(0.5) }}
          transition={{ duration: getDuration(), ease: "easeInOut" }}
          className="absolute w-56 h-56 rounded-full opacity-[0.85] backdrop-blur-[2px] border border-white/60 dark:border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.7)] dark:shadow-[0_0_50px_rgba(222,202,164,0.15)] bg-gradient-to-tr from-[#DECAA4]/20 to-[#FCF9F3]/80 dark:from-[#3a3028]/60 dark:to-[#2a2420]/80 flex items-center justify-center overflow-hidden"
        />

        {/* Center text */}
        <div className="absolute flex flex-col items-center justify-center pointer-events-none drop-shadow-sm z-30">
          <AnimatePresence mode="wait">
            {appState === 'countdown' ? (
              <motion.div
                key="countdown"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <span className="text-sm font-medium text-[#8B7D6E] dark:text-[#B0A090] mb-2">Chuẩn bị</span>
                <motion.span
                  key={countdownValue}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-8xl font-light font-mono text-[#5A4D41] dark:text-[#F5EDE0]"
                >
                  {countdownValue}
                </motion.span>
              </motion.div>
            ) : isActive ? (
              <motion.div key="breathing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-medium text-[#4A3C31] dark:text-[#F5EDE0]"
                >
                  {phaseText[phase]}
                </motion.span>
                <span className="text-8xl font-light mt-1 font-mono text-[#5A4D41] dark:text-[#F5EDE0]">{timeLeft}</span>
              </motion.div>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[#8B7D6E] dark:text-[#B0A090] font-medium text-xl text-center leading-relaxed"
              >
                Thả lỏng cơ thể <br/><span className="text-sm opacity-80 mt-1">Hít thở đều</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar — 60fps smooth via requestAnimationFrame */}
      <div className="absolute bottom-32 w-full max-w-md px-6 z-40">
        <div className={`transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-[3px] bg-[#E8DFC9] dark:bg-white/10 rounded-full overflow-hidden w-full">
            <div
              ref={progressRef}
              className="h-full bg-gradient-to-r from-[#C2A385] to-[#8BA6B8] rounded-full"
              style={{ width: '0%' }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs transition-opacity duration-500">
            <span className={`transition-colors ${phase === 'inhale' ? 'text-[#5A4D41] dark:text-[#F5EDE0] font-semibold' : 'text-[#C2A385]'}`}>Hít vào</span>
            {(technique.pattern.hold1 > 0 || technique.pattern.hold2 > 0) && (
              <span className={`transition-colors ${(phase === 'hold1' || phase === 'hold2') ? 'text-[#5A4D41] dark:text-[#F5EDE0] font-semibold' : 'text-[#C2A385]'}`}>Giữ hơi</span>
            )}
            <span className={`transition-colors ${phase === 'exhale' ? 'text-[#5A4D41] dark:text-[#F5EDE0] font-semibold' : 'text-[#C2A385]'}`}>Thở ra</span>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className={`absolute bottom-12 inset-x-0 w-full flex justify-center space-x-6 z-40 items-center transition-opacity duration-300 px-6 ${zenMode && isActive ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
        <button
          onClick={toggleTimer}
          disabled={appState === 'countdown'}
          className="flex-1 max-w-[160px] sm:max-w-[200px] flex justify-center items-center py-4 bg-[#5A4D41] text-white rounded-full font-medium hover:bg-[#4A3C31] transition-all shadow-[0_8px_20px_rgba(90,77,65,0.2)] hover:shadow-[0_10px_25px_rgba(90,77,65,0.3)] hover:-translate-y-1 cursor-pointer text-lg border border-[#4A3C31] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {appState === 'countdown' ? 'Đang chuẩn bị...' : isActive ? 'Tạm Dừng' : (sessionTime > 0 ? 'Tiếp Tục' : 'Bắt Đầu')}
        </button>
        <button
          onClick={resetTimer}
          className={`flex-1 max-w-[160px] sm:max-w-[200px] flex justify-center items-center py-4 bg-white/70 dark:bg-white/10 backdrop-blur-[2px] text-[#5A4D41] dark:text-[#DECAA4] border border-[#DECAA4] dark:border-white/10 rounded-full font-medium hover:bg-[#FCF9F3] dark:hover:bg-white/20 transition-all shadow-sm hover:shadow-md cursor-pointer text-lg whitespace-nowrap ${
            sessionTime > 0 ? 'opacity-100 flex-shrink-0' : 'hidden opacity-0 pointer-events-none'
          }`}
        >
          Làm Mới
        </button>
      </div>

      {/* Hidden Audio elements for better React/Browser integration */}
      <audio ref={bgAudioRef} loop />
      <audio 
        ref={audioRef} 
        src="https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" 
        preload="auto" 
      />
      <audio ref={inhaleAudioRef} src="/hit%20vao.mp3" preload="auto" />
      <audio ref={exhaleAudioRef} src="/tho%20ra.mp3" preload="auto" />
      <audio ref={holdAudioRef} src="/giu%20hoi%20tho.mp3" preload="auto" />
    </div>
  );
};
