// AI 生成组件 — 聚合脚本/角色/渲染生成 UI
// 单一入口，消费者从 `@/components/ai` 导入

export { CharacterDesigner } from './CharacterDesigner';

// Script components — 已迁移
export { default as ScriptGenerator } from './ScriptGenerator/ScriptGenerator';
export { default as ScriptEditor } from './ScriptEditor/ScriptEditor';
export { default as NovelImporter } from './NovelImporter/NovelImporter';
export { default as ScriptPreview } from './ScriptPreview/ScriptPreview';
export { default as ScriptGeneratorView } from './ScriptGeneratorView/ScriptGeneratorView';
export { SegmentTable } from './SegmentTable';
export { ExportMenu } from './ExportMenu';
export type { ScriptImportMetadata } from './NovelImporter/NovelImporter';

// Editor components — 已迁移至子目录
export { default as AIAssistant } from './AIAssistant/AIAssistant';
export { default as EditorView } from './EditorView/EditorView';
export { default as AssetPanel } from './AssetPanel/AssetPanel';
export { default as PropertyPanel } from './PropertyPanel/PropertyPanel';
export { default as Timeline } from './Timeline/Timeline';
export { default as Preview } from './Preview/Preview';
export { default as AIFeaturePanel } from './AIFeaturePanel/AIFeaturePanel';
export { ProgressStatus } from './ProgressStatus/ProgressStatus';
export { OptionSlider } from './AIAssistant/OptionSlider';
export { EnhanceOptionCard } from './AIAssistant/EnhanceOptionCard';
export type { ChatMessage } from './AIAssistant/types/ai-assistant-entities';
