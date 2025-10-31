# Cursor Autopilot — 产品设计概念

> **一句话**：让远程控制 Cursor 像本地操作一样可靠、智能、可编程。  
> **野心**：成为 Cursor 生态的 Zapier/GitHub Actions —— 把零散的远程操作变成可复用的自动化流程。

---

## 一、核心洞察

### 1.1 现有工具的致命缺陷

市面上的"远程控制 Cursor"工具本质上都是**文本转发器** + **键盘模拟器**：

```
用户输入 → Telegram Bot → 粘贴到输入框 → 模拟按键 Ctrl+Enter
```

问题：
- ❌ **不可靠**：网络抖一下就丢消息，按键失败了也不知道
- ❌ **无上下文**：无法表达"用审查模式看这段代码" "附带当前文件"
- ❌ **无沉淀**：团队的"代码审查流程" "测试驱动开发流程"无法固化
- ❌ **不智能**：只会盲目模拟键盘，不知道 Cursor 有哪些内部 API

### 1.2 本质问题

**远程控制的本质不是"发文本"，而是"传递意图 + 执行动作 + 回传结果"。**

当你在手机上回复 "继续" 时，你真正想要的是：
1. Cursor **确认收到**这个指令（Ack）
2. 以**当前的工作模式**（如"简洁回答模式"）继续对话
3. 如果失败了，自动**重试或回滚**
4. 完成后**告诉我结果**（改了哪些文件、测试通过了吗）

这才是"远程控制"应有的体验。

---

## 二、产品定位

### 2.1 不是什么

- ❌ 不是又一个 Telegram 机器人
- ❌ 不是简单的键盘模拟工具
- ❌ 不是单人使用的个人玩具

### 2.2 是什么

✅ **Cursor 的远程意图执行引擎**

把"远程指令"升级为"结构化意图"：

```yaml
意图:
  动作: 继续对话
  模式: 代码审查（严格、安全优先）
  上下文: 当前文件的 diff
  期望: 执行成功 + 回传审查意见摘要
```

✅ **可编程的工作流编排平台**

像 GitHub Actions 一样，把团队的工作流固化成 YAML：

```yaml
# .autopilot/playbooks/code-review.yml
触发: /review
步骤:
  1. 获取当前 diff
  2. 新建对话："你是资深审查员，请审查以下改动"
  3. 粘贴 diff
  4. 提交并等待回复
  5. 回传审查结果到 Slack
```

✅ **Cursor 社区的基础设施**

- 就像 VS Code 有 Extension Marketplace
- Cursor 应该有 Playbook Library —— 团队分享最佳实践

---

## 三、核心能力

### 3.1 意图系统 —— 让远程控制"懂你"

**问题**：现在发 "继续" 就是发 "继续" 两个字，AI 不知道你的背景。

**方案**：引入"模式/风格"系统

```
/style reviewer  → 切换到"代码审查模式"
/style zh        → 切换到"中文详细模式"
/style tests     → 切换到"测试驱动模式"
```

之后每次回复，都会自动附带当前模式的提示词：

```
[代码审查模式: 关注安全、命名、测试]

用户输入: 继续
```

**价值**：
- 一次设置，持续生效
- 团队可以共享模式定义
- 从"发文本"升级到"发结构化意图"

### 3.2 Playbooks —— 把操作变成资产

**问题**：每次做代码审查都要重复：新建对话 → 粘贴 diff → 提交 → 等回复 → 记录结果

**方案**：YAML 编排

```yaml
# review-pr.yml
name: PR 代码审查
triggers:
  - command: /review
  - schedule: "每次 PR 提交后"

steps:
  - action: git-diff
    save_as: $diff
  
  - action: new-chat
    mode: reviewer
  
  - action: send-prompt
    text: "请审查以下改动：\n$diff"
  
  - action: wait-reply
    timeout: 2min
  
  - action: report
    to: slack
    format: "审查完成：{summary}"

guards:
  - confirm: false  # 不需要人工确认
  - max_diff_size: 1000 lines
```

**价值**：
- 可复用：团队共享 Playbook
- 可组合：小步骤组合成大流程
- 可审计：每次执行都有日志

### 3.3 能力优先矩阵 —— 智能执行路径

**问题**：现在所有工具都用键盘模拟，成功率低、速度慢、不可靠

**方案**：分层执行策略

```
优先级 1: Cursor 内部 API
  → composer.submitComposerPrompt()
  → cursor.chat.send()

优先级 2: VS Code 键绑定
  → executeCommand('cursor.sendKeyBinding', 'ctrl+enter')

优先级 3: nut-js 键盘层
  → keyboard.type(Key.LeftControl, Key.Enter)

优先级 4: OS 脚本兜底
  → AppleScript / xdotool / PowerShell
```

**启动时自动检测**：
- 探测哪些 API 可用
- 选择最优路径
- 失败自动降级

**价值**：
- 95%+ 成功率（现在可能只有 60%）
- 快 10 倍（API 调用 vs 键盘模拟）
- 跨平台一致

### 3.4 确定性执行 —— 企业级可靠性

**问题**：现在发消息像扔石头进海里，不知道是否生效

**方案**：消息队列语义

```
每条消息:
  - ID: uuid (去重)
  - Sequence: 单调递增 (有序执行)
  - Ack: 确认收到
  - Done: 确认完成
  - Evidence: 执行证据（变更文件、测试结果）
```

**执行保证**：
- 恰好一次：ID 去重，不重复执行
- 严格有序：Sequence 排序，不乱序
- 自动重试：失败后指数退避重试
- 可回滚：失败自动撤销（editor.undo）

**价值**：
- 从"尽力而为"到"确定性交付"
- 可用于生产环境（不只是 hobby）
- 可审计、可追溯

### 3.5 多渠道适配器 —— 统一中枢

**问题**：现在每个工具只支持一个渠道（Telegram 或 Slack）

**方案**：适配器插件系统

```typescript
interface Adapter {
  send(summary: Summary): Promise<void>;
  onReply(handler: (intent: Intent) => void): void;
  dispose(): void;
}
```

**内置适配器**：
- Telegram：个人移动控制
- Slack：团队协作
- Webhook：CI/CD 集成
- Email：异步通知
- HTTP API：自定义集成

**价值**：
- 一套代码，多端接入
- 团队可以用 Slack，个人可以用 Telegram
- DevOps 可以用 Webhook 触发（如测试失败自动修复）

---

## 四、差异化竞争策略

### 4.1 与其他工具的对比

| 维度 | 其他工具 | Autopilot |
|------|---------|-----------|
| **可靠性** | 键盘模拟，失败率 40% | 能力矩阵 + 重试，成功率 95%+ |
| **智能性** | 纯文本转发 | 意图系统（模式/上下文） |
| **可编程** | 无 | Playbooks YAML 编排 |
| **可沉淀** | 个人使用 | 团队共享流程 |
| **可扩展** | 单渠道 | 多适配器 + SDK |
| **可审计** | 无日志 | 完整证据链 |

### 4.2 护城河

1. **Playbooks 生态**
   - 类似 GitHub Actions Marketplace
   - 团队分享最佳实践
   - 形成网络效应

2. **深度 Cursor 集成**
   - 内部 API 优先
   - 随 Cursor 更新迭代
   - 其他工具无法模仿

3. **企业级可靠性**
   - 确定性执行语义
   - 适合生产环境
   - 从 hobby 到 professional

### 4.3 目标用户

- **独立开发者**：移动端快速控制，风格切换
- **小团队**：Playbook 固化代码审查、测试流程
- **企业**：CI/CD 集成、审计日志、权限控制
- **Cursor 社区**：贡献 Playbook、适配器，形成生态

---

## 五、实现策略

### 5.1 MVP（2 周）

**目标**：证明核心价值 —— 可靠 + 智能

- [x] nut-js 自动发送（已完成）
- [ ] 风格系统：/style + 5 个预设
- [ ] 能力探测：检测 Cursor API，优先使用
- [ ] Ack/Done：每条消息有反馈
- [ ] 状态栏：实时健康指示

**验证**：成功率从 60% → 95%，用户感知到"可靠"

### 5.2 Playbooks（3-4 周）

**目标**：从"工具"到"平台"

- [ ] YAML 解析器
- [ ] 3 类步骤：command、paste、submit
- [ ] 证据回传：变更文件清单
- [ ] 2 个示例 Playbook：code-review、new-feature

**验证**：团队开始贡献自己的 Playbook

### 5.3 生态（持续）

**目标**：成为 Cursor 社区标准

- [ ] Marketplace 发布
- [ ] 适配器 SDK
- [ ] Playbook Library（GitHub repo）
- [ ] 文档 + 教程
- [ ] 社区贡献指南

**目标**：500+ 安装，50+ Playbook，10+ 自定义适配器

---

## 六、成功标准

### 6.1 技术指标

- **可靠性**：95%+ 命令成功率
- **性能**：<500ms 端到端延迟
- **覆盖**：支持 5+ 适配器

### 6.2 产品指标

- **采用**：500+ Marketplace 安装（首月）
- **活跃**：50+ 团队使用 Playbook
- **生态**：10+ 社区贡献的适配器/Playbook

### 6.3 质量指标

- **体验**：零配置上手 < 5 分钟
- **反馈**：4.5+ 星评分
- **口碑**："Cursor 远程控制的标准工具"

---

## 七、为什么会成功？

### 7.1 时机

- Cursor 用户爆发增长
- 远程办公常态化
- AI coding 需要更好的远程协作

### 7.2 独特性

- **不是又一个机器人**，是远程意图执行引擎
- **不是个人工具**，是团队基础设施
- **不是简单转发**，是智能编排平台

### 7.3 网络效应

- Playbook 越多 → 价值越高 → 用户越多 → Playbook 更多
- 类似 GitHub Actions 的飞轮效应

---

**下一步**：实现 MVP，验证核心假设。准备好了吗？**

