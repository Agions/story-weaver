/**
 * Dependency Injection Container - 依赖注入容器
 * 服务层解耦，便于测试和替换实现
 */

import React, { useContext, createContext, useMemo } from 'react';

import { logger } from '@/core/utils/logger';

// Token type for DI
export const DI_TOKEN = Symbol('DI_TOKEN');

// Service registry entry
interface ServiceEntry {
  instance?: unknown;
  factory?: () => unknown;
  singleton: boolean;
}

// Token wrapper for proper typing
export class InjectionToken<T> {
  readonly __token: symbol;
  readonly __type?: T;

  constructor(name: string) {
    this.__token = Symbol(name);
  }

  toString(): string {
    return `InjectionToken(${this.__token.description})`;
  }
}

// Create a new injection token
export function createToken<T>(name: string): InjectionToken<T> {
  return new InjectionToken<T>(name);
}

/**
 * DI Container - 依赖注入容器
 * 支持：
 * - 单例模式
 * - 工厂模式
 * - 运行时依赖解析
 * - 循环依赖检测
 */
export class DIContainer {
  private services: Map<symbol, ServiceEntry> = new Map();
  private resolving: Set<symbol> = new Set();

  /**
   * 注册服务（单例）
   */
  registerSingleton<T>(token: InjectionToken<T>, instance: T): void;
  registerSingleton<T>(token: InjectionToken<T>, factory: () => T): void;
  registerSingleton<T>(
    token: InjectionToken<T>,
    factoryOrInstance: T | ((...args: unknown[]) => T)
  ): void {
    const isFactory = typeof factoryOrInstance === 'function';
    this.services.set(token.__token, {
      singleton: true,
      factory: isFactory ? (factoryOrInstance as () => T) : undefined,
      instance: isFactory ? undefined : factoryOrInstance,
    });
  }

  /**
   * 注册服务（工厂，每次返回新实例）
   */
  registerFactory<T>(token: InjectionToken<T>, factory: () => T): void {
    this.services.set(token.__token, {
      singleton: false,
      factory,
    });
  }

  /**
   * 注册实例（已存在实例）
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): void {
    this.services.set(token.__token, {
      singleton: true,
      instance,
    });
  }

  /**
   * 解析服务
   */
  resolve<T>(token: InjectionToken<T>): T {
    const entry = this.services.get(token.__token);

    if (!entry) {
      throw new Error(`Service not registered: ${token.toString()}`);
    }

    // Detect circular dependency
    if (this.resolving.has(token.__token)) {
      throw new Error(`Circular dependency detected: ${token.toString()}`);
    }

    // Return cached singleton instance
    if (entry.singleton && entry.instance) {
      return entry.instance as T;
    }

    // Create new instance
    this.resolving.add(token.__token);

    try {
      if (entry.factory) {
        const instance = (entry.factory as () => T)();
        if (entry.singleton) {
          entry.instance = instance;
        }
        return instance;
      }

      throw new Error(`No factory or instance for: ${token.toString()}`);
    } finally {
      this.resolving.delete(token.__token);
    }
  }

  /**
   * 检查服务是否已注册
   */
  has<T>(token: InjectionToken<T>): boolean {
    return this.services.has(token.__token);
  }

  /**
   * 清除所有注册
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * 获取所有已注册服务
   */
  getRegisteredTokens(): string[] {
    return Array.from(this.services.keys()).map((k) => k.description || 'anonymous');
  }
}

// Global container instance
const globalContainer = new DIContainer();

// Container singleton for app-wide use
export const container: DIContainer = globalContainer;

// ============ Pre-defined Service Tokens ============

// AI Services
export const AI_SERVICE_TOKEN = createToken<unknown>('AI_SERVICE');
export const MODEL_SERVICE_TOKEN = createToken<unknown>('MODEL_SERVICE');

// Storage Services
export const SECURE_STORAGE_TOKEN = createToken<unknown>('SECURE_STORAGE');
export const PROJECT_STORAGE_TOKEN = createToken<unknown>('PROJECT_STORAGE');

// Pipeline Services
export const PIPELINE_SERVICE_TOKEN = createToken<unknown>('PIPELINE_SERVICE');

// ============ Container Setup Helper ============

export function setupContainer(): void {
  logger.info('[DI] Setting up container with service bindings');
}

// ============ React Hooks for DI ============

const DIContext = createContext<DIContainer | null>(null);

export const DIProvider = ({
  container: providedContainer,
  children,
}: {
  container?: DIContainer;
  children: React.ReactNode;
}) => {
  const activeContainer = providedContainer || globalContainer;
  return <DIContext.Provider value={activeContainer}>{children}</DIContext.Provider>;
};

export function useContainer(): DIContainer {
  const ctx = useContext(DIContext);
  return ctx || globalContainer;
}

export function useService<T>(token: InjectionToken<T>): T {
  const containerInstance = useContainer();
  return useMemo(() => containerInstance.resolve(token), [containerInstance, token]);
}
