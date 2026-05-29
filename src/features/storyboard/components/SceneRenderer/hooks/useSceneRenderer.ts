import { useState, useCallback, useMemo } from 'react';

import { generatePrefixedId } from '@/shared/utils';

import { SCENE_TYPE_OPTIONS, ATMOSPHERE_OPTIONS } from '../constants';
import { Scene, SceneProp, SceneRendererHook, SceneRendererProps } from '../types';

export function useSceneRenderer({
  initialScenes = [],
  onChange,
  onSceneSelect,
}: SceneRendererProps): SceneRendererHook {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(
    initialScenes.length > 0 ? initialScenes[0] : null
  );

  const addScene = useCallback(() => {
    const newScene: Scene = {
      id: generatePrefixedId('scene'),
      name: `场景 ${scenes.length + 1}`,
      description: '',
      type: 'indoor',
      atmosphere: 'peaceful',
      lighting: 'natural',
      weather: 'sunny',
      backgroundDescription: '',
      props: [],
      timeOfDay: 'day',
      brightness: 50,
      saturation: 50,
      contrast: 50,
    };

    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    setSelectedScene(newScene);
    onChange?.(updatedScenes);
    onSceneSelect?.(newScene);
  }, [scenes, onChange, onSceneSelect]);

  const removeScene = useCallback(
    (id: string) => {
      const updatedScenes = scenes.filter((s) => s.id !== id);
      setScenes(updatedScenes);

      if (selectedScene?.id === id) {
        setSelectedScene(updatedScenes.length > 0 ? updatedScenes[0] : null);
        onSceneSelect?.(updatedScenes.length > 0 ? updatedScenes[0] : null);
      }
      onChange?.(updatedScenes);
    },
    [scenes, selectedScene, onChange, onSceneSelect]
  );

  const updateScene = useCallback(
    (id: string, field: keyof Scene, value: Scene[keyof Scene]) => {
      const updatedScenes = scenes.map((s) => (s.id === id ? { ...s, [field]: value } : s));
      setScenes(updatedScenes);

      if (selectedScene?.id === id) {
        const updated = updatedScenes.find((s) => s.id === id);
        setSelectedScene(updated ?? null);
        onSceneSelect?.(updated ?? null);
      }
      onChange?.(updatedScenes);
    },
    [scenes, selectedScene, onChange, onSceneSelect]
  );

  const duplicateScene = useCallback(
    (scene: Scene) => {
      const newScene: Scene = {
        ...scene,
        id: generatePrefixedId('scene'),
        name: `${scene.name} (副本)`,
      };

      const updatedScenes = [...scenes, newScene];
      setScenes(updatedScenes);
      setSelectedScene(newScene);
      onChange?.(updatedScenes);
      onSceneSelect?.(newScene);
    },
    [scenes, onChange, onSceneSelect]
  );

  const selectScene = useCallback(
    (scene: Scene) => {
      setSelectedScene(scene);
      onSceneSelect?.(scene);
    },
    [onSceneSelect]
  );

  const addProp = useCallback(
    (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      const newProp: SceneProp = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `道具 ${scene.props.length + 1}`,
        category: 'furniture',
        position: { x: 50, y: 50, z: 0 },
        scale: 1,
        rotation: 0,
      };

      updateScene(sceneId, 'props', [...scene.props, newProp]);
    },
    [scenes, updateScene]
  );

  const removeProp = useCallback(
    (sceneId: string, propId: string) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      updateScene(
        sceneId,
        'props',
        scene.props.filter((p) => p.id !== propId)
      );
    },
    [scenes, updateScene]
  );

  const updateProp = useCallback(
    (
      sceneId: string,
      propId: string,
      field: keyof SceneProp,
      value: number | string | { x: number; y: number; z: number }
    ) => {
      const scene = scenes.find((s) => s.id === sceneId);
      if (!scene) return;

      const updatedProps = scene.props.map((p) => (p.id === propId ? { ...p, [field]: value } : p));
      updateScene(sceneId, 'props', updatedProps);
    },
    [scenes, updateScene]
  );

  const getSceneTypeIcon = useCallback((type: string) => {
    const option = SCENE_TYPE_OPTIONS.find((opt) => opt.value === type);
    return option?.icon;
  }, []);

  const getAtmosphereColor = useCallback((atmosphere: string) => {
    const option = ATMOSPHERE_OPTIONS.find((opt) => opt.value === atmosphere);
    return option?.color ?? '#1890ff';
  }, []);

  return useMemo(
    () => ({
      scenes,
      selectedScene,
      addScene,
      removeScene,
      updateScene,
      duplicateScene,
      selectScene,
      addProp,
      removeProp,
      updateProp,
      getSceneTypeIcon,
      getAtmosphereColor,
    }),
    [
      scenes,
      selectedScene,
      addScene,
      removeScene,
      updateScene,
      duplicateScene,
      selectScene,
      addProp,
      removeProp,
      updateProp,
      getSceneTypeIcon,
      getAtmosphereColor,
    ]
  );
}
