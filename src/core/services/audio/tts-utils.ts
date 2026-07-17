/**
 * TTS 通用工具函数
 *
 * 集中所有跨 provider 复用的纯函数：
 *   - escapeSSML()           SSML XML 字符转义
 *   - estimateDuration()     文本时长估算（中英文加权）
 *   - splitText()            流式场景下文本分块
 *   - saveAudio()            浏览器端 ArrayBuffer → 下载文件
 *
 * 提取动机：原 tts-service.ts 中 5 个 stub provider + 1 个真实 provider
 * 都要"先 split 再 escape 再 estimate"，把它们集中后新增 provider
 * 不需要复制粘贴 4 段几乎一样的代码。
 */

/**
 * 转义 SSML 特殊字符
 * Edge TTS 在 SSML body 里嵌入文本，必须把 & < > " ' 五字符替换为 entity
 * 否则服务端 XML parser 会报错。
 */
export function escapeSSML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 估算音频时长（秒）
 * 经验值：中文每字 0.3s、英文每词 0.2s，最终除以 speed。
 */
export function estimateDuration(text: string, speed: number): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

  const baseDuration = chineseChars * 0.3 + englishWords * 0.2;
  return baseDuration / speed;
}

/**
 * 把文本按句号/问号/叹号切分后，再按 maxLength 聚合为多块。
 * 用途：Edge TTS 流式（实际是"伪流式"）把长文本切成 ≤500 字符的小段逐次请求。
 *
 * 实现要点：
 *   1. 用 split(/([。！？.!?])/) 保留分隔符——让每个 chunk 自带句末标点
 *   2. 单句超过 maxLength 时强制按字符切片兜底
 *   3. 输入为空字符串时返回 [text]（避免下游 fetch 0 字节 body）
 */
export function splitText(text: string, maxLength: number): string[] {
  const sentences = text.split(/([。！？.!?])/);
  const chunks: string[] = [];
  let current = '';

  for (const part of sentences) {
    if (current.length + part.length > maxLength) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      // 单句超长：按字符强制切
      if (part.length > maxLength) {
        for (let i = 0; i < part.length; i += maxLength) {
          chunks.push(part.slice(i, i + maxLength));
        }
      } else {
        current = part;
      }
    } else {
      current += part;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * 浏览器端把 ArrayBuffer 音频数据保存为本地下载文件。
 * 通过 Blob + URL.createObjectURL + 临时 <a> 元素触发下载。
 */
export function saveAudio(audio: ArrayBuffer, filename: string): void {
  const blob = new Blob([audio], { type: 'audio/mp3' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
