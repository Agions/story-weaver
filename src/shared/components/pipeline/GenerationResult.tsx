import { GradeBadge } from './GradeBadge';

export interface ScenePreview {
  id: string;
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  emotion: string;
  content: string;
  cameraHint?: string;
  type?: string;
  transition?: string;
}

export interface CharacterPreview {
  id: string;
  name: string;
  personality: string;
  speakingStyle?: string;
}

export interface MetadataStats {
  chaptersCount?: number;
  eventsCount?: number;
  charactersCount?: number;
  scenesCount?: number;
  coverage?: number;
}

export interface GenerationResultProps {
  title?: string;
  grade: string;
  evaluationScore?: number;
  metadata?: MetadataStats;
  scenes?: ScenePreview[];
  characters?: CharacterPreview[];
  maxScenesToShow?: number;
}

const emotionColors: Record<string, string> = {
  happy: 'text-green-500',
  sad: 'text-blue-500',
  tense: 'text-orange-500',
  angry: 'text-red-500',
  neutral: 'text-gray-500',
};

export function GenerationResult({
  title,
  grade,
  evaluationScore,
  metadata = {},
  scenes = [],
  characters = [],
  maxScenesToShow = 5,
}: GenerationResultProps) {
  const visibleScenes = scenes.slice(0, maxScenesToShow);
  const remainingCount = scenes.length - maxScenesToShow;

  return (
    <div className="space-y-6">
      {/* Title */}
      {title && (
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
      )}

      {/* Stats Grid */}
      {Object.keys(metadata).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">📊 生成统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {metadata.chaptersCount !== undefined && (
              <StatItem label="章节" value={metadata.chaptersCount} />
            )}
            {metadata.eventsCount !== undefined && (
              <StatItem label="事件" value={metadata.eventsCount} />
            )}
            {metadata.charactersCount !== undefined && (
              <StatItem label="角色" value={metadata.charactersCount} />
            )}
            {metadata.scenesCount !== undefined && (
              <StatItem label="场景" value={metadata.scenesCount} />
            )}
            {metadata.coverage !== undefined && (
              <StatItem label="覆盖率" value={`${(metadata.coverage * 100).toFixed(0)}%`} />
            )}
          </div>
        </div>
      )}

      {/* Evaluation Score */}
      {(grade || evaluationScore !== undefined) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">⭐ 质量评分</h3>
          <div className="flex items-center gap-6">
            <GradeBadge grade={grade} score={evaluationScore} size="lg" />
            {evaluationScore !== undefined && (
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>综合评分</span>
                  <span className="font-medium">{evaluationScore}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      evaluationScore >= 80
                        ? 'bg-green-500'
                        : evaluationScore >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${evaluationScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenes Preview */}
      {visibleScenes.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">🎬 剧本预览</h3>
          <div className="space-y-3">
            {visibleScenes.map((scene) => (
              <div key={scene.id} className="border-b pb-3 last:border-b-0">
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                  <span>场景 {scene.sceneNumber}</span>
                  <span>•</span>
                  <span>{scene.location}</span>
                  <span>•</span>
                  <span>{scene.timeOfDay}</span>
                  {scene.emotion && (
                    <>
                      <span>•</span>
                      <span className={emotionColors[scene.emotion] || emotionColors.neutral}>
                        {scene.emotion}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm">
                  {scene.content.slice(0, 120)}
                  {scene.content.length > 120 ? '...' : ''}
                </p>
                {(scene.cameraHint || scene.type || scene.transition) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {scene.cameraHint && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                        {scene.cameraHint}
                      </span>
                    )}
                    {scene.type && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">{scene.type}</span>
                    )}
                    {scene.transition && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                        {scene.transition}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {remainingCount > 0 && (
              <p className="text-sm text-gray-500 text-center">还有 {remainingCount} 个场景...</p>
            )}
          </div>
        </div>
      )}

      {/* Characters */}
      {characters.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-3">👥 角色列表</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {characters.map((char) => (
              <div key={char.id} className="border rounded p-3">
                <p className="font-medium">{char.name}</p>
                <p className="text-xs text-gray-500">{char.personality}</p>
                {char.speakingStyle && (
                  <p className="text-xs text-gray-400 mt-1">{char.speakingStyle}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <span className="text-gray-500">{label}</span>
    <p className="text-lg font-medium">{value}</p>
  </div>
);
