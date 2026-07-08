/**
 * VideoEditorPage — 视频编辑器页面（Presenter 层）
 *
 * 职责：
 * - 调用 useVideoEditor 获取所有状态和操作
 * - 渲染 UI 布局
 * - 组合子渲染函数
 *
 * 原始 714 行 → 拆分后 <250 行
 */
import { useParams } from 'react-router-dom';

import { Card } from '@/shared/components/ui/card';
import { Row, Col } from '@/shared/components/ui/grid';
import { Tabs, TabPane } from '@/shared/components/ui/tabs';
import { Title } from '@/shared/components/ui/typography';

import { useVideoEditor } from './hooks/useVideoEditor';
import styles from './VideoEditorPage.module.less';
import { renderVideoPlayer, renderTimeline } from './VideoEditorPage.player';
import { renderSegmentList, renderKeyframeList } from './VideoEditorPage.segments';
import { renderToolbar, ExportProgressModal, renderSettingsPanel } from './VideoEditorPage.toolbar';

const VideoEditor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const state = useVideoEditor(projectId);

  const {
    videoSrc,
    currentTime,
    duration,
    segments,
    keyframes,
    selectedSegmentIndex,
    isExporting,
    exportProgress,
    exportStatus,
    outputFormat,
    videoQuality,
    videoRef,
    handleTimeUpdate,
    handleVideoLoaded,
    setOutputFormat,
    setVideoQuality,
    togglePlayPause,
  } = state;

  return (
    <div className={styles.editorLayout}>
      <div className={styles.editorContent}>
        <ExportProgressModal
          isExporting={isExporting}
          exportProgress={exportProgress}
          exportStatus={exportStatus}
          outputFormat={outputFormat}
          videoQuality={videoQuality}
        />

        {renderToolbar(state)}

        <Row gutter={[24, 24]}>
          {/* 视频预览区 */}
          <Col span={16}>
            <Card className={styles.playerCard} title="视频预览">
              {renderVideoPlayer(
                videoSrc,
                videoRef,
                handleTimeUpdate,
                handleVideoLoaded,
                togglePlayPause,
                state
              )}
            </Card>
            {renderTimeline(
              segments,
              selectedSegmentIndex,
              currentTime,
              duration,
              state.handleSelectSegment
            )}
          </Col>

          {/* 右侧工具面板 */}
          <Col span={8}>
            <Tabs defaultActiveKey="trim" className={styles.editorTabs}>
              <TabPane tab="片段" key="trim">
                {renderSegmentList(state)}
              </TabPane>

              <TabPane tab="关键帧" key="keyframes">
                <div className={styles.keyframesContainer}>
                  <Title level={5} className={styles.sectionTitle}>
                    关键帧
                  </Title>
                  {renderKeyframeList(keyframes)}
                </div>
              </TabPane>

              <TabPane tab="效果" key="effects">
                <div className={styles.effectsPanel}>
                  <Title level={5} className={styles.sectionTitle}>
                    视频效果
                  </Title>
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                    此功能正在开发中
                  </p>
                </div>
              </TabPane>

              <TabPane tab="设置" key="settings">
                {renderSettingsPanel(outputFormat, videoQuality, setVideoQuality, setOutputFormat)}
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default VideoEditor;
