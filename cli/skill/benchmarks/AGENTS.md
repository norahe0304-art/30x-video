# benchmarks/
> L2 | 父级: ../AGENTS.md

URL-to-video V2 的离线基准子树。这里定义 benchmark 清单、评估契约和说明；执行逻辑在 `../scripts/benchmark-suite.ts`，运行产物默认落到被 git 忽略的 `runs/`。

## 成员清单

- `README.md`: 基准集说明、运行契约、输出要求和评估口径。
- `manifest.json`: Canonical benchmark suite；包含 12+ URL 样本、分类、模式提示和结果字段契约。
- `runs/`: Benchmark suite 的临时输出目录；保存 project、result JSON、summary，默认不入库。

## 依赖关系

```text
manifest.json -> README.md
../scripts/benchmark-suite.ts -> manifest.json
../scripts/benchmark-suite.ts -> runs/
```

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
