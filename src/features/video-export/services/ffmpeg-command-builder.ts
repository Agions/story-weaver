/**
 * FFmpeg 命令流式构造器
 * =====================
 * 把"输入 / 选项 / 滤镜 / 输出"按 ffmpeg CLI 顺序拼接为字符串。
 * 单一职责：流式 builder。无业务语义。
 *
 * 使用：
 *   const cmd = new FFmpegCommandBuilder()
 *     .input('a.mp4')
 *     .option('-crf', '23')
 *     .output('out.mp4', ['-c:v', 'libx264'])
 *     .build();
 */
export class FFmpegCommandBuilder {
  private inputs: string[] = [];
  private filters: string[] = [];
  private outputs: string[] = [];
  private options: string[] = [];

  /** 添加一个 -i 输入 */
  input(path: string): this {
    this.inputs.push(`-i "${path}"`);
    return this;
  }

  /** 添加若干裸选项 (会自动展开) */
  option(...opts: string[]): this {
    this.options.push(...opts);
    return this;
  }

  /** 添加一个 -vf 滤镜 (内部数组, 会在 build 时按 ',' 拼接) */
  filter(filter: string): this {
    this.filters.push(filter);
    return this;
  }

  /** 添加一个 -o 风格的输出 (可附带编码器等选项) */
  output(path: string, options?: string[]): this {
    const opts = options ? options.join(' ') : '';
    this.outputs.push(`${opts} "${path}"`);
    return this;
  }

  /**
   * 拼成 ffmpeg 命令行字符串。
   * 顺序：ffmpeg → inputs → options → (滤镜 -vf "...") → outputs
   */
  build(): string {
    const parts = [
      'ffmpeg',
      ...this.inputs,
      ...this.options,
      this.filters.length > 0 ? `-vf "${this.filters.join(',')}"` : '',
      ...this.outputs,
    ];
    return parts.filter(Boolean).join(' ');
  }
}
