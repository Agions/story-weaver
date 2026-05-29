import React from 'react';

import { SceneEditor } from './components/SceneEditor';
import { SceneList } from './components/SceneList';
import { ScenePreview } from './components/ScenePreview';
import { useSceneRenderer } from './hooks/useSceneRenderer';
import styles from './SceneRenderer.module.less';
import { SceneRendererProps } from './types';

function SceneRenderer({ initialScenes = [], onChange, onSceneSelect }: SceneRendererProps) {
  const {
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
  } = useSceneRenderer({ initialScenes, onChange, onSceneSelect });

  return (
    <div className={styles.container}>
      <SceneList
        scenes={scenes}
        selectedScene={selectedScene}
        onSelectScene={selectScene}
        onAddScene={addScene}
        onRemoveScene={removeScene}
        onDuplicateScene={duplicateScene}
        getSceneTypeIcon={getSceneTypeIcon}
        getAtmosphereColor={getAtmosphereColor}
      />

      <ScenePreview scene={selectedScene} onUpdateScene={updateScene} onRemoveProp={removeProp} />

      <SceneEditor
        scene={selectedScene}
        onUpdateScene={updateScene}
        onAddProp={addProp}
        onRemoveProp={removeProp}
        onUpdateProp={updateProp}
      />
    </div>
  );
}

export default SceneRenderer;
