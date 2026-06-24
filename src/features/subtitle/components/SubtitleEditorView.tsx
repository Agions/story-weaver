import { SubtitleEditor } from './SubtitleEditor';
import styles from './SubtitleEditorView.module.less';

/**
 * 字幕编辑视图组件
 * 组合字幕编辑功能
 */
interface SubtitleEditorViewProps {
  projectId?: string;
  videoPath?: string;
  onSave?: (subtitleData: unknown) => void;
}

function SubtitleEditorView({
  projectId: _projectId,
  videoPath: _videoPath,
  onSave: _onSave,
}: SubtitleEditorViewProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>字幕编辑</h2>
        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>编辑视频字幕和时间轴</span>
      </div>

      <SubtitleEditor subtitles={[]} onChange={() => {}} />
    </div>
  );
}

export { SubtitleEditorView };
