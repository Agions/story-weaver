/**
 * AudioController - 统一管理音频播放
 * 解决 AudioEditor.tsx 中 voice/music/sfx 三处播放逻辑重复的问题
 *
 * 使用示例:
 * import { AudioController } from '@/shared/utils/audio';
 *
 * const audioController = new AudioController((id) => console.log(`${id} ended`));
 * audioController.play('track-1', 'https://example.com/audio.mp3', 80);
 * audioController.stop('track-1');
 * audioController.stopAll();
 * audioController.dispose();
 */

/**
 * 音频控制器 - 管理单个音频元素的播放
 */
export class AudioController {
  private refs: Map<string, HTMLAudioElement> = new Map();
  private currentlyPlaying: string | null = null;
  private onEndedCallback?: (id: string) => void;

  constructor(onEnded?: (id: string) => void) {
    this.onEndedCallback = onEnded;
  }

  /**
   * 播放音频
   * @param id 轨道唯一标识
   * @param url 音频 URL
   * @param volume 音量 (0-100)
   */
  play(id: string, url: string, volume: number): void {
    // 停止当前播放
    this.stopAll();

    // 获取或创建 Audio 元素
    let audio = this.refs.get(id);
    if (!audio || audio.src !== url) {
      audio = new Audio(url);
      this.refs.set(id, audio);
    }

    // 设置音量
    audio.volume = Math.max(0, Math.min(1, volume / 100));
    audio.play();
    this.currentlyPlaying = id;

    // 设置结束回调
    audio.onended = () => {
      this.currentlyPlaying = null;
      this.onEndedCallback?.(id);
    };
  }

  /**
   * 暂停指定音频
   */
  pause(id: string): void {
    const audio = this.refs.get(id);
    if (audio) {
      audio.pause();
      if (this.currentlyPlaying === id) {
        this.currentlyPlaying = null;
      }
    }
  }

  /**
   * 停止指定音频并重置
   */
  stop(id: string): void {
    const audio = this.refs.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      if (this.currentlyPlaying === id) {
        this.currentlyPlaying = null;
      }
    }
  }

  /**
   * 停止所有音频
   */
  stopAll(): void {
    this.refs.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.currentlyPlaying = null;
  }

  /**
   * 获取当前播放中的 ID
   */
  getCurrentlyPlaying(): string | null {
    return this.currentlyPlaying;
  }

  /**
   * 是否正在播放指定音频
   */
  isPlaying(id: string): boolean {
    return this.currentlyPlaying === id;
  }

  /**
   * 释放所有资源
   */
  dispose(): void {
    this.stopAll();
    this.refs.clear();
  }
}

/**
 * 分层音频控制器 - 支持 masterVolume → categoryVolume → trackVolume 三级音量控制
 * 适用于需要区分配音、背景音乐、音效三种音量的场景
 */
export class HierarchicalAudioController {
  private controllers: Map<string, AudioController> = new Map();
  private masterVolume: number = 100;
  private categoryVolumes: Map<string, number> = new Map();
  private onEnded?: (category: string, id: string) => void;

  constructor(onEnded?: (category: string, id: string) => void) {
    this.onEnded = onEnded;
  }

  /**
   * 注册音频类别（如 'voice' | 'music' | 'sfx'）
   */
  registerCategory(category: string): void {
    if (!this.controllers.has(category)) {
      this.controllers.set(
        category,
        new AudioController((id) => this.onEnded?.(category, id))
      );
    }
  }

  /**
   * 注销音频类别
   */
  unregisterCategory(category: string): void {
    const controller = this.controllers.get(category);
    if (controller) {
      controller.dispose();
      this.controllers.delete(category);
    }
  }

  /**
   * 设置主音量 (0-100)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(100, volume));
  }

  /**
   * 设置类别音量 (0-100)
   */
  setCategoryVolume(category: string, volume: number): void {
    this.categoryVolumes.set(category, Math.max(0, Math.min(100, volume)));
  }

  /**
   * 计算最终音量（轨道 × 类别 × 主音量）
   */
  private calculateVolume(category: string, trackVolume: number): number {
    const catVol = this.categoryVolumes.get(category) ?? 100;
    return (trackVolume / 100) * (catVol / 100) * (this.masterVolume / 100);
  }

  /**
   * 播放指定类别和轨道
   */
  play(category: string, id: string, url: string, trackVolume: number): void {
    const controller = this.controllers.get(category);
    if (controller) {
      const finalVolume = this.calculateVolume(category, trackVolume);
      controller.play(id, url, finalVolume * 100);
    }
  }

  /**
   * 停止指定类别所有音频
   */
  stopCategory(category: string): void {
    this.controllers.get(category)?.stopAll();
  }

  /**
   * 停止所有音频
   */
  stopAll(): void {
    this.controllers.forEach((ctrl) => ctrl.stopAll());
  }

  /**
   * 释放所有资源
   */
  dispose(): void {
    this.controllers.forEach((ctrl) => ctrl.dispose());
    this.controllers.clear();
  }
}

/**
 * 录音控制器 - 使用 AbortController 管理生命周期
 * 避免 window 全局变量污染，支持内存泄漏防护
 */
export class RecordingController {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private abortController: AbortController | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private onTimeUpdate?: (seconds: number) => void;
  private recordingTime: number = 0;
  /** 最大 chunk 数量，防止内存泄漏 */
  private readonly MAX_CHUNKS = 100;

  constructor(onTimeUpdate?: (seconds: number) => void) {
    this.onTimeUpdate = onTimeUpdate;
  }

  /**
   * 开始录音
   * @throws Error 如果无法访问麦克风
   */
  async start(): Promise<void> {
    this.stop(); // 清理之前的录音

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.abortController = new AbortController();
    this.chunks = [];
    this.recordingTime = 0;

    // 限制 chunks 数量防止内存泄漏
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        if (this.chunks.length < this.MAX_CHUNKS) {
          this.chunks.push(e.data);
        } else {
          // 当达到限制时，合并并丢弃最早的 chunk
          const oldChunks = this.chunks.splice(0, 50);
          const merged = new Blob(oldChunks, { type: e.data.type });
          this.chunks.push(merged);
        }
      }
    };

    this.mediaRecorder.start();

    // 开始计时
    this.timerInterval = setInterval(() => {
      this.recordingTime++;
      this.onTimeUpdate?.(this.recordingTime);
    }, 1000);
  }

  /**
   * 停止录音，返回录音结果
   */
  async stop(): Promise<{ blob: Blob; duration: number } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        const duration = this.recordingTime;

        // 清理资源
        this.cleanup();

        resolve({ blob, duration });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 停止计时器
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // 停止媒体轨道
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;

    // 清理 AbortController
    this.abortController?.abort();
    this.abortController = null;

    // 清理 chunks
    this.chunks = [];
    this.recordingTime = 0;

    // 清理 MediaRecorder
    this.mediaRecorder = null;
  }

  /**
   * 是否正在录音
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * 获取当前录音时长
   */
  getRecordingTime(): number {
    return this.recordingTime;
  }

  /**
   * 中止录音并清理
   */
  abort(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  /**
   * 销毁录音器
   */
  dispose(): void {
    this.abort();
  }
}