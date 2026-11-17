# 你现有 11 篇新论文的覆盖度分析

**生成时间**: 2026-11-17
**输入**: `extract_11_out.json` + `extract_11_detailed_out.json`
**用途**: 与 supervisor 讨论"现有文献够不够、还需要读什么"。

---

## 0. 论文身份确认

| # | 文件名 | 标题 | Venue / 年份 | 页数 | 核心主题 |
|---|---|---|---|---|---|
| 1 | 1.pdf | *Adolescents' Self-regulation during Job Interviews through an AI Coaching Environment* | HCI（UCL） | 5 | AI coaching，非语言+语言反馈 |
| 2 | 2.pdf | *EZInterviewer: To Improve Job Interview Performance with Mock Interview Generator* | WSDM'23 | 9 | **知识支撑的 mock interview 生成** |
| 3 | 3.pdf | *MACH: My Automated Conversation coacH* | UbiComp'13 | 10 | 多模态 coaching（表情+语调+文本） |
| 4 | 4.pdf | *MockLLM: A Multi-Agent Behavior Collaboration Framework for Online Job Seeking and Recruiting* | KDD'25 | 11 | **多 agent 面试生成 + 双向评估** |
| 5 | 5.pdf | *Virtual Interviewers, Real Results: Exploring AI-Driven Mock Technical Interviews* | CSCW（qual） | 5 | 质性研究 n=20，用户体验 |
| 6 | 6.pdf | *AI Simulator that Quantifies Interview Performance with Real-Time Analytics* | IJERSEM 2026 | 9 | 多模态 AI simulator，有 question generation + scoring |
| 7 | 7.pdf | *Conversate: Supporting Reflective Learning in Interview Practice Through Interactive Simulation and Dialogic Feedback* | CHI'25 | 32 | **对话式反馈，follow-up，sycophancy** |
| 8 | 8.pdf | *Designing Knowledge Tools: How Students Transition from Using to Creating Generative AI in STEAM Classroom* | EDULEARN/SUTD | 8 | SDT，STEAM 课堂，**非直接面试论文** |
| 9 | 9.pdf | *Towards Smarter Hiring: Are Zero-Shot and Few-Shot Pre-trained LLMs Ready for HR Spoken Interview Transcript Analysis?* | IIT Kharagpur | 32 | **HR transcript 评分，3,890 transcripts** |
| 10 | 10.pdf | *Using Large Language Models to Support High-Volume Application Review for an Undergraduate Research Program* | Purdue | 11 | **SoP 评审，1,200 SoPs，structured rubric** |
| 11 | 11.pdf | *VOPE: Revisiting Hallucination of Vision-Language Models in Voluntary Imagination Task* | ACM MM'26 | 12 | VLM hallucination，grounding，**评分质量控制** |

---

## 1. 管线覆盖矩阵（你这 11 篇）

| 管线阶段 | 直接覆盖 | 间接覆盖 | 覆盖度 | 关键缺口 |
|---|---|---|---|---|
| **提取** | 0 | 2 (EZInterviewer + MockLLM 的 knowledge-grounded 是隐式替代) | **不足** | 没有任何论文显式讨论"从文书/简历中识别可追问声明"——都假设上游已有结构化 knowledge base |
| **出题** | 2 (EZInterviewer, MockLLM) | 1 (Murali 6) | **勉强** | 只有系统论文，**没有 QG 方法论文** |
| **追问** | 1 (Conversate) | 1 (MockLLM reflection memory) | **不足** | 没有追问终止策略理论 |
| **评分** | 4 (Maity, Aggarwal, Murali, MACH) | 1 (VOPE 作为评分质量控制) | **中等** | 有 rubric 案例，但**没有测量学框架** |
| **反馈质量** | 1 (Conversate) | 0 | **薄** | 没有反馈理论 |
| **偏差识别** | 2 (Maity verbosity bias, Aggarwal leniency) | 1 (Conversate sycophancy) | **薄** | 只有零散观察，没有系统偏差清单 |

### 关键发现：你原来以为"提取"是完整空白，但 EZInterviewer 实际上做了隐式提取

Paper 2 的关键词命中：**"grounded" 出现 26 次**、"knowledge-grounded dialogs" 是其核心设计。它用"知识支撑的对话生成"绕过了显式提取：不先抽出声明，直接让模型依据 knowledge base 生成问题。

这是一个重要的设计选择，值得你写进论文：
> 本文采用显式提取 → 出题两阶段设计，而非 EZInterviewer 式的隐式 knowledge grounding。原因是显式提取可以：① 让用户看到"系统为什么问这个问题"，② 复用提取产物做多轮追问，③ 单独评价提取质量。

---

## 2. 学科覆盖矩阵

| 学科 | 你的 11 篇 | 需要的数量 | 状态 |
|---|---|---|---|
| HCI / 面试系统 | 7 (1,2,3,4,5,6,7) | 充分 | ✅ |
| LLM 评测 / 偏差 | 3 (9,10,11) | 薄但可接受 | ⚠️ |
| 多模态信号处理 | 2 (3,6) | 本产品只评文本 | ✅ 够用 |
| 写作评估 | 1 (10) | Config B 唯一支撑 | ⚠️ 勉强 |
| **心理测量学** | **0** | **必须补** | ❌ 空白 |
| **工业组织心理学（面试效度）** | **0** | **必须补** | ❌ 空白 |
| **学习科学 / 反馈理论** | **0** | **应补** | ❌ 空白 |
| **算法公平性** | **0** | **应补** | ❌ 空白 |
| **出题方法论文（非系统论文）** | **0** | **应补** | ❌ 空白 |
| **声明识别 / 信息提取** | **0** | **必须补** | ❌ 空白 |
| **Grounding / Faithfulness 方法** | **0** | **应补** | ❌ 空白 |

---

## 3. 各阶段具体覆盖情况

### 3.1 提取（完全空白，最急）

**你 11 篇里没有任何一篇显式做"从文书/简历里识别可追问声明"**。

- EZInterviewer (2)：用 knowledge-grounding **绕过**了显式提取（不是真的做了提取）
- MockLLM (4)：同上，用 reflection memory + multi-agent role-play，假设知识已存在
- Conversate (7)：follow-up 是基于已完成的面试对话生成的，不需要预提取

你的产品有 `resume/extract` 和 `admissions/extract` 两个路由，但**零文献支撑**。这是你需要补的第一优先级。

### 3.2 出题（有系统论文，缺方法论文）

- **Paper 2 (EZInterviewer)**：基于简历 + JD 生成 mock interview dialogs。用两个预训练模块（resume encoder + JD encoder）+ knowledge-grounded decoder。**评价结果在 real-world interview dialog dataset 上**。
- **Paper 4 (MockLLM)**：multi-agent 生成 + 双向评估（两个 agent：candidate + interviewer，handshake protocol）。
- **Paper 6 (Murali)**：mention question generation 但没有给方法细节。

但这些是**系统论文**，你需要的是**问题生成方法论文**：任务定义、评价指标、难度控制、grounding。

### 3.3 追问（有 follow-up 但缺终止策略）

- **Paper 7 (Conversate)**：follow-up 关键词出现 45 次！这是你现有文献里追问相关的最丰富来源。但它没有回答"什么时候该停"。
- **Paper 4 (MockLLM)**：reflection memory 可以无限递归。

你的 depth cap 3 是个工程折中，但论文里需要论证。

### 3.4 评分（有案例，缺测量学框架）

- **Paper 9 (Maity)**：3,890 HR transcripts，评估了 9 个 LLM + 人类对比，**verbosity bias 20 次**（啰嗦的答案得分更高）。最关键发现：**text-ada-001 平均分 4.0，人类 2.2**（翻倍膨胀）。但这篇**没有测量学框架**。
- **Paper 10 (Aggarwal)**：Purdue SoP review，**rubric 关键词 39 次**，6 sub-categories × 0–3 scale，有 human calibration。**但没有维度独立检验、没有信效度报告**。
- **Paper 6 (Murali)**：多模态 scoring，但用 XGBoost 简单拼接各种信号。
- **Paper 11 (VOPE)**：虽然是 VLM hallucination，但它的 **1–3 Relevance scale with clear anchors** 是评分质量控制的直接依据。

---

## 4. 必须补的缺口（按优先级）

### 优先级 A：没有这些，baseline 无法论证

#### A1. 提取的理论定义 + 可操作方案（零覆盖）

你两个 extract 路由的方法支撑为零。EZInterviewer (2) 是隐式替代，但它不覆盖"从 PS 里抽声明"。

| 论文 | 补什么 |
|---|---|
| **Daxenberger et al. (2017)**, EMNLP, "What is the Essence of a Claim? Cross-Domain Claim Identification" | claim 的形式化定义（什么算一个可被质疑的声明） |
| **Hassan et al. (2017)**, KDD, "ClaimBuster" | check-worthiness 打分函数（哪句话值得追问） |
| **Swales (1990)**, *Genre Analysis* + **Ding (2007)**, "Genre analysis of personal statements" | PS 的修辞结构，告诉模型"PS 里哪些位置的句子最值得追问" |

**这三篇就能让 extract 模块从"瞎提取"变成"有理论支撑的系统性提取"。**

#### A2. 心理测量学框架（零覆盖）

你现在的"稳定可复现"和"效度有对照支撑"没有任何方法论定义。baseline 里报的"t-test + Cohen's d"在测量学家眼里是不够的。

| 论文 | 补什么 |
|---|---|
| **Jonsson & Svingby (2007)**, *Educational Research Review* | rubric 核心综述。四档 + 明确 criteria 为什么提升评分者一致性 —— 你的四档设计有了直接依据 |
| **Liu et al. (2023)**, EMNLP, "G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment" | 你的核心设计（详细 rubric + 结构化输出 + 分步评估）的直接依据。证明这样做提升与人类的一致性 |
| **Linacre (2002)**, *Journal of Applied Measurement*, "Optimizing rating scale category effectiveness" | 最实用：怎么用数据判断四档是否真的是四级（每档 ≥10 观测，阈值单调）。如果 baseline 发现 L2 和 L3 从不被区分，就该合并成三档 |
| **Brennan (2001)**, *Generalizability Theory* | 方差分解：分数变异里有多少来自答案、多少来自评分者、多少来自维度本身 |

---

### 优先级 B：应该补，否则会被质疑

#### B1. 工业组织心理学（零覆盖，但一篇就够）

| 论文 | 补什么 |
|---|---|
| **Huffcutt, Conway, Roth & Stone (2001)**, *Personnel Psychology*, "Identification and meta-analytic assessment of psychological constructs measured in employment interviews" | 面试实际测量什么构念（通用智力、job knowledge、社交技能）。**关键发现**：这些不是四个独立维度 —— 可能推翻你"四维独立"的前提。读完之后决定：baseline 里要不要测四维相关矩阵 |
| **Viswesvaran, Schmidt & Ones (2005)**, *Journal of Applied Psychology* | halo effect 的实证数据：真实评分者对不同维度的打分相关性常在 0.6–0.8。**baseline 必须测四维相关矩阵** |
| **Schmidt & Hunter (1998)**, *Psychological Bulletin* | 结构化面试效度系数约 0.51 —— "面试可以被系统化评分"的基础数字 |
| **McClelland (1998)**, *Psychological Science*, "Identifying Competencies with Behavioral-Event Interviews" | **STAR 的学术源头**。追问终止条件：追问到获得完整行为事件为止。这直接决定你的 cap 3 怎么论证 |

#### B2. 出题方法论文（不是系统论文）

| 论文 | 补什么 |
|---|---|
| **Kurdi, Leo, Parsia, Sattler & Al-Emari (2020)**, *IJAIED*, "A Systematic Review of Automatic Question Generation for Educational Purposes" | 教育场景 QG 系统综述，一篇覆盖全领域。知道有哪些方法、标准评价指标 |
| **Anderson & Krathwohl (2001)**, *A Taxonomy for Learning, Teaching, and Assessing* (Bloom 修订版) | 面试题应该问 Bloom "分析/评价"层，不是"回忆"层。这给你提供了一个**可测量的题目质量指标** |
| **Webb (1997)**, Depth of Knowledge | 题目深度分级 |

#### B3. LLM-as-judge 偏差系统清单

| 论文 | 补什么 |
|---|---|
| **Zheng et al. (2023)**, NeurIPS, "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" | 三大偏差的标准定义：position / verbosity / self-enhancement |
| **Maity (2024)** 你已有，**但漏了 verbosity bias 的详细数据** —— 读 Paper 9 的全文，它发现 verbosity bias 20 次！ |
| **Sharma et al. (2023)**, Anthropic, "Towards Understanding Sycophancy in Language Models" | sycophancy 的规范来源。你 Paper 7 Conversate 观察到了现象，但这篇给了机制和规模证据 |

#### B4. Grounding / Faithfulness 方法（你 E2 机制的来源）

| 论文 | 补什么 |
|---|---|
| **Menick et al. (2022)**, "Teaching language models to support answers with verified quotes" (GopherCite) | 生成时必须附带可验证原文引文 —— **你 E2 机制的权威来源** |
| **Rashkin et al. (2023)**, *TACL*, "Measuring Attribution in Natural Language Generation Models" | ACU 框架，定义"什么算被原文支持" |
| **Gao et al. (2023)**, ACL, "Enabling Large Language Models to Generate Text with Citations" | 带引用生成的系统评测 |

---

### 优先级 C：可选，但能显著提升论文

#### C1. 反馈理论

| 论文 | 补什么 |
|---|---|
| **Hattie & Timperley (2007)**, *Review of Educational Research*, "The power of feedback" | feed-up / feed-back / feed-forward 三层模型。你现在只有 feed-forward（G4），缺 feed-up |
| **Kluger & DeNisi (1996)**, *Psychological Bulletin* | **反例论文**：约 1/3 反馈干预降低表现。必须回应 |
| **Ericsson, Krampe & Tesch-Römer (1993)**, *Psychological Review* | 刻意练习：即时反馈 + 可重复 + 明确目标。模拟面试属于此类 |

#### C2. 公平性

| 论文 | 补什么 |
|---|---|
| **Raghavan, Barocas, Kleinberg & Levy (2020)**, FAT* | 算法招聘偏差缓解 |
| **Barocas & Selbst (2016)**, *California Law Review* | 差别影响框架 |

#### C3. 招生面试

| 论文 | 补什么 |
|---|---|
| **Eva, Rosenfeld, Reiter & Norman (2004)**, *Medical Education*, "An admissions OSCE: the multiple mini-interview" | **MMI 文献的关键发现**：单站面试信度约 0.4，需 12 站才达 0.7 以上。这直接说明单次模拟面试的可靠性上限 —— 报告分数时应给置信区间而非点值 |

---

## 5. 各阶段最终覆盖状态

| 管线阶段 | 你现有 11 篇 | 需要补的最小集合 | 补完后的覆盖度 |
|---|---|---|---|
| **提取** | 2 篇隐式替代（EZInterviewer+MockLLM 的 knowledge-grounding） | Daxenberger (claim) + Hassan (check-worthiness) + Swales/Ding (PS 结构) | 充分 |
| **出题** | 2 篇系统论文（EZInterviewer + MockLLM） | Kurdi (QG 综述) + Krathwohl (Bloom 层级) | 充分 |
| **追问** | 2 篇（Conversate follow-up 45次 + MockLLM reflection） | McClelland (STAR 源头) — 论证 cap 3 的合理性 | 中等 |
| **评分** | 4 篇（Maity inflation + Aggarwal rubric + Murali XGBoost + VOPE anchors） | Jonsson (rubric 综述) + G-Eval + Linacre (档位验证) | 充分 |
| **反馈质量** | 1 篇（Conversate dialogic feedback） | Hattie (三层模型) — 升级 G4 | 中等 |
| **偏差识别** | 3 篇零散观察（Maity verbosity + Aggarwal leniency + Conversate sycophancy） | Zheng (三大偏差) + Sharma (sycophancy 规范) | 充分 |

---

## 6. 三个会挑战现有设计的结论（必须写进 threats to validity）

| 结论 | 出处 | 挑战什么 | 你的应对 |
|---|---|---|---|
| **真实评分者存在 halo effect**：维度间相关常在 0.6–0.8 | Viswesvaran et al. (2005); Murphy et al. (1993) | "四维独立"假设 | baseline 必测四维相关矩阵；若 r > 0.8 则合并维度，作为数据驱动的结论报告 |
| **反馈可能有害**：约 1/3 反馈干预降低表现 | Kluger & DeNisi (1996) | "打分 → 改进"的产品前提 | 输出必须包含 feed-forward（可执行下一步），不能只给分数；讨论章明确这一限制 |
| **四档可能实际只有三级**：若相邻档位从不被区分 | Linacre (2002) | 四档设计 | baseline 用 Rasch 评定量表模型检查档位功能；每档观测数 ≥10，阈值须单调 |

---

## 7. 最少补充集合：读这 8 篇就够

| # | 论文 | 补哪个阶段 | 为什么优先 |
|---|---|---|---|
| 1 | **Jonsson & Svingby (2007)** | 评分方法论 | 一篇综述直接支撑你四档 + 分析式 rubric 的设计，替代现有零散引证 |
| 2 | **Liu et al. (2023) G-Eval** | 评分方法论 | 整个方法的核心依据，直接证明"详细 rubric + 结构化输出"提升与人类一致性 |
| 3 | **Daxenberger et al. (2017)** | 提取 | claim 的形式化定义 — extract 模块的理论起点 |
| 4 | **Swales (1990) + Ding (2007)** | 提取 | PS 修辞结构 — 告诉模型 PS 里哪些位置的句子最值得追问 |
| 5 | **Kurdi et al. (2020) QG 综述** | 出题 | 一篇覆盖全领域，知道有哪些方法和评价指标 |
| 6 | **McClelland (1998) BEI** | 追问 | STAR 源头，直接论证 cap 3 的合理性 |
| 7 | **Linacre (2002)** | 评分验证 | 教你怎么用数据判断四档是否真的是四级 |
| 8 | **Viswesvaran et al. (2005)** | 效度威胁 | halo effect，决定 baseline 要不要测四维相关矩阵 |

---

## 8. 你现有 11 篇论文的正确定位

读完补充文献后，你现有 11 篇应该这样使用：

| 分组 | 论文 | 论文里的角色 |
|---|---|---|
| **同类系统综述** | 1,2,3,4,5,6,7 | "已有哪些 AI 面试系统做过什么" — 这 7 篇作为 related work |
| **评分案例** | 9,10,11 | "LLM-as-judge 实际表现如何" — Maity 的 inflation 数据、Aggarwal 的 rubric 设计、VOPE 的 anchor scale |
| **噪声** | 8 | **Huang et al.** — 这篇是 STEAM 课堂设计研究，和你的产品没有直接关系。**建议从主文献列表里移除**，或只引用其 SDT 理论 |

**论文结构建议**：Related Work 一章先写 7 篇系统（你现有的），再写 4 篇评分案例（你现有的），最后写补充的 8 篇方法论（新读的）。不要把它们混在一起引。

---

## 9. 下一步动作

| 顺序 | 动作 | 产出 |
|---|---|---|
| 1 | **确认 Paper 8 (Huang) 是否保留** — 它和你的产品关联度最低，supervisor 可能建议移除 | 主文献列表 |
| 2 | 与 supervisor 过本文档，确认读哪些、砍哪些 | 阅读清单 |
| 3 | 读完 8 篇后，重写 literature_gaps.md，从"缺口分析"变成"已覆盖 / 待覆盖 / 不覆盖"的实际状态 | 更新后的 gap 文档 |
| 4 | 按第 5 节重写 baseline 实验，加入：① 出题 grounding 验证指标 ② 四维相关矩阵 ③ human gold standard | 升级后的 baseline |
