/**
 * AI 模型提供商配置
 */
import type { ModelProvider } from '@/shared/types';

export const MODEL_PROVIDERS: Record<
  ModelProvider,
  {
    name: string;
    icon: string;
    website: string;
    apiDocs: string;
    keyFormat: string;
    keyPlaceholder: string;
  }
> = {
  openai: {
    name: 'OpenAI',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
    website: 'https://openai.com',
    apiDocs: 'https://platform.openai.com/docs',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
  },
  anthropic: {
    name: 'Anthropic',
    icon: 'https://www.anthropic.com/images/icons/apple-touch-icon.png',
    website: 'https://anthropic.com',
    apiDocs: 'https://docs.anthropic.com',
    keyFormat: 'sk-ant-...',
    keyPlaceholder: 'sk-ant-xxxxxxxxxxxxxxxx',
  },
  google: {
    name: 'Google',
    icon: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    website: 'https://ai.google.dev',
    apiDocs: 'https://ai.google.dev/docs',
    keyFormat: 'AIza...',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxx',
  },
  baidu: {
    name: '百度',
    icon: 'https://nlp-eb.cdn.bcebos.com/logo/ernie-bot.png',
    website: 'https://qianfan.baidu.com',
    apiDocs: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html',
    keyFormat: 'API_KEY:SECRET_KEY',
    keyPlaceholder: '请输入 API_KEY 和 SECRET_KEY',
  },
  alibaba: {
    name: '阿里云',
    icon: 'https://img.alicdn.com/tfs/TB1Ly5oS3HqK1RjSZFPXXcwapXa-238-54.png',
    website: 'https://dashscope.aliyun.com',
    apiDocs: 'https://help.aliyun.com/dashscope',
    keyFormat: 'sk-...',
    keyPlaceholder: 'sk-xxxxxxxxxxxxxxxx',
  },
  zhipu: {
    name: '智谱AI',
    icon: 'https://www.zhipuai.cn/favicon.ico',
    website: 'https://open.bigmodel.cn',
    apiDocs: 'https://open.bigmodel.cn/dev/howuse/glm-4',
    keyFormat: '...',
    keyPlaceholder: 'xxxxxxxx.xxxxxxxx',
  },
  iflytek: {
    name: '科大讯飞',
    icon: 'https://xinghuo.xfyun.cn/favicon.ico',
    website: 'https://xinghuo.xfyun.cn',
    apiDocs: 'https://www.xfyun.cn/doc/spark/Web.html',
    keyFormat: 'APPID:API_KEY:API_SECRET',
    keyPlaceholder: '请输入 APPID、API_KEY 和 API_SECRET',
  },
  tencent: {
    name: '腾讯云',
    icon: 'https://cloud.tencent.com/favicon.ico',
    website: 'https://cloud.tencent.com/product/hunyuan',
    apiDocs: 'https://cloud.tencent.com/document/product/1729',
    keyFormat: 'SecretId:SecretKey',
    keyPlaceholder: '请输入 SecretId 和 SecretKey',
  },
  minimax: {
    name: 'MiniMax',
    icon: 'https://www.minimax.io/favicon.ico',
    website: 'https://www.minimax.io',
    apiDocs: 'https://platform.minimax.io',
    keyFormat: 'api-key',
    keyPlaceholder: 'xxxxxxxxxxxxxxxx',
  },
  moonshot: {
    name: '月之暗面',
    icon: 'https://www.moonshot.cn/favicon.ico',
    website: 'https://www.moonshot.cn',
    apiDocs: 'https://platform.moonshot.cn',
    keyFormat: 'api-key',
    keyPlaceholder: 'xxxxxxxxxxxxxxxx',
  },
  kling: {
    name: '快手可灵',
    icon: 'https://www.kuaishou.com/favicon.ico',
    website: 'https://app.klingai.com',
    apiDocs: 'https://app.klingai.com/global/dev/document-api',
    keyFormat: 'api-key',
    keyPlaceholder: 'xxxxxxxxxxxxxxxx',
  },
  bytedance: {
    name: '字节跳动',
    icon: 'https://www.bytedance.com/favicon.ico',
    website: 'https://www.bytedance.com',
    apiDocs: 'https://www.volcengine.com/docs/6792',
    keyFormat: 'api-key',
    keyPlaceholder: 'xxxxxxxxxxxxxxxx',
  },
};
