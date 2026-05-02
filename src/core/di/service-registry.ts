/**
 * Service Registry - 服务注册中心
 * 统一管理所有服务实例，实现单例模式和依赖注入
 */

import { logger } from '@/core/utils/logger';

// 服务接口
export interface Service {
  initialize?(): Promise<void>;
  destroy?(): void;
}

// 服务注册表
class ServiceRegistry {
  private services = new Map<string, Service>();
  private initialized = false;

  register<T extends Service>(name: string, service: T): T {
    if (this.services.has(name)) {
      logger.warn(`Service ${name} already registered, skipping...`);
      return this.services.get(name) as T;
    }
    this.services.set(name, service);
    logger.info(`Service registered: ${name}`);
    return service;
  }

  get<T extends Service>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  async initializeAll(): Promise<void> {
    if (this.initialized) return;

    const initPromises: Promise<void>[] = [];
    for (const [name, service] of this.services) {
      if (service.initialize) {
        initPromises.push(
          service.initialize().catch(err => {
            logger.error(`Failed to initialize service ${name}:`, err);
          })
        );
      }
    }

    await Promise.all(initPromises);
    this.initialized = true;
    logger.info('All services initialized');
  }

  destroyAll(): void {
    for (const [name, service] of this.services) {
      if (service.destroy) {
        try {
          service.destroy();
          logger.info(`Service destroyed: ${name}`);
        } catch (err) {
          logger.error(`Error destroying service ${name}:`, err);
        }
      }
    }
    this.services.clear();
    this.initialized = false;
  }
}

// 全局单例
export const serviceRegistry = new ServiceRegistry();

// 装饰器：自动注册服务
export function AutoRegister(name?: string) {
  return function <T extends new (...args: unknown[]) => Service>(constructor: T) {
    const serviceName = name || constructor.name;
    return class extends constructor {
      constructor(...args: unknown[]) {
        super(...args);
        serviceRegistry.register(serviceName, this);
      }
    };
  };
}
