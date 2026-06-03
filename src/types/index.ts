/**
 * Shim: backward compat for `@/types`.
 * Real location: `@/shared/types` for canonical types.
 *
 * Phase 3.5 fix: previously also re-exported `@/core/types/index`, but that caused
 * duplicate identifier errors (ProjectData/ProjectSettings/StoryboardFrame/VideoInfo
 * exist in both). `@/core/types` is legacy — consumers should import from
 * `@/shared/types` directly.
 */
export * from '@/shared/types';
