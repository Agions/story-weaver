import type { CharacterCard } from '../steps/step1-script-generation';

interface Props {
  character: CharacterCard;
  compact?: boolean;
}

export function CharacterCardComponent({ character, compact = false }: Props) {
  const getRelationColor = (type: string) => {
    switch (type) {
      case 'enemy':
        return 'bg-red-100 text-red-700';
      case 'romantic':
        return 'bg-pink-100 text-pink-700';
      case 'friend':
        return 'bg-green-100 text-green-700';
      case 'family':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (compact) {
    return (
      <div className="border rounded p-3">
        <p className="font-medium">{character.name}</p>
        <p className="text-xs text-gray-500">{character.personality}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-lg">{character.name}</h4>
          <p className="text-xs text-gray-500">首次出现：{character.firstAppearance}</p>
        </div>
        <span className="text-2xl">👤</span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-500">外貌：</span>
          <span>{character.appearance}</span>
        </div>
        <div>
          <span className="text-gray-500">性格：</span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
            {character.personality}
          </span>
        </div>
        <div>
          <span className="text-gray-500">说话风格：</span>
          <span>{character.speakingStyle}</span>
        </div>
        <div>
          <span className="text-gray-500">音色建议：</span>
          <span className="text-orange-600">{character.voiceSuggestion}</span>
        </div>
      </div>

      {character.relationships.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">人物关系：</p>
          <div className="flex flex-wrap gap-1">
            {character.relationships.map((rel, i) => (
              <span key={i} className={`text-xs px-2 py-0.5 rounded ${getRelationColor(rel.type)}`}>
                {rel.name}（{rel.type}）
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterCardComponent;
