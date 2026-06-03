# 导入与分析

本指南介绍如何在 Panel Flow 项目中进行配置导入和数据分析。

## 导入功能

Panel Flow 支持从多种来源导入面板配置。

### 支持的导入格式

| 格式   | 文件扩展名  | 说明                  |
| ------ | ----------- | --------------------- |
| JSON   | .json       | 标准 JSON 格式配置    |
| YAML   | .yaml, .yml | YAML 格式配置         |
| TOML   | .toml       | TOML 格式配置         |
| Python | .py         | Python 字典或对象定义 |

### 基础导入

使用 `Importer` 类导入配置文件：

```python
from frame-fab.importing import Importer

importer = Importer()
panel = importer.load('path/to/config.json')
```

### 批量导入

支持从目录批量导入：

```python
from frame-fab.importing import BatchImporter

batch_importer = BatchImporter('./configs')
panels = batch_importer.load_all()
```

## 数据分析

### 分析器概述

Panel Flow 提供了多种分析器来检查和处理面板配置：

- **SchemaAnalyzer**：验证配置是否符合 Schema 规范
- **DependencyAnalyzer**：分析面板间的依赖关系
- **MetricsAnalyzer**：收集配置指标和统计信息
- **ConflictAnalyzer**：检测配置冲突

### 使用分析器

```python
from frame-fab.analysis import SchemaAnalyzer, DependencyAnalyzer

# 验证 Schema
schema_analyzer = SchemaAnalyzer()
result = schema_analyzer.analyze(panel)
print(f"验证结果: {result.valid}")

# 分析依赖
dep_analyzer = DependencyAnalyzer()
deps = dep_analyzer.analyze(panel)
print(f"依赖项: {deps}")
```

### 分析报告

分析完成后可以生成报告：

```python
from frame-fab.analysis import ReportGenerator

report_gen = ReportGenerator()
report = report_gen.generate(analysis_result)
report.save('analysis_report.json')
```

## 验证规则

配置验证遵循以下规则：

1. **必填字段**：确保必需字段存在
2. **类型检查**：验证字段类型正确
3. **值域检查**：确保值在允许范围内
4. **引用完整性**：检查外部引用的有效性

## 错误处理

导入和分析过程中的错误处理：

```python
from frame-fab.exceptions import ImportError, AnalysisError

try:
    panel = importer.load('config.json')
except ImportError as e:
    print(f"导入失败: {e}")
except AnalysisError as e:
    print(f"分析失败: {e}")
```

## 性能优化

处理大型配置文件时建议：

- 使用增量导入处理大文件
- 启用缓存避免重复解析
- 并行处理多个文件的分析任务

## 相关文档

- [配置文件参考](../reference/configuration.md)
- [API 参考](../api/importing.md)
- [API 参考](../api/analysis.md)
