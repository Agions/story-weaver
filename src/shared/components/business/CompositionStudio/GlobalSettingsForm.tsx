/**
 * 合成全局设置表单组件
 *
 * form refactor 2026-06-04: 原 <Form>/<FormItem> 桥接被移除。
 * 该组件原本就只是表单骨架的占位实现 (Slider/InputNumber/Select 都未绑
 * value/onChange 双向绑定)，改成原生受控 state 即可，无功能损失。
 */

import React, { useState } from 'react';

import { SelectItem } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Divider, InputNumber, Row, Col, Select } from '@/components/ui/ui-components';
import type { TransitionConfig, TransitionEffect } from '@/shared/types';

interface GlobalSettingsFormProps {
  initialValues: {
    frameDuration: number;
    defaultTransition: TransitionConfig;
    transitions?: TransitionConfig[];
  };
  onSave: (values: {
    frameDuration: number;
    defaultTransition: { effect: TransitionEffect; duration: number; easing?: string };
    transitions?: TransitionConfig[];
  }) => void;
}

const TRANSITION_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'crossfade', label: '交叉淡化' },
  { value: 'dissolve', label: '溶解' },
  { value: 'wipe-left', label: '左擦除' },
  { value: 'wipe-right', label: '右擦除' },
  { value: 'wipe-up', label: '上擦除' },
  { value: 'wipe-down', label: '下擦除' },
  { value: 'slide-left', label: '左滑入' },
  { value: 'slide-right', label: '右滑入' },
  { value: 'zoom', label: '缩放过渡' },
  { value: 'blur', label: '模糊过渡' },
];

function GlobalSettingsForm({ initialValues, onSave }: GlobalSettingsFormProps) {
  const [frameDuration, setFrameDuration] = useState<number>(initialValues.frameDuration);
  const [effect, setEffect] = useState<TransitionEffect>(initialValues.defaultTransition.effect);
  const [transitionDuration, setTransitionDuration] = useState<number>(
    initialValues.defaultTransition.duration
  );
  const [easing, setEasing] = useState<string | undefined>(initialValues.defaultTransition.easing);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      frameDuration,
      defaultTransition: { effect, duration: transitionDuration, easing },
      transitions: initialValues.transitions,
    });
  };

  return (
    <form onSubmit={handleSave}>
      <label className="block text-sm font-medium mb-1">默认帧时长 (秒)</label>
      <Slider
        min={1}
        max={10}
        step={0.5}
        value={frameDuration}
        onChange={(v) => setFrameDuration(v as number)}
      />

      <Divider orientation="left">默认转场</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">转场效果</label>
          <Select value={effect} onChange={(v) => setEffect(v as TransitionEffect)}>
            {TRANSITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">转场时长 (秒)</label>
          <InputNumber
            min={0.1}
            max={5}
            step={0.1}
            style={{ width: '100%' }}
            value={transitionDuration}
            onChange={(v) => setTransitionDuration(v as number)}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <label className="block text-sm font-medium mb-1">缓动函数</label>
          <Select value={easing} onChange={(v) => setEasing(v as string)}>
            <SelectItem value="linear">线性</SelectItem>
            <SelectItem value="ease-in">渐快</SelectItem>
            <SelectItem value="ease-out">渐慢</SelectItem>
            <SelectItem value="ease-in-out">先慢后快再慢</SelectItem>
          </Select>
        </Col>
      </Row>

      <Divider orientation="left">逐段转场配置（可选）</Divider>
      {/* 预留：分镜间转场配置，暂无 UI 需求 */}
      <div />
    </form>
  );
}

export default GlobalSettingsForm;
