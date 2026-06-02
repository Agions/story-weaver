/**
 * AI domain services — text and image sub-modules.
 *
 * Public API:
 *   - ./text/   AI text services (script, novel, story analysis, prompt helper)
 *   - ./image/  AI image & video generation services
 *   - ./base-ai-service.ts  Shared base class for AI service implementations
 */

export * as text from './text';
export * as image from './image';
export * from './base-ai-service';
