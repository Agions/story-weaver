/**
 * 资产服务
 * 统一的素材资产管理
 */

import { logger } from '@/core/utils/logger';

export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  src: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  tags: string[];
  createdAt: string;
  projectId?: string;
}

// 存储键名
const ASSET_STORAGE_KEY = 'panelcraft_assets';

class AssetService {
  private cache: Map<string, Asset> = new Map();

  /**
   * 从存储加载资产
   */
  private loadFromStorage(): Asset[] {
    try {
      const data = localStorage.getItem(ASSET_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      logger.error('Failed to load assets from storage');
      return [];
    }
  }

  /**
   * 保存资产到存储
   */
  private saveToStorage(assets: Asset[]): void {
    try {
      localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
    } catch (e) {
      logger.error('Failed to save assets to storage', e);
    }
  }

  /**
   * 获取所有资产
   */
  getAll(projectId?: string): Asset[] {
    const assets = this.loadFromStorage();
    if (projectId) {
      return assets.filter(a => a.projectId === projectId);
    }
    return assets;
  }

  /**
   * 按ID获取资产
   */
  getById(id: string): Asset | null {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    const assets = this.loadFromStorage();
    const asset = assets.find(a => a.id === id) || null;
    if (asset) {
      this.cache.set(id, asset);
    }
    return asset;
  }

  /**
   * 添加资产
   */
  add(asset: Omit<Asset, 'id' | 'createdAt'>): Asset {
    const newAsset: Asset = {
      ...asset,
      id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    const assets = this.loadFromStorage();
    assets.push(newAsset);
    this.saveToStorage(assets);
    this.cache.set(newAsset.id, newAsset);
    
    logger.info('Asset added', newAsset.name);
    return newAsset;
  }

  /**
   * 批量添加资产
   */
  addMany(newAssets: Omit<Asset, 'id' | 'createdAt'>[]): Asset[] {
    const assets = this.loadFromStorage();
    const created: Asset[] = [];

    for (const asset of newAssets) {
      const newAsset: Asset = {
        ...asset,
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString()
      };
      assets.push(newAsset);
      this.cache.set(newAsset.id, newAsset);
      created.push(newAsset);
    }

    this.saveToStorage(assets);
    logger.info(`${created.length} assets added`);
    return created;
  }

  /**
   * 更新资产
   */
  update(id: string, updates: Partial<Asset>): Asset | null {
    const assets = this.loadFromStorage();
    const index = assets.findIndex(a => a.id === id);
    
    if (index < 0) return null;

    assets[index] = { ...assets[index], ...updates };
    this.saveToStorage(assets);
    this.cache.set(id, assets[index]);
    
    return assets[index];
  }

  /**
   * 删除资产
   */
  delete(id: string): boolean {
    const assets = this.loadFromStorage();
    const filtered = assets.filter(a => a.id !== id);
    
    if (filtered.length === assets.length) return false;
    
    this.saveToStorage(filtered);
    this.cache.delete(id);
    logger.info('Asset deleted', id);
    return true;
  }

  /**
   * 搜索资产
   */
  search(query: string, type?: Asset['type']): Asset[] {
    const assets = this.loadFromStorage();
    const lowerQuery = query.toLowerCase();

    return assets.filter(a => {
      if (type && a.type !== type) return false;
      return (
        a.name.toLowerCase().includes(lowerQuery) ||
        a.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * 按类型获取资产
   */
  getByType(type: Asset['type'], projectId?: string): Asset[] {
    const assets = this.loadFromStorage();
    return assets.filter(a => {
      if (a.type !== type) return false;
      if (projectId && a.projectId !== projectId) return false;
      return true;
    });
  }

  /**
   * 获取资产统计
   */
  getStats(): { total: number; byType: Record<Asset['type'], number> } {
    const assets = this.loadFromStorage();
    const byType: Record<Asset['type'], number> = {
      video: 0,
      audio: 0,
      image: 0,
      text: 0
    };

    for (const asset of assets) {
      byType[asset.type]++;
    }

    return { total: assets.length, byType };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const assetService = new AssetService();
