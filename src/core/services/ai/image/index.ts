/**
 * AI image & video generation services: Seedream, Kling, Vidu, Seedance adapters.
 * Plus the unified `image-generation-service` facade.
 *
 * Note: re-exporting image-generation-service as the canonical entry point
 * (it re-exports all adapter internals). The `./image-generation` subdir
 * is exposed separately for advanced callers.
 */

export * from './image-generation-service';
export * from './image-generation';
