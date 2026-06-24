import AudioEditor from './AudioEditor';
import styles from './AudioEditorView.module.less';

/**
 * 音频编辑视图组件
 * 组合音频编辑功能
 */
interface AudioEditorViewProps {
  projectId?: string;
  onSave?: (config: unknown) => void;
}

function AudioEditorView({ projectId, onSave }: AudioEditorViewProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>音频编辑</h2>
        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>配置背景音乐、音效和配音</span>
      </div>

      <AudioEditor projectId={projectId} onSave={onSave} />
    </div>
  );
}

export default AudioEditorView;
