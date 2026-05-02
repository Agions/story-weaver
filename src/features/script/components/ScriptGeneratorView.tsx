import React, { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Space } from '@/components/ui/ui-components';

import NovelImporter from './NovelImporter';
import ScriptGenerator from './ScriptGenerator';
import styles from './ScriptGeneratorView.module.less';

/**
 * 脚本生成视图组件
 * 组合 NovelImporter 和 ScriptGenerator
 */
const ScriptGeneratorView: React.FC = () => {
  const [novelMetadata, setNovelMetadata] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNovelImport = (metadata: any) => {
    setNovelMetadata(metadata);
  };

  const _handleGenerationStart = () => {
    setIsGenerating(true);
  };

  const _handleGenerationComplete = () => {
    setIsGenerating(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>脚本生成</h2>
        <p>从小说导入并生成视频脚本</p>
      </div>

      <Space direction="vertical" size="large" className={styles.content}>
        <Card title="导入小说">
          <NovelImporter onContentLoad={(content, metadata) => handleNovelImport(metadata)} />
        </Card>

        {novelMetadata && (
          <Card title="生成脚本">
            {isGenerating && <Alert>正在生成脚本...</Alert>}
            <ScriptGenerator
              projectId={undefined}
              onGenerate={undefined}
              onSave={undefined}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ScriptGeneratorView;