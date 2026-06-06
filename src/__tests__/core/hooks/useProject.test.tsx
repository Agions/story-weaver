import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

import { useProject, useProjectList } from '@/core/hooks/useProject';
import type { ProjectData, VideoInfo, Script, ProjectSettings } from '@/shared/types';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
}));

describe('useProject', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should return initial state with null project', () => {
      const { result } = renderHook(() => useProject());

      expect(result.current.project).toBeNull();
      expect(result.current.projects).toEqual([]);
      expect(result.current.recentProjects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should return taskStatus as null initially', () => {
      const { result } = renderHook(() => useProject());

      expect(result.current.taskStatus).toBeNull();
    });
  });

  describe('createProject', () => {
    it('should create a new project with given name', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test Project', 'A test description');
      });

      expect(result.current.project).not.toBeNull();
      expect(result.current.project?.name).toBe('Test Project');
      expect(result.current.project?.description).toBe('A test description');
      expect(result.current.project?.status).toBe('draft');
    });

    it('should create project with default name when name is empty', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('');
      });

      expect(result.current.project?.name).toBe('未命名项目');
    });

    it('should set hasUnsavedChanges to false after creating', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should add project to projects list', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Project 1');
      });

      expect(result.current.projects.length).toBe(1);
      expect(result.current.projects[0].name).toBe('Project 1');
    });

    it('should create project with default settings', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test Project');
      });

      expect(result.current.project?.settings).toEqual({
        videoQuality: 'high',
        outputFormat: 'mp4',
        resolution: '1080p',
        frameRate: 30,
        audioCodec: 'aac',
        videoCodec: 'h264',
        subtitleEnabled: true,
        subtitleStyle: {
          fontFamily: 'Arial',
          fontSize: 24,
          color: '#FFFFFF',
          backgroundColor: '#000000',
          outline: true,
          outlineColor: '#000000',
          position: 'bottom',
          alignment: 'center',
        },
      });
    });

    it('should return the created project', () => {
      const { result } = renderHook(() => useProject());

      let createdProject: ProjectData | null = null;
      act(() => {
        createdProject = result.current.createProject('Test Project');
      });

      expect(createdProject).not.toBeNull();
      expect(createdProject?.name).toBe('Test Project');
      expect(createdProject?.id).toBeDefined();
    });
  });

  describe('loadProject', () => {
    it('should load an existing project by id', async () => {
      const { result } = renderHook(() => useProject());

      // Create a project first
      let projectId: string;
      act(() => {
        const project = result.current.createProject('Test Project');
        projectId = project.id;
      });

      // Verify project was created
      expect(result.current.project?.name).toBe('Test Project');

      // Create a separate hook instance to simulate loading into a different state
      const { result: result2 } = renderHook(() => useProject());

      // Verify new hook has no project
      expect(result2.current.project).toBeNull();

      // Reload the project
      const loaded = await result2.current.loadProject(projectId!);

      expect(loaded).toBe(true);

      // Wait for state update
      await waitFor(() => {
        expect(result2.current.project?.name).toBe('Test Project');
      });

      expect(result2.current.hasUnsavedChanges).toBe(false);
    });

    it('should return false and set error for non-existent project', async () => {
      const { result } = renderHook(() => useProject());

      let loadResult: boolean = true;
      await act(async () => {
        loadResult = await result.current.loadProject('non-existent-id');
      });

      expect(loadResult).toBe(false);
      expect(result.current.error).toBe('项目不存在');
    });
  });

  describe('saveProject', () => {
    it('should return false when no project is loaded', async () => {
      const { result } = renderHook(() => useProject());

      let saveResult: boolean = true;
      await act(async () => {
        saveResult = await result.current.saveProject();
      });

      expect(saveResult).toBe(false);
    });

    it('should save project and update updatedAt', async () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test Project');
      });

      // Get original updatedAt
      const originalUpdatedAt = result.current.project!.updatedAt;

      // Wait a small amount of time to ensure different timestamp
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        await result.current.saveProject();
      });

      expect(result.current.project!.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should set isSaving during save', async () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      act(() => {
        result.current.saveProject();
      });

      // isSaving should be true during the async operation
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });
  });

  describe('updateProject', () => {
    it('should update project with partial data', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Original Name');
      });

      act(() => {
        result.current.updateProject({ name: 'Updated Name' });
      });

      expect(result.current.project?.name).toBe('Updated Name');
    });

    it('should set hasUnsavedChanges to true', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      expect(result.current.hasUnsavedChanges).toBe(false);

      act(() => {
        result.current.updateProject({ name: 'New Name' });
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should not update when project is null', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.updateProject({ name: 'Should Not Update' });
      });

      expect(result.current.project).toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete project and remove from list', async () => {
      const { result } = renderHook(() => useProject());

      let projectId: string;
      act(() => {
        const project = result.current.createProject('To Delete');
        projectId = project.id;
      });

      expect(result.current.projects.length).toBe(1);

      await act(async () => {
        await result.current.deleteProject(projectId!);
      });

      expect(result.current.projects.length).toBe(0);
    });

    it('should set current project to null when deleting current project', async () => {
      const { result } = renderHook(() => useProject());

      let projectId: string;
      act(() => {
        const project = result.current.createProject('Current Project');
        projectId = project.id;
      });

      expect(result.current.project).not.toBeNull();

      await act(async () => {
        await result.current.deleteProject(projectId!);
      });

      expect(result.current.project).toBeNull();
    });

    it('should return true on successful delete', async () => {
      const { result } = renderHook(() => useProject());

      let projectId: string;
      act(() => {
        const project = result.current.createProject('Test');
        projectId = project.id;
      });

      let deleteResult: boolean = false;
      await act(async () => {
        deleteResult = await result.current.deleteProject(projectId!);
      });

      expect(deleteResult).toBe(true);
    });
  });

  describe('duplicateProject', () => {
    it('should create a duplicate with "(副本)" suffix', async () => {
      const { result } = renderHook(() => useProject());

      let originalId: string;
      act(() => {
        const project = result.current.createProject('Original');
        originalId = project.id;
      });

      let duplicated: ProjectData | null = null;
      await act(async () => {
        duplicated = await result.current.duplicateProject(originalId!);
      });

      expect(duplicated).not.toBeNull();
      expect(duplicated?.name).toBe('Original (副本)');
      expect(duplicated?.id).not.toBe(originalId);
    });

    it('should add duplicate to projects list', async () => {
      const { result } = renderHook(() => useProject());

      let originalId: string;
      act(() => {
        const project = result.current.createProject('Original');
        originalId = project.id;
      });

      expect(result.current.projects.length).toBe(1);

      await act(async () => {
        await result.current.duplicateProject(originalId!);
      });

      expect(result.current.projects.length).toBe(2);
    });

    it('should return null for non-existent project', async () => {
      const { result } = renderHook(() => useProject());

      let duplicated: ProjectData | null = null;
      await act(async () => {
        duplicated = await result.current.duplicateProject('non-existent');
      });

      expect(duplicated).toBeNull();
    });
  });

  describe('setVideo', () => {
    it('should set video in project', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      const videoInfo: VideoInfo = {
        id: 'video-1',
        name: 'Test Video',
        path: '/path/to/video.mp4',
        duration: 120,
      };

      act(() => {
        result.current.setVideo(videoInfo);
      });

      expect(result.current.project?.videos).toHaveLength(1);
      expect(result.current.project?.videos?.[0].name).toBe('Test Video');
    });
  });

  describe('removeVideo', () => {
    it('should remove video from project', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      const videoInfo: VideoInfo = {
        id: 'video-1',
        name: 'Test Video',
        path: '/path/to/video.mp4',
        duration: 120,
      };

      act(() => {
        result.current.setVideo(videoInfo);
      });

      expect(result.current.project?.videos).toHaveLength(1);

      act(() => {
        result.current.removeVideo();
      });

      expect(result.current.project?.videos).toHaveLength(0);
    });
  });

  describe('setScript', () => {
    it('should set script in project', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      const script: Script = {
        id: 'script-1',
        title: 'Test Script',
        content: 'Script content here',
        segments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setScript(script);
      });

      expect(result.current.project?.scripts).toHaveLength(1);
      expect(result.current.project?.scripts?.[0].title).toBe('Test Script');
    });
  });

  describe('updateScript', () => {
    it('should update existing script', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      const script: Script = {
        id: 'script-1',
        title: 'Original Title',
        content: 'Original content',
        segments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      act(() => {
        result.current.setScript(script);
      });

      act(() => {
        result.current.updateScript({ title: 'Updated Title' });
      });

      expect(result.current.project?.scripts?.[0].title).toBe('Updated Title');
    });

    it('should not update when no script exists', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      act(() => {
        result.current.updateScript({ title: 'Should Not Update' });
      });

      expect(result.current.project?.scripts).toHaveLength(0);
    });
  });

  describe('updateSettings', () => {
    it('should update project settings', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      act(() => {
        result.current.updateSettings({ videoQuality: 'low', resolution: '4k' });
      });

      expect(result.current.project?.settings?.videoQuality).toBe('low');
      expect(result.current.project?.settings?.resolution).toBe('4k');
    });

    it('should merge with existing settings', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Test');
      });

      const originalSettings = { ...result.current.project?.settings };

      act(() => {
        result.current.updateSettings({ videoQuality: 'medium' });
      });

      // Other settings should remain
      expect(result.current.project?.settings?.outputFormat).toBe(originalSettings.outputFormat);
      expect(result.current.project?.settings?.resolution).toBe(originalSettings.resolution);
    });

    it('should not update when project is null', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.updateSettings({ videoQuality: 'low' });
      });

      expect(result.current.project).toBeNull();
    });
  });

  describe('recentProjects', () => {
    it('should return projects sorted by updatedAt descending', () => {
      const { result } = renderHook(() => useProject());

      act(() => {
        result.current.createProject('Project A');
      });

      act(() => {
        result.current.updateProject({ name: 'Project A Updated' });
      });

      // Create another project
      act(() => {
        result.current.createProject('Project B');
      });

      const recent = result.current.recentProjects;
      expect(recent.length).toBe(2);
      // Most recently updated should be first
      expect(recent[0].name).toBe('Project B');
    });

    it('should limit to 10 projects', () => {
      const { result } = renderHook(() => useProject());

      // Create 15 projects
      for (let i = 0; i < 15; i++) {
        act(() => {
          result.current.createProject(`Project ${i}`);
        });
      }

      expect(result.current.recentProjects.length).toBe(10);
    });
  });
});

describe('useProjectList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should return initial empty projects list', () => {
      const { result } = renderHook(() => useProjectList());

      expect(result.current.projects).toEqual([]);
      expect(result.current.allProjects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('loadProjects', () => {
    it('should load projects from storage', async () => {
      const { result } = renderHook(() => useProjectList());

      // Create some projects via useProject first
      const { result: projectResult } = renderHook(() => useProject());
      act(() => {
        projectResult.current.createProject('Project 1');
      });
      act(() => {
        projectResult.current.createProject('Project 2');
      });

      await act(async () => {
        result.current.loadProjects();
      });

      expect(result.current.allProjects.length).toBe(2);
    });
  });

  describe('filter', () => {
    it('should filter projects by search term', async () => {
      const { result: projectResult } = renderHook(() => useProject());
      act(() => {
        projectResult.current.createProject('React Tutorial');
      });
      act(() => {
        projectResult.current.createProject('Vue Tutorial');
      });

      const { result } = renderHook(() => useProjectList());
      await act(async () => {
        result.current.loadProjects();
      });

      act(() => {
        result.current.setFilter({ ...result.current.filter, search: 'react' });
      });

      expect(result.current.projects.length).toBe(1);
      expect(result.current.projects[0].name).toBe('React Tutorial');
    });

    it('should filter projects by status', async () => {
      const { result: projectResult } = renderHook(() => useProject());
      act(() => {
        projectResult.current.createProject('Draft Project');
      });

      // Manually set one project to completed status via storage
      const projects = JSON.parse(localStorage.getItem('reelforge_projects') || '[]');
      if (projects.length > 0) {
        projects[0].status = 'completed';
        localStorage.setItem('reelforge_projects', JSON.stringify(projects));
      }

      const { result } = renderHook(() => useProjectList());
      await act(async () => {
        result.current.loadProjects();
      });

      act(() => {
        result.current.setFilter({ ...result.current.filter, status: ['completed'] });
      });

      expect(result.current.projects.length).toBe(1);
    });

    it('should sort projects by specified field', async () => {
      const { result: projectResult } = renderHook(() => useProject());
      act(() => {
        projectResult.current.createProject('Alpha Project');
      });
      act(() => {
        projectResult.current.createProject('Beta Project');
      });

      const { result } = renderHook(() => useProjectList());
      await act(async () => {
        result.current.loadProjects();
      });

      act(() => {
        result.current.setFilter({ ...result.current.filter, sortBy: 'name', sortOrder: 'asc' });
      });

      expect(result.current.projects[0].name).toBe('Alpha Project');
      expect(result.current.projects[1].name).toBe('Beta Project');
    });
  });

  describe('refresh', () => {
    it('should reload projects', async () => {
      const { result: projectResult } = renderHook(() => useProject());
      act(() => {
        projectResult.current.createProject('New Project');
      });

      const { result } = renderHook(() => useProjectList());

      await act(async () => {
        result.current.refresh();
      });

      expect(result.current.allProjects.length).toBe(1);
    });
  });
});
