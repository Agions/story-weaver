{
  "$schema": "https://dependency-cruiser.io/config/dependency-cruiser.config.schema.json",
  "options": {
    "doNotFollow": {
      "path": ["node_modules"],
      "dependencies": true
    },
    "tsConfig": {
      "fileName": "tsconfig.json"
    },
    "exclude": {
      "path": [
        "src/__tests__/**",
        "src/__mocks__/**",
        "src/**/__tests__/**",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.spec.ts",
        "src/**/*.spec.tsx",
        "dist/**",
        "node_modules/**",
        "src-tauri/**",
        "scripts/**"
      ]
    },
    "allowedSeverity": "info",
    "allowedOrphaned": [
      {
        "name": "react",
        "comment": "React 是框架入口，不作为 orphaned"
      }
    ]
  },

  "forbidden": [
    // ===== 禁止边：向下依赖铁律 =====
    {
      "name": "no-core-to-ui",
      "comment": "core/* 禁止导入 app/pages/components（反向依赖 UI）",
      "severity": "error",
      "from": { "path": "^src/core/", "pathNot": "^src/core/(services|pipeline|ai|domains|config|constants|data|hooks|utils)/" },
      "to": {
        "path": [
          "^src/app/",
          "^src/pages/",
          "^src/components/"
        ]
      }
    },
    {
      "name": "no-shared-to-ui-and-core",
      "comment": "shared/* 禁止导入 core/app/pages（shared 是基座）",
      "severity": "error",
      "from": { "path": "^src/shared/", "pathNot": "^src/shared/components/business/" },
      "to": {
        "path": [
          "^src/core/",
          "^src/app/",
          "^src/pages/",
          "^src/infrastructure/"
        ]
      }
    },
    {
      "name": "no-core-services-to-ui",
      "comment": "core/services/* 禁止导入 app/pages/components",
      "severity": "error",
      "from": { "path": "^src/core/services/" },
      "to": {
        "path": [
          "^src/app/",
          "^src/pages/",
          "^src/components/"
        ]
      }
    },
    {
      "name": "no-infrastructure-ai-providers",
      "comment": "infrastructure/ai/providers 已标记为死代码，禁止导入（待 P2 删除）",
      "severity": "error",
      "from": {},
      "to": { "path": "^src/infrastructure/ai/providers/" }
    },
    {
      "name": "no-import-from-general-utils",
      "comment": "禁止直接导入 shared/utils/general（已冗余，P2 删除）",
      "severity": "error",
      "from": {},
      "to": { "path": "^src/shared/utils/general" }
    },
    {
      "name": "no-features-cross-import",
      "comment": "feature 间禁止跨切片 import 私有文件（需通过 core/services 协作）",
      "severity": "error",
      "from": { "path": "^src/features/" },
      "to": {
        "path": ["^src/features/"],
        "pathNot": ["^src/features/(script-writer|storyboard|character-consistency|asset-library|tts-dubbing|video-export)/index.ts"]
      }
    }
  ],

  "detective": {
    "includeOnly": {
      "path": ["^src/"]
    }
  }
}
