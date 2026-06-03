import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Collapse } from '@/components/ui/collapse';
import { Popconfirm } from '@/components/ui/popconfirm';
import { Divider } from '@/components/ui/divider';
import { Empty } from '@/components/ui/empty';
import { Row, Col } from '@/components/ui/grid';
import { Input } from '@/components/ui/input';
import { AntDSelect } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Space } from '@/components/ui/space';
import { Tag } from '@/components/ui/tag';
import { TextArea } from '@/components/ui/textarea';
import { Text, Title } from '@/components/ui/typography';

import {
  SCENE_TYPE_OPTIONS,
  ATMOSPHERE_OPTIONS,
  LIGHTING_OPTIONS,
  WEATHER_OPTIONS,
  PROP_CATEGORIES,
  TIME_OF_DAY_OPTIONS,
} from '../constants';
import styles from '../SceneRenderer.module.less';
import { Scene, SceneProp, ScenePropValue } from '../types';

interface SceneEditorProps {
  scene: Scene | null;
  onUpdateScene: (id: string, field: keyof Scene, value: Scene[keyof Scene]) => void;
  onAddProp: (sceneId: string) => void;
  onRemoveProp: (sceneId: string, propId: string) => void;
  onUpdateProp: (
    sceneId: string,
    propId: string,
    field: keyof SceneProp,
    value: ScenePropValue
  ) => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({
  scene,
  onUpdateScene,
  onAddProp,
  onRemoveProp,
  onUpdateProp,
}) => {
  if (!scene) {
    return (
      <div className={styles.editor}>
        <div className={styles.emptyEditor}>
          <Empty image={undefined} description="请选择场景进行编辑" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <Title level={5}>场景属性</Title>
      </div>

      <div className={styles.editorContent}>
        <div className={styles.formSection}>
          <span className={styles.sectionTitle}>基本信息</span>

          <div className={styles.formGroup}>
            <Text type="secondary">场景名称</Text>
            <Input
              value={scene.name}
              onChange={(e) => onUpdateScene(scene.id, 'name', e.target.value)}
              placeholder="请输入场景名称"
            />
          </div>

          <div className={styles.formGroup}>
            <Text type="secondary">场景描述</Text>
            <TextArea
              value={scene.description}
              onChange={(e) => onUpdateScene(scene.id, 'description', e.target.value)}
              placeholder="请输入场景描述"
              rows={3}
            />
          </div>
        </div>

        <Divider />

        <div className={styles.formSection}>
          <span className={styles.sectionTitle}>场景类型</span>

          <div className={styles.formGroup}>
            <Text type="secondary">类型</Text>
            <AntDSelect
              value={scene.type}
              onChange={(value) => onUpdateScene(scene.id, 'type', value as string)}
              style={{ width: '100%' }}
              options={SCENE_TYPE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: (
                  <Space>
                    {opt.icon}
                    {opt.label}
                  </Space>
                ),
              }))}
            />
          </div>

          <div className={styles.formGroup}>
            <Text type="secondary">氛围</Text>
            <AntDSelect
              value={scene.atmosphere}
              onChange={(value) => onUpdateScene(scene.id, 'atmosphere', value as string)}
              style={{ width: '100%' }}
              options={ATMOSPHERE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: (
                  <Space>
                    <Tag color={opt.color}>{opt.icon}</Tag>
                    {opt.label}
                  </Space>
                ),
              }))}
            />
          </div>

          <div className={styles.formGroup}>
            <Text type="secondary">光照</Text>
            <AntDSelect
              value={scene.lighting}
              onChange={(value) => onUpdateScene(scene.id, 'lighting', value as string)}
              style={{ width: '100%' }}
              options={LIGHTING_OPTIONS.map((opt) => ({
                value: opt.value,
                label: (
                  <Space>
                    {opt.icon}
                    {opt.label}
                  </Space>
                ),
              }))}
            />
          </div>

          <div className={styles.formGroup}>
            <Text type="secondary">天气</Text>
            <AntDSelect
              value={scene.weather}
              onChange={(value) => onUpdateScene(scene.id, 'weather', value as string)}
              style={{ width: '100%' }}
              options={WEATHER_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>

          <div className={styles.formGroup}>
            <Text type="secondary">时段</Text>
            <AntDSelect
              value={scene.timeOfDay}
              onChange={(value) => onUpdateScene(scene.id, 'timeOfDay', value as string)}
              style={{ width: '100%' }}
              options={TIME_OF_DAY_OPTIONS}
            />
          </div>
        </div>

        <Divider />

        <div className={styles.formSection}>
          <span className={styles.sectionTitle}>背景描述</span>

          <div className={styles.formGroup}>
            <Text type="secondary">背景描述（用于AI生成）</Text>
            <TextArea
              value={scene.backgroundDescription}
              onChange={(e) => onUpdateScene(scene.id, 'backgroundDescription', e.target.value)}
              placeholder="详细描述场景的背景环境..."
              rows={4}
            />
          </div>
        </div>

        <Divider />

        <div className={styles.formSection}>
          <span className={styles.sectionTitle}>道具管理</span>

          <Button
            type="dashed"
            icon={<Plus />}
            onClick={() => onAddProp(scene.id)}
            block
            style={{ marginBottom: 12 }}
          >
            添加道具
          </Button>

          <Collapse
            ghost
            items={scene.props.map((prop) => ({
              key: prop.id,
              label: (
                <div className={styles.propCollapseHeader}>
                  <Text>{prop.name}</Text>
                  <Popconfirm
                    title="确定删除此道具?"
                    onConfirm={() => onRemoveProp(scene.id, prop.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Trash2
                      style={{ color: '#ff4d4f', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              ),
              children: (
                <div className={styles.propEditor}>
                  <div className={styles.formGroup}>
                    <Text type="secondary">道具名称</Text>
                    <Input
                      value={prop.name}
                      onChange={(e) => onUpdateProp(scene.id, prop.id, 'name', e.target.value)}
                      placeholder="道具名称"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <Text type="secondary">道具类型</Text>
                    <AntDSelect
                      value={prop.category}
                      onChange={(value) =>
                        onUpdateProp(scene.id, prop.id, 'category', value as string)
                      }
                      style={{ width: '100%' }}
                      options={PROP_CATEGORIES.map((c) => ({
                        value: c.value,
                        label: c.label,
                      }))}
                    />
                  </div>

                  <Row gutter={8}>
                    <Col span={8}>
                      <div className={styles.formGroup}>
                        <Text type="secondary">X</Text>
                        <Slider
                          value={prop.position.x}
                          onChange={(value) =>
                            onUpdateProp(scene.id, prop.id, 'position', {
                              ...prop.position,
                              x: value,
                            })
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className={styles.formGroup}>
                        <Text type="secondary">Y</Text>
                        <Slider
                          value={prop.position.y}
                          onChange={(value) =>
                            onUpdateProp(scene.id, prop.id, 'position', {
                              ...prop.position,
                              y: value,
                            })
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className={styles.formGroup}>
                        <Text type="secondary">Z</Text>
                        <Slider
                          value={prop.position.z}
                          onChange={(value) =>
                            onUpdateProp(scene.id, prop.id, 'position', {
                              ...prop.position,
                              z: value,
                            })
                          }
                          min={-10}
                          max={10}
                        />
                      </div>
                    </Col>
                  </Row>

                  <Row gutter={8}>
                    <Col span={12}>
                      <div className={styles.formGroup}>
                        <Text type="secondary">缩放</Text>
                        <Slider
                          value={prop.scale}
                          onChange={(value) => onUpdateProp(scene.id, prop.id, 'scale', value)}
                          min={0.1}
                          max={3}
                          step={0.1}
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className={styles.formGroup}>
                        <Text type="secondary">旋转</Text>
                        <Slider
                          value={prop.rotation}
                          onChange={(value) => onUpdateProp(scene.id, prop.id, 'rotation', value)}
                          min={-180}
                          max={180}
                        />
                      </div>
                    </Col>
                  </Row>
                </div>
              ),
            }))}
          />
        </div>
      </div>
    </div>
  );
};
