/**
 * MixPanel - 混音设置面板
 * 从 AudioEditor 中提取，专注渲染混音音量配置
 */

import { Headphones, Music, Volume2 } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';
import { Row, Col } from '@/components/ui/grid';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';

interface MixPanelProps {
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
  masterVolume: number;
  voiceTracksCount: number;
  hasBackgroundMusic: boolean;
  soundEffectsCount: number;
  disabled: boolean;
  onVoiceVolumeChange: (v: number) => void;
  onMusicVolumeChange: (v: number) => void;
  onEffectVolumeChange: (v: number) => void;
  onMasterVolumeChange: (v: number) => void;
}

export default function MixPanel({
  voiceVolume,
  musicVolume,
  effectVolume,
  masterVolume,
  voiceTracksCount,
  hasBackgroundMusic,
  soundEffectsCount,
  disabled,
  onVoiceVolumeChange,
  onMusicVolumeChange,
  onEffectVolumeChange,
  onMasterVolumeChange,
}: MixPanelProps) {
  return (
    <>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="mixCard" size="small">
            <div className="mixTitle">
              <Headphones /> 配音音量
            </div>
            <Progress percent={voiceVolume} status="active" />
            <Slider
              min={0}
              max={100}
              value={voiceVolume}
              onChange={onVoiceVolumeChange}
              disabled={disabled}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="mixCard" size="small">
            <div className="mixTitle">
              <Music /> 音乐音量
            </div>
            <Progress percent={musicVolume} status="active" />
            <Slider
              min={0}
              max={100}
              value={musicVolume}
              onChange={onMusicVolumeChange}
              disabled={disabled}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="mixCard" size="small">
            <div className="mixTitle">
              <Volume2 /> 音效音量
            </div>
            <Progress percent={effectVolume} status="active" />
            <Slider
              min={0}
              max={100}
              value={effectVolume}
              onChange={onEffectVolumeChange}
              disabled={disabled}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="mixCard" size="small">
            <div className="mixTitle">
              <span className="masterIcon">M</span> 主音量
            </div>
            <Progress percent={masterVolume} status="active" />
            <Slider
              min={0}
              max={100}
              value={masterVolume}
              onChange={onMasterVolumeChange}
              disabled={disabled}
            />
          </Card>
        </Col>
      </Row>

      <Card className="summaryCard" size="small" title="音频轨道概览">
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={8}>
            <div className="summaryItem">
              <Headphones /> 配音轨道: <strong>{voiceTracksCount}</strong>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="summaryItem">
              <Music /> 背景音乐: <strong>{hasBackgroundMusic ? '1' : '0'}</strong>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="summaryItem">
              <Volume2 /> 音效: <strong>{soundEffectsCount}</strong>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
}
