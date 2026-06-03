/**
 * EventBus — 轻量事件总线
 * 服务间通信改为异步事件驱动，支持订阅/发布/once/cross-tab广播
 */

import { logger } from '@/core/utils/logger';
import type { DomainEvent } from '@/domain/shared/events/domain-events';

interface Subscription {
  handler: (event: DomainEvent) => void | Promise<void>;
  once: boolean;
}

/**
 * IEventBus — 事件总线接口
 */
export interface IEventBus {
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): () => void;
  once<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): () => void;
  publish<T extends DomainEvent>(event: T): void;
  unsubscribe(eventType?: string): void;
}

/**
 * EventBus — 轻量事件总线实现
 */
export class EventBus implements IEventBus {
  private subscriptions = new Map<string, Subscription[]>();
  private queue: DomainEvent[] = [];
  private processing = false;
  private flushing = false; // test sync flush mode
  private crossTabChannel: BroadcastChannel | null = null;

  constructor() {
    // Try to enable cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.crossTabChannel = new BroadcastChannel('frame-fab-events');
        this.crossTabChannel.onmessage = (msg) => {
          const event = msg.data as DomainEvent;
          this.handleCrossTabEvent(event);
        };
      } catch {
        logger.warn('[EventBus] BroadcastChannel not available, cross-tab disabled');
      }
    }
  }

  /**
   * 订阅事件 — 返回取消订阅函数
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): () => void {
    const subs = this.subscriptions.get(eventType) ?? [];
    const sub: Subscription = {
      handler: handler as (event: DomainEvent) => void | Promise<void>,
      once: false,
    };
    subs.push(sub);
    this.subscriptions.set(eventType, subs);

    return () => {
      const current = this.subscriptions.get(eventType) ?? [];
      this.subscriptions.set(
        eventType,
        current.filter((s) => s.handler !== handler)
      );
    };
  }

  /**
   * 订阅一次性事件
   */
  once<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => void | Promise<void>
  ): () => void {
    const subs = this.subscriptions.get(eventType) ?? [];
    const sub: Subscription = {
      handler: handler as (event: DomainEvent) => void | Promise<void>,
      once: true,
    };
    subs.push(sub);
    this.subscriptions.set(eventType, subs);

    return () => {
      const current = this.subscriptions.get(eventType) ?? [];
      this.subscriptions.set(
        eventType,
        current.filter((s) => s.handler !== handler)
      );
    };
  }

  /**
   * 发布事件 — 异步处理，不阻塞
   */
  publish<T extends DomainEvent>(event: T): void {
    this.queue.push(event);
    if (!this.processing && !this.flushing) {
      this.processQueue();
    }
    this.broadcastCrossTab(event);
  }

  /**
   * 等待队列完全处理完毕（用于测试）
   */
  drained(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.processing && this.queue.length === 0) {
        resolve();
        return;
      }
      const check = () => {
        if (!this.processing && this.queue.length === 0) {
          resolve();
        } else {
          setTimeout(check, 0);
        }
      };
      setTimeout(check, 0);
    });
  }

  /**
   * 同步刷新队列（用于测试）— 直接派发队列中所有事件
   */
  flushSync(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      const subs = this.subscriptions.get(event.type) ?? [];
      for (const sub of subs) {
        try {
          sub.handler(event);
        } catch (err) {
          logger.error(`[EventBus] Handler error for ${event.type}:`, err);
        }
      }
    }
  }

  /**
   * 清除指定事件的订阅
   */
  unsubscribe(eventType?: string): void {
    if (eventType) {
      this.subscriptions.delete(eventType);
    } else {
      this.subscriptions.clear();
    }
  }

  /**
   * 获取当前订阅数量（用于测试/调试）
   */
  getSubscriptionCount(eventType?: string): number {
    if (eventType) {
      return this.subscriptions.get(eventType)?.length ?? 0;
    }
    let total = 0;
    for (const subs of this.subscriptions.values()) {
      total += subs.length;
    }
    return total;
  }

  // ========== Private Methods ==========

  private async processQueue(): Promise<void> {
    this.processing = true;
    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      try {
        await this.dispatch(event);
      } catch (err) {
        logger.error(`[EventBus] Error dispatching ${event.type}:`, err);
      }
    }
    this.processing = false;
  }

  private async dispatch(event: DomainEvent): Promise<void> {
    const subs = this.subscriptions.get(event.type) ?? [];
    const onceSubs: Subscription[] = [];

    for (const sub of subs) {
      try {
        const result = sub.handler(event);
        if (result instanceof Promise) {
          await result;
        }
        if (sub.once) onceSubs.push(sub);
      } catch (err) {
        logger.error(`[EventBus] Handler error for ${event.type}:`, err);
      }
    }

    // Remove once handlers
    for (const once of onceSubs) {
      const idx = subs.indexOf(once);
      if (idx >= 0) subs.splice(idx, 1);
    }

    // Emit wildcard listeners (*)
    const wildcardSubs = this.subscriptions.get('*') ?? [];
    for (const sub of wildcardSubs) {
      try {
        await sub.handler(event);
      } catch (err) {
        logger.error(`[EventBus] Wildcard handler error:`, err);
      }
    }
  }

  private broadcastCrossTab(event: DomainEvent): void {
    try {
      this.crossTabChannel?.postMessage(event);
    } catch {
      // Ignore broadcast errors
    }
  }

  private handleCrossTabEvent(event: DomainEvent): void {
    // Re-dispatch cross-tab events locally to maintain consistency
    const subs = this.subscriptions.get(event.type) ?? [];
    for (const sub of subs) {
      try {
        const result = sub.handler(event);
        if (result instanceof Promise) {
          result.catch((err) => logger.error(`[EventBus] Cross-tab handler error:`, err));
        }
      } catch {
        // Ignore handler errors from cross-tab
      }
    }
  }

  dispose(): void {
    this.crossTabChannel?.close();
    this.subscriptions.clear();
    this.queue = [];
  }
}

// Global singleton
export const eventBus = new EventBus();
export default eventBus;
