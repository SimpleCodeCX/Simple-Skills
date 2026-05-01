---
name: thread-to-skill
description: 将一次或多次 AI 协作 thread 中的有效反馈、用户偏好、确认规则、反例和方法论去噪后沉淀为结构化知识，并判断是否合并到领域知识库、候选 skill 或正式 AI 能力包。适用于用户要求复盘 thread、整理对齐内容、维护 thread-to-skill-knowledge 知识库、或把领域文档升级成 skill 的场景。
---

# Thread to Skill

## 目标

把一次或多次 AI 协作 thread 中已经对齐、验证、修正过的经验沉淀为可追溯、可复用、可升级为 skill 的知识资产。不要保存一份聊天记录给未来的人重新理解，而是提取最终有效规则、用户偏好、反例、判断标准和可执行流程。

本 `SKILL.md` 是独立技能入口，执行时不依赖外部说明文档。

## 使用场景

使用本 skill 处理这些请求：

- 复盘当前 thread，提取有价值的对齐内容。
- 把聊天里的反馈、纠正和最终结论沉淀成 md 文档。
- 维护 `thread-to-skill-knowledge` 知识库。
- 将领域规则整理成候选 skill 或正式 `SKILL.md`。
- 清理过程噪音，只保留最终态规则。
- 为开源或团队共享做脱敏和知识分层。

不要用于一次性问题、纯事实查询、简单命令执行，或尚未形成稳定结论的临时探索。

## Skill 目录规范

正式 skill 包采用通用 Agent Skills 结构：

```text
<skill-name>/
  SKILL.md              # 必需入口，包含 frontmatter 和执行说明
  agents/openai.yaml    # 可选，仅 Codex 展示层元数据
  scripts/              # 可选，确定性或重复性操作脚本
  references/           # 可选，按需读取的长参考资料
  assets/               # 可选，输出所需模板、图片或数据
```

规则：

- 目录名和 `SKILL.md` frontmatter 的 `name` 保持一致。
- `name` 使用小写字母、数字和连字符。
- `description` 同时说明这个 skill 做什么、什么时候使用。
- Codex 和 Claude Code 默认复用同一个 `SKILL.md`。
- Codex 可以额外保留 `agents/openai.yaml`，Claude Code 可以忽略该文件。
- Cursor 适配暂不生成，除非用户明确要求。
- 不为正式 skill 创建多余的说明文档；正式 `SKILL.md` 只保留执行时真正需要的内容。

## 知识库位置

- 默认知识库位置：`<project-root>/thread-to-skill-knowledge/`。
- 如果用户指定新位置，后续执行时按用户指定的位置写入，不再要求用户重复指定。
- 如果用户要求持久保存默认位置，可以更新项目约定文档或本 skill 中的默认位置说明。
- 记录路径时优先使用相对路径；只有本地私有场景才使用绝对路径。
- 指定路径表示知识库根目录，下面直接放 `source-records/`、`review-records/`、`domains/`、`skill-candidates/`、`skills/`。

## 知识库结构

```text
thread-to-skill-knowledge/
  source-records/<source-id>/
    README.md
    evidence-summary.md
    redaction-notes.md
    attachments/
  review-records/<review-id>/
    README.md
    extracted-rules.md
    high-confidence.md
    needs-confirmation.md
    conflicts.md
  domains/<domain>/
    README.md
    <subtopic>.md
  skill-candidates/<skill-name>/
    README.md
    draft-SKILL.md
  skills/<skill-name>/
    SKILL.md
    agents/openai.yaml
```

各层职责：

- `source-records/`：脱敏来源材料。保存必要上下文、证据摘要和脱敏说明，不默认保存完整 thread。
- `review-records/`：复盘记录。保存 AI 自动初标结果、置信度分层、待确认问题和冲突项。
- `domains/`：领域知识库。只沉淀稳定规则、方法论、反例和检查清单。
- `skill-candidates/`：候选 skill 草稿区。保留待验证的方法论、反例、触发场景和草稿。
- `skills/`：正式 AI 能力包。每个 skill 一个目录，至少包含 `SKILL.md`。

## 工作流程

### 1. 判断任务类型

先判断用户要的是哪一种输出：

- **复盘 thread**：生成 `review-records/`，必要时生成 `source-records/`。
- **整理可复用规则**：做去噪、置信度分层，并输出规则清单。
- **更新知识库**：把高置信度且无冲突的稳定规则合并到 `domains/`。
- **处理冲突或低置信度内容**：写入 `needs-confirmation.md` 或 `conflicts.md`，不要直接合并。
- **生成候选 skill**：把领域方法整理到 `skill-candidates/`。
- **生成正式 skill**：产出可被 Codex 或 Claude Code 使用的 `SKILL.md`。
- **审查已有沉淀**：检查是否有过程噪音、过期规则、敏感信息或结构不一致。

执行规则：

- 每次先按用户目标选择必要阶段，不默认跑完整闭环。
- 复盘、规则整理、知识库沉淀、冲突记录是常规阶段；只要用户要求沉淀或维护知识库，就应该执行这些阶段中与目标匹配的部分。
- 候选 skill 和正式 skill 是升级阶段，只有满足成熟度条件或用户明确要求评估/生成时才执行。
- 每次沉淀时都要自动做一次正式 skill 成熟度检测，并在输出中说明结论：`暂不适合`、`适合进入候选 skill` 或 `适合生成正式 skill`。
- 如果用户只要求分析，先输出分析结论；如果用户要求落地，直接编辑对应文件。

### 2. 建立脱敏来源记录

在 `source-records/<source-id>/` 中保存脱敏后的来源材料：

- `README.md`：日期、主题、相关领域、主要产物、关联复盘位置、可公开级别。
- `evidence-summary.md`：脱敏后的关键上下文、用户确认、反例、最终结论和必要证据。
- `redaction-notes.md`：记录哪些内容被脱敏、删除、模糊化或没有保存。
- `attachments/`：只保存脱敏后的截图、日志、片段或其他附件。

脱敏规则：

- 不默认保存完整 thread 原文。
- 不保存真实用户数据、订单号、手机号、地址、邮箱、账号、内部接口、内部路径或未公开业务策略。
- 公开仓库只放示例化的脱敏来源记录。
- 真实项目来源记录默认保留在私有仓库。
- 如果短期保存完整原文，只能放在私有本地或受控私有仓库，并设置清理周期。

### 3. 生成复盘记录

在 `review-records/<review-id>/` 中保存 AI 自动初标结果：

- `README.md`：本次复盘总览、相关领域、主要结论、待处理状态。
- `extracted-rules.md`：结构化规则合集。
- `high-confidence.md`：可直接沉淀的高置信度规则。
- `needs-confirmation.md`：中低置信度、高影响项和需要人工判断的边界。
- `conflicts.md`：与已有规则或 thread 内部口径冲突的内容。

抽取内容包括：

- 用户明确偏好
- 已确认规则
- 反例 / 踩坑
- 正确做法
- 判断标准
- 可复用流程
- 检查清单
- 适用场景
- 不适用场景
- 来源记录

### 4. 做 AI 初标分层

AI 先自动去噪、分类和判断置信度，人只处理低置信度、冲突和高影响内容。

分层规则：

- **高置信度**：用户明确确认，或最终文档已经落地，可直接整理为待合并规则。
- **中置信度**：多次纠正后形成偏好，但是否通用化还需要确认。
- **低置信度**：语义不完整、上下文不足、可能只是当前项目特例。
- **冲突项**：新规则与已有领域规则不一致，或同一 thread 前后口径不一致。
- **高影响项**：会影响正式 skill、团队规范、开源内容或安全脱敏，即使把握较高也要提示人工确认。

识别信号：

- 用户明确确认：例如“好的”“就这样”“以这个为主”“补到文档里”。
- 用户明确否定：例如“不要这样写”“这个去掉”“没必要”“你理解错了”。
- 用户纠正 AI：通常对应反例、偏好或方法论。
- 用户要求补文档：通常说明该规则已经进入最终方案。
- 多次重复出现：说明可能是长期偏好。
- 最终文档状态：已落地内容优先作为最终态规则来源。

### 5. 合并领域知识

判断每条稳定规则应该进入哪个领域目录，例如：

- `domains/docs-writing/`
- `domains/code-review/`
- `domains/qa/`
- `domains/tech-solution/`
- `domains/tracking-spec-audit/`
- `domains/ai-collaboration/`

合并规则：

- 领域文档只写最终态规则，不写“之前怎么想、后来怎么改”。
- 写正向规则，避免冗余的否定提醒。
- 保留必要来源引用，方便追溯。
- 遇到冲突时，先写入 `review-records/<review-id>/conflicts.md`，不要直接覆盖已有规则。
- 不把完整 thread、敏感互动细节或一次性项目背景写入领域目录。
- `domains/<domain>/README.md` 写领域总览、核心原则、通用流程和总检查清单。
- 内容较多时，新建子主题文档承载细节、例子、反例和专题检查清单。

### 6. 自动检测是否满足正式 skill 条件

每次复盘、整理规则或更新知识库后，都要自动检测这批内容是否具备升级价值。检测不等于自动生成候选 skill 或正式 skill；除非用户已经明确要求生成，否则必须先给出检测结论并询问用户是否开始沉淀。

先判断是否适合进入候选 skill。满足以下条件时，可以从领域知识升级为候选 skill：

- 同类规则在多个 thread 或多个任务中反复出现。
- 不是一次性项目决策，而是可复用方法。
- 有明确触发场景。
- 有稳定工作流程。
- 有可执行检查清单。
- 有正例和反例。
- 能帮助 AI 工具下次少走弯路。

候选内容先进入 `skill-candidates/<skill-name>/`：

- `README.md`：目标、适用场景、成熟度、待验证问题。
- `draft-SKILL.md`：拟升级成正式 skill 的草稿。

再判断是否适合生成正式 skill。正式 skill 需要同时满足：

- 触发场景清楚，能写进 `description`。
- 工作流程已经稳定，不依赖单个项目的临时背景。
- 检查清单可执行，AI 下次可以照着完成任务。
- 关键反例和边界已经明确。
- 和已有领域规则没有未解决冲突。
- 不包含敏感信息、完整 thread 原文或一次性业务细节。
- 内容能压缩成短、稳、可执行的 `SKILL.md`。

输出检测结论时使用以下格式：

```md
## Skill 成熟度检测

- 结论：暂不适合 / 适合进入候选 skill / 适合生成正式 skill
- 检测到的领域：
- 检测到的能力：
- 建议 skill 名：
- 建议落地位置：
- 理由：
- 缺口：
- 建议下一步：
```

当结论是 `适合进入候选 skill` 或 `适合生成正式 skill` 时，先向用户确认，不要直接创建或覆盖 skill 文件。询问时要说清楚检测依据和将要写入的位置。

候选 skill 确认话术示例：

```text
我检测到 `<domain>` 领域里的 `<capability>` 能力已经具备候选 skill 价值，建议沉淀为 `<skill-name>`，落到 `skill-candidates/<skill-name>/`。
这一步会生成候选草稿，不会影响正式 skills。要开始沉淀吗？
```

正式 skill 确认话术示例：

```text
我检测到 `<domain>` 领域里的 `<capability>` 能力已经满足正式 skill 条件，建议生成正式 skill `<skill-name>`，落到 `skills/<skill-name>/SKILL.md`。
这一步会创建或更新可被 Codex / Claude Code 直接使用的技能。要开始沉淀吗？
```

如果已经存在同名候选或正式 skill，询问时还要说明将执行的是创建、补充还是覆盖式重写。默认优先补充和收敛，不做覆盖式重写。

用户确认后再执行：

- 候选 skill：写入 `skill-candidates/<skill-name>/README.md` 和 `draft-SKILL.md`。
- 正式 skill：写入 `skills/<skill-name>/SKILL.md`，按需保留 `agents/openai.yaml`。
- 如果用户拒绝或暂不确认，只把检测结论保留在本次复盘记录或最终回复中。

正式 skill 进入 `skills/<skill-name>/`：

- `SKILL.md`：必需入口，包含 frontmatter 和执行说明。
- `agents/openai.yaml`：可选，仅 Codex 展示层元数据。
- `scripts/`、`references/`、`assets/`：仅在真正需要时添加。

正式 `SKILL.md` 要短、稳、可执行，只保留触发场景、核心原则、工作流程、检查清单、输出要求和验证方式。

## 输出模板

复盘 thread 时，输出或写入以下结构：

```md
# Thread 复盘：<主题>

## 1. 基本信息

## 2. 用户明确偏好

## 3. 已确认规则

## 4. 反例 / 踩坑

## 5. 可复用方法论

## 6. AI 置信度分层

## 7. 建议合并到的领域目录

## 8. 是否适合升级成 Skill
```

冲突记录使用以下结构：

```md
## 冲突记录

| 冲突点 | 旧规则 | 新规则 | 来源 | 建议处理 |
|--------|--------|--------|------|----------|
| ... | ... | ... | ... | ... |
```

更新知识库后，向用户说明：

- 写入了哪个目录或文件。
- 新增了哪些稳定规则。
- 哪些内容需要人工确认。
- 是否发现冲突。
- 是否建议进入候选 skill 或正式 skill。

## 验证清单

完成一次沉淀后检查：

- 脱敏来源记录是否保留在 `source-records/`。
- 是否没有默认保存完整 thread 原文。
- 复盘记录是否放在 `review-records/`。
- 高置信度、中置信度、低置信度、冲突项和高影响项是否分层清楚。
- 稳定规则是否合并到 `domains/`。
- 临时过程和敏感信息是否没有进入领域文档和正式 skill。
- 冲突规则是否已标记并等待确认。
- 候选 skill 和正式 skill 是否分层清楚。
- 正式 skill 目录是否至少包含 `SKILL.md`。
- Codex skill 是否通过 `quick_validate.py` 校验。
