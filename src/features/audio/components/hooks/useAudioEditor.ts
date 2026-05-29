/**
 * useAudioEditor - 音频编辑状态与操作主 Hook
 *
 * Container 职责：
 * - 管理所有音频状态（voiceTracks / backgroundMusic / soundEffects / volumes）
 * - 处理所有业务逻辑（导入、播放、录音、混音配置）
 * - 暴露状态 + 操作给 AudioEditor.tsx（Presenter）
 * - 管理音频元素生命周期（HTMLAudioElement refs）
 *
 * 设计原则：
 * - 状态聚合在 hook 内部，不向上泄漏 useRef / setState
 * - 音频元素用 ref Map 管理（播放控制需要跨 track 互斥）
 * - 配置变化通过 useMemo + useEffect 同步给父组件 onConfigChange
 */

import { convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

import { message } from '@/components/ui/message';
import { logger } from '@/core/utils/logger';
import { generateId, formatTime } from '@/shared/utils';

import {
  AUDIO_FILE_EXTENSIONS,
  DEFAULT_AUDIO_VOLUME,
  type VoiceTrack,
  type BackgroundMusic,
  type SoundEffect,
  type AudioTrackConfig,
  type AudioPlaybackState,
} from '../../types/audio.entities';

interface UseAudioEditorOptions {
  projectId?: string;
  initialConfig?: Partial<AudioTrackConfig>;
  onConfigChange?: (config: AudioTrackConfig) => void;
  videoDuration?: number;
  disabled?: boolean;
}

export interface UseAudioEditorReturn {
  // ---- 状态 ----
  voiceTracks: VoiceTrack[];
  backgroundMusic: BackgroundMusic | null;
  soundEffects: SoundEffect[];
  masterVolume: number;
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
  playback: AudioPlaybackState;
  activeTab: string;
  isRecording: boolean;
  recordingTime: number;
  audioConfig: AudioTrackConfig;

  // ---- 操作（配音）----
  handleVoiceImport: () => Promise<void>;
  handleVoiceRemove: (id: string) => void;
  handleVoicePlay: (track: VoiceTrack) => void;
  handleVoiceVolumeChange: (id: string, volume: number) => void;
  handleVoiceStartTimeChange: (id: string, startTime: number) => void;

  // ---- 操作（背景音乐）----
  handleMusicSelect: () => Promise<void>;
  handleMusicRemove: () => void;
  handleMusicPlay: () => void;
  handleMusicVolumeChange: (volume: number) => void;
  handleMusicLoopChange: (loop: boolean) => void;

  // ---- 操作（音效）----
  handleSfxImport: () => Promise<void>;
  handleSfxRemove: (id: string) => void;
  handleSfxPlay: (effect: SoundEffect) => void;
  handleSfxVolumeChange: (id: string, volume: number) => void;
  handleSfxStartTimeChange: (id: string, startTime: number) => void;

  // ---- 操作（录音）----
  handleStartRecording: () => Promise<void>;
  handleStopRecording: () => void;

  // ---- 混音操作 ----
  setMasterVolume: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setEffectVolume: (v: number) => void;
  setActiveTab: (tab: string) => void;
  setBackgroundMusic: (bgm: BackgroundMusic | null) => void;
}

export function useAudioEditor({
  initialConfig,
  onConfigChange,
  videoDuration = 60,
  disabled = false,
}: UseAudioEditorOptions): UseAudioEditorReturn {
  // ========== 状态 ==========
  const [voiceTracks, setVoiceTracks] = useState<VoiceTrack[]>(initialConfig?.voiceTracks || []);
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundMusic | null>(
    initialConfig?.backgroundMusic || null
  );
  const [soundEffects, setSoundEffects] = useState<SoundEffect[]>(
    initialConfig?.soundEffects || []
  );
  const [masterVolume, setMasterVolume] = useState(
    initialConfig?.masterVolume ?? DEFAULT_AUDIO_VOLUME.master
  );
  const [voiceVolume, setVoiceVolume] = useState(
    initialConfig?.voiceVolume ?? DEFAULT_AUDIO_VOLUME.voice
  );
  const [musicVolume, setMusicVolume] = useState(
    initialConfig?.musicVolume ?? DEFAULT_AUDIO_VOLUME.music
  );
  const [effectVolume, setEffectVolume] = useState(
    initialConfig?.effectVolume ?? DEFAULT_AUDIO_VOLUME.effect
  );
  const [activeTab, setActiveTab] = useState('voice');

  // 播放状态
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playingMusic, setPlayingMusic] = useState(false);
  const [playingSfxId, setPlayingSfxId] = useState<string | null>(null);

  // 录音状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 音频元素 refs（避免暴露到 UI 层）
  const voiceAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // ========== 计算属性 ==========
  const playback = useMemo<AudioPlaybackState>(
    () => ({ playingVoiceId, playingMusic, playingSfxId }),
    [playingVoiceId, playingMusic, playingSfxId]
  );

  const audioConfig = useMemo<AudioTrackConfig>(
    () => ({
      voiceTracks,
      backgroundMusic,
      soundEffects,
      masterVolume,
      voiceVolume,
      musicVolume,
      effectVolume,
    }),
    [
      voiceTracks,
      backgroundMusic,
      soundEffects,
      masterVolume,
      voiceVolume,
      musicVolume,
      effectVolume,
    ]
  );

  // ========== 副作用：同步配置到父组件 ==========
  useEffect(() => {
    onConfigChange?.(audioConfig);
  }, [audioConfig, onConfigChange]);

  // ========== 副作用：清理音频元素 ==========
  useEffect(() => {
    const voiceRefs = voiceAudioRefs.current;
    const sfxRefs = sfxAudioRefs.current;
    const musicRef = musicAudioRef.current;

    return () => {
      voiceRefs.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      if (musicRef) {
        musicRef.pause();
        musicRef.src = '';
      }
      sfxRefs.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      // 释放 blob URLs
      voiceTracks.forEach((track) => {
        if (track.fileUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(track.fileUrl);
        }
      });
    };
  }, [voiceTracks]);

  // ========== 工具方法 ==========

  /** 停止所有音频播放 */
  const stopAllAudio = useCallback(() => {
    voiceAudioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
    }
    sfxAudioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    setPlayingVoiceId(null);
    setPlayingMusic(false);
    setPlayingSfxId(null);
  }, []);

  /** 从文件路径加载音频元数据 */
  const loadAudioFromPath = useCallback(
    (filePath: string): Promise<{ duration: number; fileUrl: string }> => {
      return new Promise((resolve, reject) => {
        const fileUrl = convertFileSrc(filePath);
        const audio = new Audio(fileUrl);
        audio.onloadedmetadata = () => resolve({ duration: audio.duration, fileUrl });
        audio.onerror = () => reject(new Error(`无法加载音频: ${filePath}`));
      });
    },
    []
  );

  // ========== 配音操作 ==========

  const handleVoiceImport = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: '音频文件', extensions: AUDIO_FILE_EXTENSIONS }],
      });
      if (!selected || !Array.isArray(selected)) return;

      const newTracks: VoiceTrack[] = [];
      for (const filePath of selected) {
        const fileName = (filePath.split('/').pop() || '配音音频').replace(/\.[^/.]+$/, '');
        try {
          const { duration, fileUrl } = await loadAudioFromPath(filePath);
          newTracks.push({
            id: generateId(),
            name: fileName,
            filePath,
            fileUrl,
            duration,
            startTime: 0,
            volume: 80,
            fadeIn: 0,
            fadeOut: 0,
            type: 'dubbing',
          });
        } catch {
          message.error(`无法加载音频文件: ${fileName}`);
        }
      }

      if (newTracks.length > 0) {
        setVoiceTracks((prev) => [...prev, ...newTracks]);
        message.success(`成功导入 ${newTracks.length} 个配音文件`);
      }
    } catch (error) {
      logger.error('导入配音失败:', error);
      message.error('导入配音失败，请重试');
    }
  }, [loadAudioFromPath]);

  const handleVoiceRemove = useCallback(
    (id: string) => {
      const track = voiceTracks.find((t) => t.id === id);
      if (track?.fileUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(track.fileUrl);
      }
      setVoiceTracks((prev) => prev.filter((t) => t.id !== id));
      message.success('配音已移除');
    },
    [voiceTracks]
  );

  const handleVoicePlay = useCallback(
    (track: VoiceTrack) => {
      if (playingVoiceId === track.id) {
        const audio = voiceAudioRefs.current.get(track.id);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingVoiceId(null);
      } else {
        stopAllAudio();

        let audio = voiceAudioRefs.current.get(track.id);
        if (!audio && track.fileUrl) {
          audio = new Audio(track.fileUrl);
          voiceAudioRefs.current.set(track.id, audio);
        }
        if (audio) {
          audio.volume = (track.volume / 100) * (voiceVolume / 100) * (masterVolume / 100);
          audio.play();
          setPlayingVoiceId(track.id);
          audio.onended = () => setPlayingVoiceId(null);
        }
      }
    },
    [playingVoiceId, voiceVolume, masterVolume, stopAllAudio]
  );

  const handleVoiceVolumeChange = useCallback((id: string, volume: number) => {
    setVoiceTracks((prev) => prev.map((t) => (t.id === id ? { ...t, volume } : t)));
  }, []);

  const handleVoiceStartTimeChange = useCallback((id: string, startTime: number) => {
    setVoiceTracks((prev) => prev.map((t) => (t.id === id ? { ...t, startTime } : t)));
  }, []);

  // ========== 背景音乐操作 ==========

  const handleMusicSelect = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: '音频文件', extensions: AUDIO_FILE_EXTENSIONS }],
      });
      if (!selected || Array.isArray(selected)) return;

      const filePath = selected as string;
      const fileName = (filePath.split('/').pop() || '背景音乐').replace(/\.[^/.]+$/, '');
      try {
        const { duration, fileUrl } = await loadAudioFromPath(filePath);
        setBackgroundMusic({
          id: generateId(),
          name: fileName,
          filePath,
          fileUrl,
          duration,
          volume: 50,
          fadeIn: 2,
          fadeOut: 2,
          loop: true,
          startTime: 0,
        });
        message.success('背景音乐添加成功');
      } catch {
        message.error('无法加载音频文件');
      }
    } catch (error) {
      logger.error('选择背景音乐失败:', error);
      message.error('选择背景音乐失败，请重试');
    }
  }, [loadAudioFromPath]);

  const handleMusicRemove = useCallback(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
    }
    setBackgroundMusic(null);
    setPlayingMusic(false);
    message.success('背景音乐已移除');
  }, []);

  const handleMusicPlay = useCallback(() => {
    if (!backgroundMusic) return;

    if (playingMusic) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current.currentTime = 0;
      }
      setPlayingMusic(false);
    } else {
      stopAllAudio();

      let audio = musicAudioRef.current;
      if (!audio && backgroundMusic.fileUrl) {
        audio = new Audio(backgroundMusic.fileUrl);
        audio.loop = true;
        musicAudioRef.current = audio;
      }
      if (audio) {
        audio.volume = (backgroundMusic.volume / 100) * (musicVolume / 100) * (masterVolume / 100);
        audio.play();
        setPlayingMusic(true);
      }
    }
  }, [backgroundMusic, playingMusic, musicVolume, masterVolume, stopAllAudio]);

  const handleMusicVolumeChange = useCallback((volume: number) => {
    setBackgroundMusic((prev) => (prev ? { ...prev, volume } : null));
  }, []);

  const handleMusicLoopChange = useCallback((loop: boolean) => {
    setBackgroundMusic((prev) => {
      if (!prev) return null;
      if (musicAudioRef.current) musicAudioRef.current.loop = loop;
      return { ...prev, loop };
    });
  }, []);

  // ========== 音效操作 ==========

  const handleSfxImport = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: '音频文件', extensions: AUDIO_FILE_EXTENSIONS }],
      });
      if (!selected || !Array.isArray(selected)) return;

      const newEffects: SoundEffect[] = [];
      for (const filePath of selected) {
        const fileName = (filePath.split('/').pop() || '音效').replace(/\.[^/.]+$/, '');
        try {
          const { duration, fileUrl } = await loadAudioFromPath(filePath);
          newEffects.push({
            id: generateId(),
            name: fileName,
            filePath,
            fileUrl,
            duration,
            volume: 80,
            startTime: 0,
            category: '自定义',
          });
        } catch {
          message.error(`无法加载音频文件: ${fileName}`);
        }
      }

      if (newEffects.length > 0) {
        setSoundEffects((prev) => [...prev, ...newEffects]);
        message.success(`成功导入 ${newEffects.length} 个音效文件`);
      }
    } catch (error) {
      logger.error('导入音效失败:', error);
      message.error('导入音效失败，请重试');
    }
  }, [loadAudioFromPath]);

  const handleSfxRemove = useCallback((id: string) => {
    setSoundEffects((prev) => prev.filter((e) => e.id !== id));
    message.success('音效已移除');
  }, []);

  const handleSfxPlay = useCallback(
    (effect: SoundEffect) => {
      if (playingSfxId === effect.id) {
        const audio = sfxAudioRefs.current.get(effect.id);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingSfxId(null);
      } else {
        stopAllAudio();

        let audio = sfxAudioRefs.current.get(effect.id);
        if (!audio && effect.fileUrl) {
          audio = new Audio(effect.fileUrl);
          sfxAudioRefs.current.set(effect.id, audio);
        }
        if (audio) {
          audio.volume = (effect.volume / 100) * (effectVolume / 100) * (masterVolume / 100);
          audio.play();
          setPlayingSfxId(effect.id);
          audio.onended = () => setPlayingSfxId(null);
        }
      }
    },
    [playingSfxId, effectVolume, masterVolume, stopAllAudio]
  );

  const handleSfxVolumeChange = useCallback((id: string, volume: number) => {
    setSoundEffects((prev) => prev.map((e) => (e.id === id ? { ...e, volume } : e)));
  }, []);

  const handleSfxStartTimeChange = useCallback((id: string, startTime: number) => {
    setSoundEffects((prev) => prev.map((e) => (e.id === id ? { ...e, startTime } : e)));
  }, []);

  // ========== 录音操作 ==========

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const fileName = `录音_${formatTime(recordingTime)}`;

        setVoiceTracks((prev) => [
          ...prev,
          {
            id: generateId(),
            name: fileName,
            filePath: '',
            fileUrl: url,
            duration: recordingTime,
            startTime: 0,
            volume: 80,
            fadeIn: 0,
            fadeOut: 0,
            type: 'voiceover',
          },
        ]);
        message.success('录音完成');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      recordingTimerRef.current = timer;
    } catch (error) {
      logger.error('开始录音失败:', error);
      message.error('无法访问麦克风，请检查权限设置');
    }
  }, [recordingTime]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  }, [isRecording]);

  return {
    // 状态
    voiceTracks,
    backgroundMusic,
    soundEffects,
    masterVolume,
    voiceVolume,
    musicVolume,
    effectVolume,
    playback,
    activeTab,
    isRecording,
    recordingTime,
    audioConfig,
    // 配音
    handleVoiceImport,
    handleVoiceRemove,
    handleVoicePlay,
    handleVoiceVolumeChange,
    handleVoiceStartTimeChange,
    // 背景音乐
    handleMusicSelect,
    handleMusicRemove,
    handleMusicPlay,
    handleMusicVolumeChange,
    handleMusicLoopChange,
    // 音效
    handleSfxImport,
    handleSfxRemove,
    handleSfxPlay,
    handleSfxVolumeChange,
    handleSfxStartTimeChange,
    // 录音
    handleStartRecording,
    handleStopRecording,
    // 混音
    setMasterVolume,
    setVoiceVolume,
    setMusicVolume,
    setEffectVolume,
    setActiveTab,
    setBackgroundMusic,
  };
}
