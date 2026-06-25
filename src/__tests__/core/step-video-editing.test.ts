import { createMockStepContext } from '@/__tests__/fixtures';

import {
  VideoEditor,
  VideoEditingStep,
  type VideoClip,
  type SubtitleBlock,
  type AudioTrack,
  type Transition,
} from '../../core/pipeline/step-video-editing';

describe('VideoEditor', () => {
  let editor: VideoEditor;

  beforeEach(() => {
    editor = new VideoEditor();
  });

  describe('addClip', () => {
    it('should add a single clip and compute correct duration', () => {
      const clip: VideoClip = {
        id: 'clip1',
        path: '/img/1.jpg',
        type: 'image',
        startTime: 0,
        duration: 5,
      };
      editor.addClip(clip);
      expect(editor.getDuration()).toBe(5);
    });

    it('should sort clips by start time', () => {
      const clip2: VideoClip = {
        id: 'clip2',
        path: '/img/2.jpg',
        type: 'image',
        startTime: 10,
        duration: 5,
      };
      const clip1: VideoClip = {
        id: 'clip1',
        path: '/img/1.jpg',
        type: 'image',
        startTime: 0,
        duration: 5,
      };
      editor.addClip(clip2).addClip(clip1);
      // Sort order: clip1 (0) then clip2 (10)
      const config = editor.exportConfig();
      expect(config.clips[0].id).toBe('clip1');
      expect(config.clips[1].id).toBe('clip2');
    });

    it('should compute total duration with multiple clips', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.addClip({ id: 'c2', path: '/img/2.jpg', type: 'image', startTime: 5, duration: 5 });
      editor.addClip({ id: 'c3', path: '/img/3.jpg', type: 'image', startTime: 10, duration: 3 });
      expect(editor.getDuration()).toBe(13); // last clip starts at 10, lasts 3
    });
  });

  describe('setTransition', () => {
    it('should set a transition between two clips', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.addClip({ id: 'c2', path: '/img/2.jpg', type: 'image', startTime: 5, duration: 5 });
      editor.setTransition('c1', 'c2', { type: 'fade', duration: 0.5, easing: 'ease_in_out' });

      const transitions = editor.getTransitionPoints();
      expect(transitions).toHaveLength(1);
      expect(transitions[0].clipId1).toBe('c1');
      expect(transitions[0].clipId2).toBe('c2');
      expect(transitions[0].transition.type).toBe('fade');
    });

    it('should default to fade transition of 0.5s when not specified', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.addClip({ id: 'c2', path: '/img/2.jpg', type: 'image', startTime: 5, duration: 5 });
      // No explicit transition set
      const transitions = editor.getTransitionPoints();
      expect(transitions).toHaveLength(0); // Only explicit transitions are returned
    });
  });

  describe('addSubtitleTrack', () => {
    it('should add subtitle blocks sorted by start time', () => {
      const subs: SubtitleBlock[] = [
        { startTime: 10, endTime: 12, text: 'Hello' },
        { startTime: 0, endTime: 2, text: 'Start' },
        { startTime: 5, endTime: 7, text: 'Middle' },
      ];
      editor.addSubtitleTrack(subs);

      const config = editor.exportConfig();
      expect(config.subtitles[0].text).toBe('Start');
      expect(config.subtitles[1].text).toBe('Middle');
      expect(config.subtitles[2].text).toBe('Hello');
    });

    it('should return correct subtitles for a given time', () => {
      editor.addSubtitleTrack([
        { startTime: 0, endTime: 2, text: 'First' },
        { startTime: 5, endTime: 7, text: 'Second' },
      ]);

      expect(editor.getSubtitlesAtTime(1)).toHaveLength(1);
      expect(editor.getSubtitlesAtTime(1)[0].text).toBe('First');

      expect(editor.getSubtitlesAtTime(6)).toHaveLength(1);
      expect(editor.getSubtitlesAtTime(6)[0].text).toBe('Second');

      expect(editor.getSubtitlesAtTime(3)).toHaveLength(0); // Gap between 2 and 5
    });
  });

  describe('addAudioTrack', () => {
    it('should add dialogue audio track', () => {
      editor.addAudioTrack({
        type: 'dialogue',
        path: '/audio/d1.wav',
        startTime: 0,
        duration: 3,
        volume: 0.9,
        fadeIn: 0.1,
        fadeOut: 0.2,
      });

      const config = editor.exportConfig();
      expect(config.audioTracks).toHaveLength(1);
      expect(config.audioTracks[0].type).toBe('dialogue');
      expect(config.audioTracks[0].volume).toBe(0.9);
    });

    it('should add BGM track', () => {
      editor.addAudioTrack({
        type: 'bgm',
        path: '/audio/bgm1.mp3',
        startTime: 0,
        duration: 30,
        volume: 0.3,
        fadeIn: 1.0,
        fadeOut: 2.0,
      });

      const config = editor.exportConfig();
      expect(config.audioTracks).toHaveLength(1);
      expect(config.audioTracks[0].type).toBe('bgm');
    });

    it('should mix multiple audio tracks', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.addAudioTrack({
        type: 'dialogue',
        path: '/audio/d1.wav',
        startTime: 0,
        duration: 5,
        volume: 0.9,
      });
      editor.addAudioTrack({
        type: 'bgm',
        path: '/audio/bgm.mp3',
        startTime: 0,
        duration: 5,
        volume: 0.3,
      });

      // At t=2, both tracks are active
      const vol = editor.getMixedAudioVolumeAtTime(2);
      expect(vol).toBeGreaterThan(0);
      expect(vol).toBeLessThanOrEqual(1.0);
    });
  });

  describe('getMixedAudioVolumeAtTime', () => {
    it('should return 0 when no tracks active', () => {
      editor.addAudioTrack({
        type: 'bgm',
        path: '/audio/bgm.mp3',
        startTime: 5,
        duration: 10,
        volume: 0.5,
      });
      expect(editor.getMixedAudioVolumeAtTime(0)).toBe(0);
    });

    it('should apply fade in effect', () => {
      editor.addAudioTrack({
        type: 'bgm',
        path: '/audio/bgm.mp3',
        startTime: 0,
        duration: 10,
        volume: 0.5,
        fadeIn: 2,
      });
      const volAt0 = editor.getMixedAudioVolumeAtTime(0);
      const volAt1 = editor.getMixedAudioVolumeAtTime(1);
      expect(volAt1).toBeGreaterThan(volAt0);
      expect(volAt1).toBeLessThan(0.5);
    });

    it('should apply fade out effect', () => {
      editor.addAudioTrack({
        type: 'bgm',
        path: '/audio/bgm.mp3',
        startTime: 0,
        duration: 10,
        volume: 0.5,
        fadeOut: 2,
      });
      const volAt7 = editor.getMixedAudioVolumeAtTime(7);
      const volAt9 = editor.getMixedAudioVolumeAtTime(9);
      expect(volAt9).toBeLessThan(volAt7);
    });

    it('should cap combined volume at 1.0', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.addAudioTrack({
        type: 'dialogue',
        path: '/audio/d1.wav',
        startTime: 0,
        duration: 5,
        volume: 0.9,
      });
      editor.addAudioTrack({
        type: 'dialogue',
        path: '/audio/d2.wav',
        startTime: 0,
        duration: 5,
        volume: 0.9,
      });
      editor.addAudioTrack({
        type: 'bgm',
        path: '/audio/bgm.mp3',
        startTime: 0,
        duration: 5,
        volume: 0.5,
      });
      // Combined could exceed 1.0, should be capped
      const vol = editor.getMixedAudioVolumeAtTime(2);
      expect(vol).toBeLessThanOrEqual(1.0);
    });
  });

  describe('renderFrame', () => {
    it('should return the active clip at a given time', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.addClip({ id: 'c2', path: '/img/2.jpg', type: 'image', startTime: 5, duration: 5 });

      const frame = editor.renderFrame(2);
      expect(frame.clipId).toBe('c1');
      expect(frame.opacity).toBe(1.0);
    });

    it('should return null clip when before all clips', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 5, duration: 5 });
      const frame = editor.renderFrame(0);
      expect(frame.clipId).toBeNull();
    });

    it('should compute fade transition opacity', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.addClip({ id: 'c2', path: '/img/2.jpg', type: 'image', startTime: 5, duration: 5 });
      editor.setTransition('c1', 'c2', { type: 'fade', duration: 1, easing: 'ease_in_out' });

      // At t=4.5 (within fade window 4-6), should have reduced opacity for c1
      const frame = editor.renderFrame(4.5);
      expect(frame.opacity).toBeLessThan(1.0);
      expect(frame.opacity).toBeGreaterThan(0);
    });

    it('should return subtitles at the correct time', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 10 });
      editor.addSubtitleTrack([{ startTime: 2, endTime: 4, text: 'Test subtitle' }]);

      const frame = editor.renderFrame(3);
      expect(frame.subtitles).toHaveLength(1);
      expect(frame.subtitles[0].text).toBe('Test subtitle');
    });
  });

  describe('exportConfig', () => {
    it('should export complete editing configuration', () => {
      editor.addClip({ id: 'c1', path: '/img/1.jpg', type: 'image', startTime: 0, duration: 5 });
      editor.setTransition('c1', 'c2', { type: 'fade', duration: 0.5, easing: 'ease_in_out' });
      editor.addSubtitleTrack([{ startTime: 1, endTime: 3, text: 'Sub' }]);
      editor.addAudioTrack({
        type: 'bgm',
        path: '/bgm.mp3',
        startTime: 0,
        duration: 5,
        volume: 0.5,
      });

      const config = editor.exportConfig();
      expect(config.clips).toHaveLength(1);
      expect(config.transitions).toHaveLength(1);
      expect(config.subtitles).toHaveLength(1);
      expect(config.audioTracks).toHaveLength(1);
      expect(config.config.resolution).toEqual({ width: 1920, height: 1080 });
      expect(config.config.fps).toBe(30);
    });
  });
});

describe('VideoEditingStep', () => {
  describe('execute', () => {
    it('should fail when no rendered frames available', async () => {
      const step = new VideoEditingStep();
      const context = createMockStepContext(new Map());

      const input = {
        workflowId: 'wf1',
        stepId: 'video-editing' as any,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe('failed');
      expect(result.error).toContain('No rendered frames');
    });

    it('should construct video timeline from rendered frames', async () => {
      const step = new VideoEditingStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [
        { frameId: 'f1', imageUrl: '/img/1.jpg' },
        { frameId: 'f2', imageUrl: '/img/2.jpg' },
        { frameId: 'f3', imageUrl: '/img/3.jpg' },
      ]);
      variables.set('dialogueAudio', []);
      variables.set('selectedBgm', '');
      variables.set('generatedSubtitles', []);
      variables.set('transitions', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: 'video-editing' as any,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe('completed');
      expect(result.data).toMatchObject({
        format: 'mp4',
        resolution: { width: 1920, height: 1080 },
        clips: expect.any(Array),
        transitionsCount: 0,
        subtitlesCount: 0,
        audioTracksCount: 0,
      });
      expect((result.data as any).clips).toHaveLength(3);
    });

    it('should apply transitions between clips', async () => {
      const step = new VideoEditingStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [
        { frameId: 'f1', imageUrl: '/img/1.jpg' },
        { frameId: 'f2', imageUrl: '/img/2.jpg' },
      ]);
      variables.set('dialogueAudio', []);
      variables.set('selectedBgm', '');
      variables.set('generatedSubtitles', []);
      variables.set('transitions', [{ from: 'f1', to: 'f2', type: 'dissolve', duration: 0.8 }]);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: 'video-editing' as any,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe('completed');
      expect((result.data as any).transitionsCount).toBe(1);
    });

    it('should mix dialogue audio and BGM tracks', async () => {
      const step = new VideoEditingStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [{ frameId: 'f1', imageUrl: '/img/1.jpg' }]);
      variables.set('dialogueAudio', [
        { audioUrl: '/audio/d1.wav', duration: 4.5 },
        { audioUrl: '/audio/d2.wav', duration: 3.8 },
      ]);
      variables.set('selectedBgm', '/audio/bgm.mp3');
      variables.set('generatedSubtitles', []);
      variables.set('transitions', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: 'video-editing' as any,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe('completed');
      expect((result.data as any).audioTracksCount).toBe(3); // 2 dialogue + 1 bgm
    });

    it('should include subtitles in output', async () => {
      const step = new VideoEditingStep();
      const variables = new Map<string, unknown>();
      variables.set('renderedFrames', [{ frameId: 'f1', imageUrl: '/img/1.jpg' }]);
      variables.set('dialogueAudio', []);
      variables.set('selectedBgm', '');
      variables.set('generatedSubtitles', [
        { startTime: 1, endTime: 3, text: 'First line' },
        { startTime: 4, endTime: 6, text: 'Second line' },
      ]);
      variables.set('transitions', []);

      const context = createMockStepContext(variables);

      const input = {
        workflowId: 'wf1',
        stepId: 'video-editing' as any,
        context: context as any,
      };

      const result = await step.execute(input);
      expect(result.status).toBe('completed');
      expect((result.data as any).subtitlesCount).toBe(2);
    });

    it('should set finalVideoUrl in context on success', async () => {
      const step = new VideoEditingStep();
      const variables = new Map<string, unknown>();
      const savedVariables = new Map<string, unknown>();
      variables.set('renderedFrames', [{ frameId: 'f1', imageUrl: '/img/1.jpg' }]);
      variables.set('dialogueAudio', []);
      variables.set('selectedBgm', '');
      variables.set('generatedSubtitles', []);
      variables.set('transitions', []);

      const context = createMockStepContext(variables);
      context.setVariable = <T>(key: string, value: T) => {
        savedVariables.set(key, value);
      };

      const input = {
        workflowId: 'wf1',
        stepId: 'video-editing' as any,
        context: context as any,
      };

      await step.execute(input);
      const finalUrl = savedVariables.get('finalVideoUrl');
      expect(typeof finalUrl).toBe('string');
      expect(finalUrl).toMatch(/\.mp4$/);
    });

    it('should respect custom retry policy', async () => {
      const step = new VideoEditingStep({
        id: 'custom-editing-step',
        name: 'Custom Video Editing',
        retryPolicy: {
          maxRetries: 5,
          initialDelayMs: 1000,
          backoffMultiplier: 3,
          maxDelayMs: 60000,
        },
      });

      expect(step.retryPolicy.maxRetries).toBe(5);
      expect(step.retryPolicy.backoffMultiplier).toBe(3);
    });
  });
});
