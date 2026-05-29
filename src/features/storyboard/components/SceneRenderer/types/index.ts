export interface SceneProp {
  id: string;
  name: string;
  category: string;
  position: { x: number; y: number; z: number };
  scale: number;
  rotation: number;
  color?: string;
}

export type ScenePropValue = number | string | { x: number; y: number; z: number };

export interface Scene {
  id: string;
  name: string;
  description: string;
  type: string;
  atmosphere: string;
  lighting: string;
  weather: string;
  backgroundDescription: string;
  props: SceneProp[];
  timeOfDay: string;
  brightness: number;
  saturation: number;
  contrast: number;
  imageUrl?: string;
}

export interface SceneRendererProps {
  initialScenes?: Scene[];
  onChange?: (scenes: Scene[]) => void;
  onSceneSelect?: (scene: Scene | null) => void;
}

export interface SceneRendererHook {
  scenes: Scene[];
  selectedScene: Scene | null;
  addScene: () => void;
  removeScene: (id: string) => void;
  updateScene: (id: string, field: keyof Scene, value: Scene[keyof Scene]) => void;
  duplicateScene: (scene: Scene) => void;
  selectScene: (scene: Scene) => void;
  addProp: (sceneId: string) => void;
  removeProp: (sceneId: string, propId: string) => void;
  updateProp: (
    sceneId: string,
    propId: string,
    field: keyof SceneProp,
    value: ScenePropValue
  ) => void;
  getSceneTypeIcon: (type: string) => React.ReactNode;
  getAtmosphereColor: (atmosphere: string) => string;
}
