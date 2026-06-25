/**
 * Test Fixtures 标准化桶 (v3.0)
 *
 * 集中导出所有测试 fixture / mock 工厂, 避免测试文件 inline 重复定义.
 * 各域 fixture 文件按职责拆分, 此 barrel 统一入口.
 *
 * 命名约定:
 * - createMockXxx   返回实体对象的工厂 (支持 overrides 覆盖)
 * - mockXxxService  返回带 jest.fn() 的 service mock
 * - setupXxx        副作用型 mock (修改 global.window 等)
 *
 * @example
 * import { createMockScene, createMockStepContext } from '@/__tests__/fixtures';
 */

// ============ 通用测试工具 (Provider/Storage/Observer) ============
// 来源: src/__tests__/utils/test-utils.tsx (v2.x 已存在, 重新导出集中入口)
export {
  createWrapper,
  renderWithProviders,
  mockApiResponse,
  mockApiError,
  createMockFn,
  wait,
  createMockFile,
  createLocalStorageMock,
  mockIntersectionObserver,
  mockResizeObserver,
  mockTauriApi,
  clearAllMocks,
} from '../utils/test-utils';

// ============ Pipeline Step Context ============
// 来源: src/__tests__/utils/mock-context.ts (v2.x 已存在但 0 消费者,
// v3.0 fixtures 标准化时让 9 个 step-*.test.ts 真正引用)
export { createMockStepContext } from '../utils/mock-context';
