# P0-1: ProjectEditContext Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 53-prop drilling through `StepContentSwitcher` with a scoped `ProjectEditContext`, reducing the switcher interface to a single `currentStep` prop.

**Architecture:** A React Context + Provider sits inside `pages/project-edit/context/`. It owns the page-level state and handler functions that currently live in `ProjectEditPage`. Step child components consume only their slice via dedicated selector hooks. Existing hooks (`useProject`, `useStoryboard`, `useScriptStep`, `useProjectExport`, `useProjectLoader`) remain unchanged — the Context composes them.

**Tech Stack:** React 18 Context API, TypeScript 5

## Global Constraints

- No new npm dependencies
- Existing hooks (`useProject`, `useStoryboard`, `useScriptStep`, `useProjectExport`, `useProjectLoader`) keep their APIs unchanged
- Each task ends with `npx tsc --noEmit` passing
- Follow existing naming conventions (camelCase functions, PascalCase types)
- Commit message format: lowercase subject per commitlint

---

## File Structure

```
src/pages/project-edit/
├── context/
│   ├── project-edit-state.ts     — State + Actions types + initial values [CREATE]
│   ├── ProjectEditContext.tsx    — Context + Provider + useProjectEdit hook [CREATE]
│   └── selectors.ts              — Per-step selector hooks [CREATE]
├── ProjectEditPage.tsx           — Remove useState/handlers, wrap with Provider [MODIFY]
└── components/
    ├── StepContentSwitcher.tsx   — Slim to 1 prop (currentStep) [MODIFY]
    ├── StepImport.tsx            — Consume useStepImportContext [MODIFY]
    ├── StepAnalysis.tsx         — Consume useStepAnalysisContext [MODIFY]
    ├── StepScript.tsx            — Consume useStepScriptContext [MODIFY]
    ├── StepStoryboard.tsx        — Consume useStepStoryboardContext [MODIFY]
    ├── StepCharacter.tsx         — Consume useStepCharacterContext [MODIFY]
    ├── StepRender.tsx            — Consume useStepRenderContext [MODIFY]
    ├── StepComposition.tsx       — Consume useStepCompositionContext [MODIFY]
    ├── StepAudio.tsx             — Consume useStepAudioContext [MODIFY]
    └── StepExport.tsx            — Consume useStepExportContext [MODIFY]
```

---

### Task 1: Create ProjectEditState types

**Files:**

- Create: `src/pages/project-edit/context/project-edit-state.ts`

**Produces:**

- `ProjectEditState` — interface for all context state fields
- `ProjectEditActions` — interface for all context action functions
- `initialProjectEditState` — default state object

- [ ] **Step 1: Create state types file**

Create `src/pages/project-edit/context/project-edit-state.ts`:

```typescript
import type { ScriptImportMetadata } from '@/features/script/components/NovelImporter';
import type { Character, CompositionProject, StoryAnalysis } from '@/shared/types';
import type { AudioTrackConfig } from '@/shared/types/audio';
import type { QualityGateIssue } from '@/core/services';

export interface ProjectEditState {
  // 内容/分析
  content: string;
  novelMetadata: ScriptImportMetadata | null;
  loading: boolean;
  storyAnalysis: StoryAnalysis | null;
  analysisDraft: string;
  analysisState: 'idle' | 'generated' | 'accepted';
  // 分镜 UI
  commentDraft: string;
  versionLabel: string;
  // 音频
  audioConfig: AudioTrackConfig;
  audioEditorKey: string;
  audioGenerating: boolean;
  // 自定义
  characters: Character[];
  composition: CompositionProject | null;
}

export interface ProjectEditActions {
  // 内容
  loadContent: (content: string, metadata: ScriptImportMetadata) => void;
  removeContent: () => void;
  // AI
  analyzeContent: () => Promise<void>;
  acceptAnalysis: () => Promise<void>;
  setAnalysisDraft: (draft: string) => void;
  // 分镜
  addFrameComment: () => void;
  saveStoryboardVersion: () => void;
  compareVersions: () => void;
  rollbackVersion: () => void;
  buildStoryboardDraft: () => void;
  setCommentDraft: (draft: string) => void;
  setVersionLabel: (label: string) => void;
  // 音频
  generateVoices: () => Promise<void>;
  setAudioConfig: (config: AudioTrackConfig) => void;
  // 导出/保存
  saveProject: () => Promise<void>;
  exportReviewNotes: () => Promise<void>;
  locateIssueFrame: (issue: QualityGateIssue) => void;
  // 剧本
  exportScript: (format: string) => void;
  // 自定义
  setCharacters: (characters: Character[]) => void;
  setComposition: (composition: CompositionProject) => void;
}

export const initialProjectEditState: ProjectEditState = {
  content: '',
  novelMetadata: null,
  loading: false,
  storyAnalysis: null,
  analysisDraft: '',
  analysisState: 'idle',
  commentDraft: '',
  versionLabel: '',
  audioConfig: {
    voiceTracks: [],
    backgroundMusic: null,
    soundEffects: [],
    masterVolume: 80,
    voiceVolume: 80,
    musicVolume: 50,
    effectVolume: 70,
  },
  audioEditorKey: 'audio-init',
  audioGenerating: false,
  characters: [],
  composition: null,
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/project-edit/context/project-edit-state.ts
git commit -m "feat: add ProjectEditState types and initial values"
```

---

### Task 2: Create ProjectEditContext Provider

**Files:**

- Create: `src/pages/project-edit/context/ProjectEditContext.tsx`

**Consumes:**

- `ProjectEditState`, `ProjectEditActions`, `initialProjectEditState` from Task 1

**Produces:**

- `ProjectEditContext` — React Context
- `ProjectEditProvider` — wraps children with state + actions
- `useProjectEdit()` — hook to access full context (for page header, navigation)

- [ ] **Step 1: Create context provider**

Create `src/pages/project-edit/context/ProjectEditContext.tsx`:

```typescript
import { createContext, useContext } from 'react';

import type { ProjectEditState, ProjectEditActions } from './project-edit-state';

export interface ProjectEditContextValue {
  state: ProjectEditState;
  actions: ProjectEditActions;
}

export const ProjectEditContext = createContext<ProjectEditContextValue | null>(null);

export function useProjectEdit(): ProjectEditContextValue {
  const ctx = useContext(ProjectEditContext);
  if (!ctx) {
    throw new Error('useProjectEdit must be used within ProjectEditProvider');
  }
  return ctx;
}

// Provider implemented in Task 3 (after we know what state/actions to wire)
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/project-edit/context/ProjectEditContext.tsx
git commit -m "feat: add ProjectEditContext skeleton"
```

---

### Task 3: Create selector hooks for each step

**Files:**

- Create: `src/pages/project-edit/context/selectors.ts`

**Consumes:**

- `useProjectEdit` from Task 2

**Produces:**

- `useStepImportContext()` — returns { content, loading, novelMetadata, onLoad, onRemove, onAnalyze }
- `useStepAnalysisContext()` — returns { content, storyAnalysis, analysisDraft, analysisState, ... }
- `useStepScriptContext()` — returns { scriptText, onExportScript, onSaveScript }
- `useStepStoryboardContext()` — returns { commentDraft, versionLabel, onAddComment, ... }
- `useStepCharacterContext()` — returns { characters, onChange }
- `useStepRenderContext()` — returns { onApplyRenderedFrame }
- `useStepCompositionContext()` — returns { onCompositionChange }
- `useStepAudioContext()` — returns { audioConfig, onConfigChange, onGenerateVoices }
- `useStepExportContext()` — returns { exportPreset, exportSettings, onPresetChange, onExportSettingsChange, onSaveProject, onLocateIssue }

- [ ] **Step 1: Create selectors file**

Create `src/pages/project-edit/context/selectors.ts`:

```typescript
import { useProjectExport } from '../hooks/useProjectExport';
import { useScriptStep } from '../hooks/useScriptStep';
import { useStoryboard } from '@/shared/stores/storyboard.store';
import { useProjectEdit } from './ProjectEditContext';

// Step 0: Import
export function useStepImportContext() {
  const { state, actions } = useProjectEdit();
  return {
    content: state.content,
    loading: state.loading,
    onLoad: actions.loadContent,
    onRemove: actions.removeContent,
    onAnalyze: actions.analyzeContent,
  };
}

// Step 1: Analysis
export function useStepAnalysisContext() {
  const { state, actions } = useProjectEdit();
  return {
    content: state.content,
    novelMetadata: state.novelMetadata,
    loading: state.loading,
    storyAnalysis: state.storyAnalysis,
    analysisDraft: state.analysisDraft,
    analysisState: state.analysisState,
    onAnalyze: actions.analyzeContent,
    onAcceptAnalysis: actions.acceptAnalysis,
    onDraftChange: actions.setAnalysisDraft,
  };
}

// Step 2: Script
export function useStepScriptContext() {
  const { scriptText, saveScriptFromSegments } = useScriptStep();
  const { actions } = useProjectEdit();
  return {
    scriptText,
    onExportScript: actions.exportScript,
    onSaveScript: saveScriptFromSegments,
  };
}

// Step 3: Storyboard
export function useStepStoryboardContext() {
  const { state, actions } = useProjectEdit();
  const storyboard = useStoryboard();
  return {
    frames: storyboard.frames,
    selectedFrame: storyboard.selectedFrame,
    commentDraft: state.commentDraft,
    versionLabel: state.versionLabel,
    compareLeftVersionId: storyboard.compareLeftVersionId,
    compareRightVersionId: storyboard.compareRightVersionId,
    versionDiff: storyboard.versionDiff,
    versions: storyboard.versions,
    onAddComment: actions.addFrameComment,
    onSaveVersion: actions.saveStoryboardVersion,
    onCompareVersions: actions.compareVersions,
    onRollback: actions.rollbackVersion,
    onBuildDraft: actions.buildStoryboardDraft,
    onCommentDraftChange: actions.setCommentDraft,
    onVersionLabelChange: actions.setVersionLabel,
    onFramesChange: storyboard.setFrames,
    onFrameSelect: storyboard.selectFrame,
    onLeftVersionChange: storyboard.setCompareLeft,
    onRightVersionChange: storyboard.setCompareRight,
  };
}

// Step 4: Character
export function useStepCharacterContext() {
  const { state, actions } = useProjectEdit();
  return {
    characters: state.characters,
    onChange: actions.setCharacters,
  };
}

// Step 5: Render
export function useStepRenderContext() {
  const storyboard = useStoryboard();
  return {
    frames: storyboard.frames,
    // onApplyRenderedFrame handled via store
  };
}

// Step 6: Composition
export function useStepCompositionContext() {
  const storyboard = useStoryboard();
  const { actions } = useProjectEdit();
  return {
    frames: storyboard.frames,
    onCompositionChange: actions.setComposition,
  };
}

// Step 7: Audio
export function useStepAudioContext() {
  const { state, actions } = useProjectEdit();
  const storyboard = useStoryboard();
  return {
    audioConfig: state.audioConfig,
    audioGenerating: state.audioGenerating,
    frames: storyboard.frames,
    onConfigChange: actions.setAudioConfig,
    onGenerateVoices: actions.generateVoices,
  };
}

// Step 8: Export
export function useStepExportContext() {
  const { actions } = useProjectEdit();
  const storyboard = useStoryboard();
  const { exportPreset, exportSettings, setExportPreset, mergeExportSettings } = useProjectExport();
  return {
    exportPreset,
    exportSettings,
    framesCount: storyboard.frames.length,
    onPresetChange: setExportPreset,
    onExportSettingsChange: mergeExportSettings,
    onSaveProject: actions.saveProject,
    onLocateIssue: actions.locateIssueFrame,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/project-edit/context/selectors.ts
git commit -m "feat: add per-step selector hooks for ProjectEditContext"
```

---

### Task 4: Wire Provider in ProjectEditPage (state + actions)

**Files:**

- Modify: `src/pages/project-edit/ProjectEditPage.tsx:42-623`

**Consumes:**

- `ProjectEditContext` from Task 2

**Produces:**

- `ProjectEditPage` with Provider wrapping JSX
- All 20+ useState replaced by single `useReducer` or `useState` inside Provider

- [ ] **Step 1: Refactor Provider to include state management**

Replace `ProjectEditContext.tsx` with full implementation:

```typescript
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

import { useProject } from '@/core/hooks/useProject';
import { aiService, audioPipelineService, collaborationService, costService, qualityGateService, reviewExportService, storyAnalysisService, tauriService } from '@/core/services';
import { logger } from '@/core/utils/logger';
import type { QualityGateIssue } from '@/core/services';
import type { ScriptImportMetadata } from '@/features/script/components/NovelImporter';
import { useStoryboard } from '@/shared/stores/storyboard.store';
import { toast } from '@/shared/components/ui/toast';
import type { Character, CompositionProject, StoryAnalysis } from '@/shared/types';
import type { AudioTrackConfig } from '@/shared/types/audio';
import type { VideoSegment, StoryboardFrame } from '@/shared/types';
import { useProjectExport } from '../hooks/useProjectExport';
import { useScriptStep } from '../hooks/useScriptStep';

import type { ProjectEditState, ProjectEditActions } from './project-edit-state';
import { initialProjectEditState } from './project-edit-state';

interface ProjectEditContextValue {
  state: ProjectEditState;
  actions: ProjectEditActions;
}

const ProjectEditContext = createContext<ProjectEditContextValue | null>(null);

export function useProjectEdit(): ProjectEditContextValue {
  const ctx = useContext(ProjectEditContext);
  if (!ctx) throw new Error('useProjectEdit must be used within ProjectEditProvider');
  return ctx;
}

interface ProviderProps {
  children: React.ReactNode;
  // Injected from page
  navigate: ReturnType<typeof useNavigate>;
  project: ReturnType<typeof useProject>['project'];
  updateProject: ReturnType<typeof useProject>['updateProject'];
  saving: boolean;
  setSaving: (v: boolean) => void;
  focusFrameId: string | undefined;
  setFocusFrameId: (id: string | undefined) => void;
}

export function ProjectEditProvider({ children, navigate, project, updateProject, saving, setSaving, focusFrameId, setFocusFrameId }: ProviderProps) {
  // State
  const [content, setContent] = useState('');
  const [novelMetadata, setNovelMetadata] = useState<ScriptImportMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyAnalysis, setStoryAnalysis] = useState<StoryAnalysis | null>(null);
  const [analysisDraft, setAnalysisDraft] = useState('');
  const [analysisState, setAnalysisState] = useState<'idle' | 'generated' | 'accepted'>('idle');
  const [commentDraft, setCommentDraft] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const [audioConfig, setAudioConfig] = useState<AudioTrackConfig>(initialProjectEditState.audioConfig);
  const [audioEditorKey, setAudioEditorKey] = useState('audio-init');
  const [audioGenerating, setAudioGenerating] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [composition, setComposition] = useState<CompositionProject | null>(null);

  // External hooks
  const storyboard = useStoryboard();
  const { scriptText, setScriptText, saveScriptFromSegments } = useScriptStep();
  const { exportPreset, exportSettings, setExportPreset, mergeExportSettings } = useProjectExport();

  // --- Actions ---

  const handleContentLoad = useCallback((newContent: string, metadata: ScriptImportMetadata) => {
    setContent(newContent);
    setNovelMetadata(metadata);
    setStoryAnalysis(null);
    storyboard.setFrames([]);
    setAnalysisDraft('');
    setAnalysisState('idle');
    // ... reset comment/audio etc
  }, [storyboard]);

  const handleAnalyzeContent = useCallback(async () => {
    // ... same logic as before
  }, [content, project]);

  const handleAcceptAnalysis = useCallback(async () => {
    // ... same logic as before
  }, [analysisDraft, storyboard]);

  // ... all other handlers (same logic as current ProjectEditPage)

  const state: ProjectEditState = {
    content, novelMetadata, loading, storyAnalysis, analysisDraft, analysisState,
    commentDraft, versionLabel, audioConfig, audioEditorKey, audioGenerating,
    characters, composition,
  };

  // ... actions object wrapping all handlers

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <ProjectEditContext.Provider value={value}>{children}</ProjectEditContext.Provider>;
}
```

> **Note:** The full handler implementations are identical to the current `ProjectEditPage.tsx` — just moved inside the Provider. See existing file for exact logic of each handler.

- [ ] **Step 2: Refactor ProjectEditPage to use Provider**

In `ProjectEditPage.tsx`, remove all useState declarations that moved into the Provider and wrap the return with `<ProjectEditProvider>`:

```typescript
// ProjectEditPage.tsx (after refactor)
const ProjectEdit = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { project, saving, error, setError, setSaving, currentStep, setCurrentStep, updateProject } = useProject();
  const storyboard = useStoryboard();
  const [focusFrameId, setFocusFrameId] = useState<string | undefined>(undefined);
  const { exportPreset, exportSettings, mergeExportSettings } = useProjectExport(); // still needed for quality gate
  // ... loader, etc.

  // evaluationSummary and exportQualityGate stay here (passed to StepExport via props or context)

  return (
    <ProjectEditProvider navigate={navigate} project={project} updateProject={updateProject} saving={saving} setSaving={setSaving} focusFrameId={focusFrameId} setFocusFrameId={setFocusFrameId}>
      {/* error boundary, header, name/description card, CostDashboard, StepNavigation */}
      <StepNavigation currentStep={currentStep} onStepChange={setCurrentStep} />
      <StepContentSwitcher currentStep={currentStep} />
    </ProjectEditProvider>
  );
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Verify production build**

Run: `npx vite build`
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/pages/project-edit/context/ProjectEditContext.tsx src/pages/project-edit/ProjectEditPage.tsx
git commit -m "feat: wire ProjectEditProvider with state and action handlers"
```

---

### Task 5: Migrate StepImport + StepAnalysis to context selectors

**Files:**

- Modify: `src/pages/project-edit/components/StepImport.tsx`
- Modify: `src/pages/project-edit/components/StepAnalysis.tsx`
- Modify: `src/pages/project-edit/components/StepContentSwitcher.tsx`

- [ ] **Step 1: Update StepImport to use selector**

Replace props with context selector. Change from:

```typescript
export interface StepImportProps {
  content: string;
  loading: boolean;
  onContentLoad: (content: string, metadata: ScriptImportMetadata) => void;
  ...
}
```

To:

```typescript
export function StepImport() {
  const { content, loading, onLoad, onRemove, onAnalyze } = useStepImportContext();
  // ... rest of component using destructured values
}
```

- [ ] **Step 2: Update StepAnalysis to use selector**

Similar: replace all props with `useStepAnalysisContext()`.

- [ ] **Step 3: Update StepContentSwitcher case 0 and 1**

Remove passed props for Step 0 and Step 1:

```typescript
case 0: return <StepImport />;
case 1: return <StepAnalysis />;
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/project-edit/components/StepImport.tsx src/pages/project-edit/components/StepAnalysis.tsx src/pages/project-edit/components/StepContentSwitcher.tsx
git commit -m "feat: migrate StepImport and StepAnalysis to context selectors"
```

---

### Task 6: Migrate remaining steps + slim StepContentSwitcher

**Files:**

- Modify: `src/pages/project-edit/components/StepScript.tsx`
- Modify: `src/pages/project-edit/components/StepStoryboard.tsx`
- Modify: `src/pages/project-edit/components/StepCharacter.tsx`
- Modify: `src/pages/project-edit/components/StepRender.tsx`
- Modify: `src/pages/project-edit/components/StepComposition.tsx`
- Modify: `src/pages/project-edit/components/StepAudio.tsx`
- Modify: `src/pages/project-edit/components/StepExport.tsx`
- Modify: `src/pages/project-edit/components/StepContentSwitcher.tsx`

- [ ] **Step 1: Migrate StepScript**

Replace props with `useStepScriptContext()`.

- [ ] **Step 2: Migrate StepStoryboard**

Replace props with `useStepStoryboardContext()`.

- [ ] **Step 3: Migrate StepCharacter, StepRender, StepComposition**

Each uses its respective `useStep*Context()`.

- [ ] **Step 4: Migrate StepAudio**

Uses `useStepAudioContext()`.

- [ ] **Step 5: Migrate StepExport**

Uses `useStepExportContext()`. Note: `qualityGateIssues`, `qualityGatePassed`, `saving`, `projectName`, `projectId` still need to come from page-level (not in context). Pass these as direct props from Switcher:

```typescript
interface StepContentSwitcherProps {
  currentStep: number;
  projectId?: string;
  projectName: string;
  qualityGateIssues: QualityGateIssue[];
  qualityGatePassed: boolean;
  saving: boolean;
}
```

- [ ] **Step 6: Slim StepContentSwitcher to minimal props**

Replace the 53-prop interface with the 6-prop interface above. Remove all handler props and data props that are now consumed via context.

- [ ] **Step 7: Update ProjectEditPage StepContentSwitcher call**

Reduce from 53 props to 6:

```tsx
<StepContentSwitcher
  currentStep={currentStep}
  projectId={project?.id}
  projectName={name || project?.name || '未命名Project'}
  qualityGateIssues={exportQualityGate.issues}
  qualityGatePassed={exportQualityGate.passed}
  saving={saving}
/>
```

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 9: Verify production build**

Run: `npx vite build`
Expected: build succeeds

- [ ] **Step 10: Commit**

```bash
git add src/pages/project-edit/components/StepScript.tsx src/pages/project-edit/components/StepStoryboard.tsx src/pages/project-edit/components/StepCharacter.tsx src/pages/project-edit/components/StepRender.tsx src/pages/project-edit/components/StepComposition.tsx src/pages/project-edit/components/StepAudio.tsx src/pages/project-edit/components/StepExport.tsx src/pages/project-edit/components/StepContentSwitcher.tsx src/pages/project-edit/ProjectEditPage.tsx
git commit -m "feat: migrate all steps to context selectors, slim StepContentSwitcher to 6 props"
```

---

### Task 7: Final verification

**Files:**

- All modified files

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Run production build**

Run: `npx vite build`
Expected: build succeeds

- [ ] **Step 3: Count StepContentSwitcher props**

Run: `grep -A 20 "export interface StepContentSwitcherProps" src/pages/project-edit/components/StepContentSwitcher.tsx`
Expected: only `currentStep`, `projectId`, `projectName`, `qualityGateIssues`, `qualityGatePassed`, `saving` (6 props)

- [ ] **Step 4: Count ProjectEditPage useState**

Run: `grep -c "useState" src/pages/project-edit/ProjectEditPage.tsx`
Expected: 3 or fewer (name, description, focusFrameId)

- [ ] **Step 5: Commit final**

```bash
git push origin main
```

---

## Verification Gate

| Check          | Command                     | Expected |
| -------------- | --------------------------- | -------- |
| Type check     | `npx tsc --noEmit`          | 0 errors |
| Build          | `npx vite build`            | success  |
| Props count    | `StepContentSwitcherProps`  | ≤ 6      |
| useState count | `ProjectEditPage` useStates | ≤ 5      |
