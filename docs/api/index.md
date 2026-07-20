# API 参考

> 核心服务接口文档

## Pipeline Service

```typescript
// 创建 Pipeline
const pipeline = createPipeline({
  workflowId: string,
  projectId?: string,
  steps: PipelineStep[],
});

// 执行
const result = await pipeline.run(input);

// 暂停/恢复/取消
pipeline.pause();
pipeline.resume();
pipeline.cancel();
```

## AI Service

```typescript
// 文本生成
const response = await aiService.generate({
  provider: 'openai',
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
});

// 流式生成
for await (const chunk of aiService.stream({...})) {
  console.log(chunk);
}
```

## 更多详见

- Pipeline Service → `@/core/pipeline/pipeline-engine.ts`
- AI Service → `@/core/services/ai/text/ai-service.ts`
- Subtitle Service → `@/core/services/video/subtitle-service.ts`
