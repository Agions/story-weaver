/**
 * Unit Tests — EventBus (事件总线消息格式)
 */

import {
  StepStartedEvent,
  StepCompletedEvent,
} from '@/core/services/domain/shared/events/domain-events';
import { EventBus } from '@/infrastructure/queue/event-bus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  afterEach(() => {
    bus.unsubscribe();
  });

  // ============================================
  // 订阅/发布
  // ============================================

  describe('subscribe / publish', () => {
    it('should deliver events to subscribers', () => {
      const handler = jest.fn();
      // Use actual event.type, not StepStartedEvent.TYPE (which doesn't exist)
      const event = new StepStartedEvent('test', 'script', '剧本生成');
      bus.subscribe(event.type, handler);
      bus.publish(event);
      bus.flushSync();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should pass event data correctly', () => {
      const handler = jest.fn();
      const event = new StepStartedEvent('test', 'script', '剧本生成');
      bus.subscribe(event.type, handler);
      bus.publish(event);
      bus.flushSync();

      const calledEvent = handler.mock.calls[0][0] as StepStartedEvent;
      expect(calledEvent.stepId).toBe('script');
      expect(calledEvent.stepName).toBe('剧本生成');
    });
  });

  // ============================================
  // once
  // ============================================

  describe('once', () => {
    it('should only fire once', () => {
      const handler = jest.fn();
      const eventA = new StepStartedEvent('test', 'a', 'A');
      const eventB = new StepStartedEvent('test', 'b', 'B');
      bus.once(eventA.type, handler);
      bus.publish(eventA);
      bus.flushSync();
      bus.publish(eventB);
      bus.flushSync();

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // unsubscribe
  // ============================================

  describe('unsubscribe', () => {
    it('should remove all listeners for a type', () => {
      const handler = jest.fn();
      const event = new StepStartedEvent('test', 'a', 'A');
      bus.subscribe(event.type, handler);
      bus.unsubscribe(event.type);

      bus.publish(event);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should clear all listeners when called without args', () => {
      const h1 = jest.fn();
      const h2 = jest.fn();
      const eventA = new StepStartedEvent('test', 'a', 'A');
      const eventB = new StepCompletedEvent('test', 'a', 1000);
      bus.subscribe(eventA.type, h1);
      bus.subscribe(eventB.type, h2);
      bus.unsubscribe();

      bus.publish(eventA);
      bus.publish(eventB);

      expect(h1).not.toHaveBeenCalled();
      expect(h2).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Error Handling
  // ============================================

  describe('error handling', () => {
    it('should catch handler errors and not break the bus', () => {
      const goodHandler = jest.fn();
      const badHandler = jest.fn(() => {
        throw new Error('Handler failed');
      });
      const event = new StepStartedEvent('test', 'a', 'A');

      bus.subscribe(event.type, badHandler);
      bus.subscribe(event.type, goodHandler);

      expect(() => {
        bus.publish(event);
      }).not.toThrow();

      bus.flushSync();
      expect(goodHandler).toHaveBeenCalledTimes(1);
    });
  });
});
