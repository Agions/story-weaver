import {
  Home,
  Building,
  Star,
  Rocket,
  Car,
  Cloud,
  Coffee,
  Heart,
  Frown,
  Zap,
  Sun,
  Moon,
  Flame,
  Lightbulb,
  MapPin,
} from 'lucide-react';
import React from 'react';

export const SCENE_TYPE_OPTIONS = [
  { value: 'indoor', label: '室内', icon: <Home /> },
  { value: 'outdoor', label: '室外', icon: <Building /> },
  { value: 'fantasy', label: '幻想', icon: <Star /> },
  { value: 'future', label: '未来', icon: <Rocket /> },
  { value: 'urban', label: '城市', icon: <Car /> },
  { value: 'nature', label: '自然', icon: <Cloud /> },
  { value: 'interior', label: '内景', icon: <Coffee /> },
];

export const ATMOSPHERE_OPTIONS = [
  { value: 'warm', label: '温馨', color: '#fa8c16', icon: <Heart /> },
  { value: 'horror', label: '恐怖', color: '#000000', icon: <Frown /> },
  { value: 'romantic', label: '浪漫', color: '#eb2f96', icon: <Heart /> },
  { value: 'battle', label: '战斗', color: '#f5222d', icon: <Zap /> },
  { value: 'mysterious', label: '神秘', color: '#722ed1', icon: <Star /> },
  { value: 'peaceful', label: '平静', color: '#52c41a', icon: <Cloud /> },
  { value: 'sad', label: '悲伤', color: '#595959', icon: <Frown /> },
  { value: 'joyful', label: '欢乐', color: '#faad14', icon: <Star /> },
];

export const LIGHTING_OPTIONS = [
  { value: 'natural', label: '自然光', icon: <Sun /> },
  { value: 'artificial', label: '灯光', icon: <Lightbulb /> },
  { value: 'moonlight', label: '月光', icon: <Moon /> },
  { value: 'firelight', label: '火光', icon: <Flame /> },
  { value: 'neon', label: '霓虹', icon: <Zap /> },
  { value: 'candlelight', label: '烛光', icon: <Flame /> },
  { value: 'flash', label: '闪光', icon: <Zap /> },
  { value: 'shadow', label: '阴影', icon: <Cloud /> },
];

export const WEATHER_OPTIONS = [
  { value: 'sunny', label: '晴天' },
  { value: 'cloudy', label: '多云' },
  { value: 'rainy', label: '雨天' },
  { value: 'snowy', label: '雪天' },
  { value: 'foggy', label: '雾天' },
  { value: 'stormy', label: '暴风雨' },
  { value: 'night', label: '夜晚' },
  { value: 'dawn', label: '黎明' },
  { value: 'dusk', label: '黄昏' },
];

export const PROP_CATEGORIES = [
  { value: 'furniture', label: '家具' },
  { value: 'electronics', label: '电子产品' },
  { value: 'decoration', label: '装饰品' },
  { value: 'clothing', label: '服装' },
  { value: 'vehicle', label: '交通工具' },
  { value: 'weapon', label: '武器' },
  { value: 'tool', label: '工具' },
  { value: 'food', label: '食物' },
  { value: 'plant', label: '植物' },
  { value: 'animal', label: '动物' },
  { value: 'other', label: '其他' },
];

export const TIME_OF_DAY_OPTIONS = [
  { value: 'dawn', label: '黎明' },
  { value: 'day', label: '白天' },
  { value: 'dusk', label: '黄昏' },
  { value: 'night', label: '夜晚' },
];

export const Paragraph: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = (props) => (
  <p className="text-sm" {...props}>
    {props.children}
  </p>
);

export { MapPin };
