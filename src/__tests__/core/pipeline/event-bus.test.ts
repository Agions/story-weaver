/**
 * Unit Tests — EventBus (事件总线消息格式)
 */

import { EventBus } from '@/infrastructure/queue/event-bus';
import { DomainEvent, StepStartedEvent, StepCompletedEvent } from '@/domain/shared/events/domain-events';

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
      bus.subscribe(StepStartedEvent.TYPE, handler);

      const event = new StepStartedEvent('test', 'script', '剧本生成');
      bus.publish(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should pass event data correctly', () => {
      const handler = jest.fn();
      bus.subscribe(StepStartedEvent.TYPE, handler);

      const event = new StepStartedEvent('test', 'script', '剧本生成');
      bus.publish(event);

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
      bus.once(StepStartedEvent.TYPE, handler);

      bus.publish(new StepStartedEvent('test', 'a', 'A'));
      bus.publish(new StepStartedEvent('test', 'b', 'B'));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================
  // unsubscribe
  // ============================================

  describe('unsubscribe', () => {
    it('should remove all listeners for a type', () => {
      const handler = jest.fn();
      bus.subscribe(StepStartedEvent.TYPE, handler);
      bus.unsubscribe(StepStartedEvent.TYPE);

      bus.publish(new StepStartedEvent('test', 'a', 'A'));
      expect(handler).not.toHaveBeenCalled();
    });

    it('should clear all listeners when called without args', () => {
      const h1 = jest.fn();
      const h2 = jest.fn();
      bus.subscribe(StepStartedEvent.TYPE, h1);
      bus.subscribe(StepCompletedEvent.TYPE, h2);
      bus.unsubscribe();

      bus.publish(new StepStartedEvent('test', 'a', 'A'));
      bus.publish(new StepCompletedEvent('test', 'a', 1000));

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

      bus.subscribe(StepStartedEvent.TYPE, badHandler);
      bus.subscribe(StepStartedEvent.TYPE, goodHandler);

      expect(() => {
        bus.publish(new StepStartedEvent('test', 'a', 'A'));
      }).not.toThrow();

      expect(goodHandler).toHaveBeenCalledTimes(1);
    });
  });
});
