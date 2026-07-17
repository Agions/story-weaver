/**
 * Pipeline facade for the core project hooks.
 *
 * Re-exports the reducer-backed `useProject` and its state machine so that
 * pipeline step code can depend on a single module instead of reaching into
 * `src/core/hooks/` directly. No logic lives here.
 */

export { useProject, type UseProjectReturn } from '@/core/hooks/useProject';

export {
  projectReducer,
  initialProjectState,
  createProjectSetters,
  type ProjectState,
  type ProjectAction,
  type ProjectSetters,
} from '@/core/hooks/useProject-reducer';
