/\*\*

- Before/After Comparison — AudioEditor.tsx DRY 改造
- This file demonstrates the DRY transformation
- (illustration only, not executable)
  \*/

// ================================================================
// BEFORE (repetitive across 5 files)
// ================================================================

// AudioEditor.tsx — 重复片段 A
const handleAudioUpload = async (files: File[]) => {
for (const file of files) {
if (file.size > 50 _ 1024 _ 1024) {
toast.error(`文件 ${file.name} 超过50MB`);
continue;
}
const reader = new FileReader();
reader.onload = () => {
const audio = new Audio(reader.result as string);
audio.onloadedmetadata = () => {
setTracks(prev => [...prev, {
id: crypto.randomUUID(), // ← 重复的 generateId
name: file.name.replace(/\.[^/.]+$/, ''),
duration: audio.duration,
}]);
};
};
reader.readAsDataURL(file);
}
};

// VideoEditor.tsx — 重复片段 B（几乎相同）
const handleVideoUpload = async (files: File[]) => {
for (const file of files) {
if (file.size > 200 _ 1024 _ 1024) { // ← 只是 maxSize 不同
toast.error(`文件 ${file.name} 超过200MB`);
continue;
}
const reader = new FileReader();
reader.onload = () => {
const video = document.createElement('video');
video.onloadedmetadata = () => {
setVideos(prev => [...prev, {
id: crypto.randomUUID(), // ← 重复的 generateId
name: file.name.replace(/\.[^/.]+$/, ''),
duration: video.duration,
}]);
};
};
reader.readAsDataURL(file);
}
};

// ImageEditor.tsx — 重复片段 C（几乎相同）
const handleImageUpload = async (files: File[]) => {
for (const file of files) {
if (file.size > 10 _ 1024 _ 1024) { // ← 只是 maxSize 不同
toast.error(`文件 ${file.name} 超过10MB`);
continue;
}
// ... 重复的上传逻辑
}
};

// ================================================================
// AFTER (zero duplication — uses @frame-forge/common)
// ================================================================

import {
FileUploader, // 统一文件上传
ProgressBar, // 统一进度条
ConfirmDialog, // 统一确认框
generateId, // 统一 ID 生成
formatDuration, // 统一时间格式化
formatFileSize, // 统一文件大小格式化
validateFileSize, // 统一文件大小校验
detectFileType, // 统一文件类型检测
readFileAsDataURL, // 统一文件读取
} from '@frame-forge/common';

import {
useStepNavigation,
useLocalStorage,
useDebounce,
} from '@frame-forge/common/hooks';

import {
validateCharacterName,
validateScriptTitle,
} from '@frame-forge/common/domain/script/validators';

// ✅ AudioEditor: 配置化，0 重复上传逻辑
const AudioEditor: React.FC = ({ onTracksChange }) => (
<FileUploader
accept="audio/\*"
maxCount={20}
maxSize={50}
multiple
onChange={(files) => {
onTracksChange(files.map(f => ({
id: f.uid, // FileUploader 生成的稳定 UID
name: f.name,
url: f.url,
duration: 0,
})));
}}
/>
);

// ✅ VideoEditor: 同样的组件，只是 maxSize 不同
const VideoEditor: React.FC = ({ onVideosChange }) => (
<FileUploader
accept="video/\*"
maxCount={5}
maxSize={200}
multiple
onChange={(files) => {
onVideosChange(files.map(f => ({
id: f.uid,
name: f.name,
url: f.url,
duration: 0,
})));
}}
/>
);

// ✅ 统一的校验
const characterNameValidation = validateCharacterName('小明');
if (!characterNameValidation.valid) {
// 集中的错误处理
console.error(characterNameValidation.errors);
}

// ✅ 统一的时间格式化
formatDuration(90.5, { hours: 'never', ms: 1 }); // "01:30.5"

// ✅ 统一的步骤导航
const { currentStepId, goNext, goPrev, progress } = useStepNavigation({
steps: [
{ id: 'creative', label: '创意' },
{ id: 'script', label: '剧本', isCompleted: true },
{ id: 'asset', label: '资产' },
{ id: 'storyboard', label: '分镜', isLocked: true },
{ id: 'composite', label: '合成', isLocked: true },
],
});

// ================================================================
// ESLint 规则确保零重复
// ================================================================

// .eslintrc.cjs 中配置：
//
// 'sonarjs/no-duplicate': ['error', {
// ignoreLiterals: true,
// ignoreStrings: false,
// }],
//
// CI 中运行：
// npm run lint → 任何重复都会被 ESLint 捕获并报错
//
// 阈值设置为 0（不能有任何重复）
