/**
 * 渲染队列订阅器
 * @module core/services/project/render-queue-subscriber
 *
 * 封装原 RenderQueueService.listeners Set + subscribe / notify。
 * 工厂模式创建独立实例（与 storyboard / character 一致）。
 */

import type { RenderQueueState, StateListener } from './render-queue-types';

/**
 * 渲染队列订阅器
 */
export class RenderQueueSubscriber {
  private listeners = new Set<StateListener>();

  /**
   * 订阅状态变更
   *
   * 行为与原 `subscribe` 字节级一致：新订阅立即用当前 state 触发一次回调。
   */
  subscribe(listener: StateListener, currentState: RenderQueueState): () => void {
    this.listeners.add(listener);
    listener(currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有订阅者
   *
   * 行为与原 `updateState` 末尾的 `forEach` 一致。
   */
  notify(state: RenderQueueState): void {
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}
