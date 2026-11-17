# 文献缺口梳理

**用途**：与 supervisor 讨论"接下来读什么、补哪些"的工作文档。
**结论先行**：现有 11 篇文献集中在管线最后一段（答案评分），提取 / 出题 / 追问三段，以及心理测量学、组织心理学、反馈理论、公平性四个学科完全空白。

> 注：本文标注的文献均为真实存在的出版物，但投稿前请逐条核对卷期页码。标 "待确认" 的条目需自行检索验证。

---

## 1. 现状盘点

### 1.1 按产品管线（这是真正的缺口所在）

| 阶段 | 做什么 | 现有文献 | 覆盖度 |
|---|---|---|---|
| **1. 提取** | 从 PS / 简历中抽出可追问的声明 | 无 | **0** |
| **2. 出题** | 基于声明生成面试问题 | EZInterviewer(2)、MockLLM(4) | 系统论文，非 QG 方法论文 |
| **3. 追问** | 多轮深挖直到获得具体事件 | MockLLM(4) | 1 篇，且无追问策略理论 |
| **4. 评分** | 对答案按维度打分 | 其余全部 | 充分 |

问题：**上游三段没有任何方法论支撑，但它们是下游评分的输入**。提取错了，题目就偏；题目偏了，评分再准也没有意义。

### 1.2 按学科

| 学科 | 现有篇数 | 状态 | 影响 |
|---|---|---|---|
| HCI / 面试系统 | 5（TARDIS、EZInterviewer、MACH、Virtual Interviewers、Conversate） | 充分 | — |
| LLM 评测 / 偏差 | 2（Maity、VOPE） | 偏薄 | G1–G8 缺系统清单 |
| 多模态信号处理 | 2（MACH、Murali） | 够用 | 本产品只评文本 |
| 写作评估 | 1（Aggarwal） | 勉强 | Config B 支撑不足 |
| **心理测量学** | 0 | **空白** | 六条评判标准无方法论支撑 |
| **工业组织心理学** | 0 | **空白** | 面试评分 60 年研究未引用 |
| **学习科学 / 反馈** | 0 | **空白** | 产品价值前提未论证 |
| **算法公平性** | 0 | **空白** | L2 用户群风险未讨论 |

---

## 2. 缺口清单

### 缺口 A — 提取：从非结构化文书里识别"可追问的声明"

| 项 | 内容 |
|---|---|
| **影响哪一环** | `resume/extract` 与 `admissions/extract` 两个路由（当前各 88 / 87 行，逻辑重复） |
| **不补会怎样** | 模型只能靠 prompt 说"提取关键信息"，会抽出一堆不可追问的字段（GPA、学校名），漏掉"我独立设计了实验""我把延迟降低了 60%"这类真正该追问的声明。**提取是整条管线的输入，错在这里后面全错。** |
| **本质是什么** | 两个子任务：① claim identification（哪句是可被质疑的声明）② check-worthiness（哪句值得追问） |
| **必读** | **Daxenberger et al. (2017)**, EMNLP, "What is the Essence of a Claim? Cross-Domain Claim Identification" —— claim 的形式化定义<br>**Hassan et al. (2017)**, KDD, "ClaimBuster: The First-ever End-to-end Fact-checking System" —— check-worthiness 打分<br>**Swales (1990)**, *Genre Analysis* —— CARS 模型，学术文本的固定修辞结构<br>**Ding (2007)**, "Genre analysis of personal statements" —— PS 的语篇结构 |
| **用在哪一节** | 系统设计章（extraction module）；rubric 的 `resume_extract_v1` / `ps_claims_v1` 两个配置的依据 |
| **可落地的产出** | 每个提取项必须带 `{claim, source_quote, claim_type, probe_worthiness_score}`，其中 `source_quote` 用 `source.includes()` 验证——复用 E2 |

### 缺口 B — 出题：从声明生成有区分度的面试问题

| 项 | 内容 |
|---|---|
| **影响哪一环** | `interview/generate` 与 `admissions/generate` 两个路由（当前各 252 / 241 行，逻辑重复） |
| **不补会怎样** | 只能凭经验写 prompt。无法回答"我生成的题目好不好"——这是独立于评分的评价问题（见第 5 节） |
| **必读** | **Kurdi, Leo, Parsia, Sattler & Al-Emari (2020)**, *IJAIED*, "A Systematic Review of Automatic Question Generation for Educational Purposes" —— 教育 QG 系统综述，**先读这篇就够覆盖全领域**<br>**Du, Shao & Cardie (2017)**, ACL, "Learning to Ask: Neural Question Generation for Reading Comprehension" —— 方法基线<br>**Rus et al. (2010)**, QG Shared Task —— 评价维度定义（relevance / answerability / well-formedness / ambiguity）<br>**Anderson & Krathwohl (2001)**, *A Taxonomy for Learning, Teaching, and Assessing* —— Bloom 修订版，判断题目是否问到"分析/评价"层<br>**Webb (1997)**, Depth of Knowledge —— 题目深度分级<br>**Novikova et al. (2017)**, EMNLP, "Why We Need New Evaluation Metrics for NLG" —— 解释为什么不能用字面重合度评题目质量 |
| **用在哪一节** | 系统设计章（question generation）；evaluation 章的 QG 指标部分 |

### 缺口 C — 追问：何时该深挖、追问什么

| 项 | 内容 |
|---|---|
| **影响哪一环** | `api/interview/followup`（已实现，depth cap 3） |
| **不补会怎样** | cap 3 是个工程折中，论文里无法论证"为什么是 3"。STAR 的学术来源规定的是"追问到获得完整行为事件为止"，不是固定层数 |
| **必读** | **McClelland (1998)**, *Psychological Science*, "Identifying Competencies with Behavioral-Event Interviews" —— **STAR 方法的学术源头**，规定了追问终止条件<br>**Flanagan (1954)**, *Psychological Bulletin*, "The Critical Incident Technique" —— 原始的关键事件法，如何把模糊叙述逼成具体事件<br>**Rao & Daumé III (2018)**, ACL, "Learning to Ask Good Questions: Ranking Clarification Questions using Neural Expected Value of Perfect Information" —— 用信息增益决定追问哪个最值<br>**Fisher & Geiselman (1992)**, *Memory-Enhancing Techniques for Investigative Interviewing* —— 认知访谈，提问结构如何提高细节产出 |
| **用在哪一节** | 系统设计章（follow-up engine）；讨论 cap 3 的合理性，或改用"覆盖度"作为终止条件 |

### 缺口 D — 心理测量学：六条评判标准的方法论基础

| 项 | 内容 |
|---|---|
| **影响哪一环** | Part 2（baseline 统计）、Part 3（六条自检） |
| **不补会怎样** | "稳定可复现"和"效度有对照支撑"目前只是主张。测量学里这两个词有严格定义，现有实现对不上：A vs B 只证明"行为不同"，不证明"更准"；没有 ICC / α / G-theory，无法称为信度 |
| **必读** | **Jonsson & Svingby (2007)**, *Educational Research Review*, "The use of scoring rubrics: Reliability, validity and educational consequences" —— **最关键一篇**。结论直接支持分析式 rubric + 明确 criteria + 4 档能提升一致性<br>**Messick (1995)**, *American Psychologist* —— 效度统一框架，提供 construct underrepresentation / construct-irrelevant variance 两个术语<br>**Williamson, Xi & Breyer (2012)**, *EM:IP*, "A framework for evaluation and use of automated scoring" —— 自动评分的效度评估标准路线<br>**Krippendorff (2004)** *Content Analysis* / **Hayes & Krippendorff (2007)** —— Krippendorff's α 算法<br>**Shrout & Fleiss (1979)**, *Psychological Bulletin* —— ICC 原始定义，需说明用 ICC(2,k) 还是 ICC(3,1)<br>**Brennan (2001)**, *Generalizability Theory* —— 方差分解：分数变异里有多少来自答案、评分者、场合、维度<br>**Linacre (2002)**, *JAM*, "Optimizing rating scale category effectiveness" —— **最实用**：判定"四档是否真的四级"（每档 ≥10 观测，阈值单调）<br>**AERA/APA/NCME (2014)**, *Standards for Educational and Psychological Testing* —— 术语与报告规范 |
| **用在哪一节** | Part 2 统计分析（升级为信度 + 效度 + 档位功能三层）；Part 3 第 5、6 条自检 |

### 缺口 E — 工业组织心理学：面试评分的 60 年研究

| 项 | 内容 |
|---|---|
| **影响哪一环** | Part 1 四维设计、Part 3 "维度不冗余" |
| **不补会怎样** | 你的 rubric 在重新发明面试评分，而该领域已有大量实证结论，**其中一条直接挑战四维独立假设**（见第 3 节） |
| **必读** | **Schmidt & Hunter (1998)**, *Psychological Bulletin* —— 85 年人事选拔元分析，结构化面试效度约 0.51，这是"面试可被系统化评分"的基础数字<br>**Campion, Palmer & Campion (1997)**, *Personnel Psychology*, "A review of structure in the selection interview" —— 结构化面试 15 个成分，你只做了"标准化评分标准"一个<br>**Huffcutt, Conway, Roth & Stone (2001)**, *Personnel Psychology* —— 面试实际测量什么构念（通用智力、job knowledge、社交技能），**不是四个并列独立维度**<br>**Smith & Kendall (1963)**, *JAP* —— **BARS 的原始出处**，你规则 5（行为锚定）的正面来源，目前只引了 TARDIS 的反面例子<br>**Murphy, Jako & Anhalt (1993)** / **Viswesvaran, Schmidt & Ones (2005)**, *JAP* —— halo effect，维度间相关常在 0.6–0.8<br>**Levashina, Hartwell, Morgeson & Campion (2014)**, *Journal of Management* —— 结构化面试综述，一篇顶十篇 |
| **用在哪一节** | 文献综述章（面试评估传统）；Part 3 第 1 条的论证；threats to validity |

### 缺口 F — LLM-as-judge 的系统偏差分类

| 项 | 内容 |
|---|---|
| **影响哪一环** | G1–G8 守卫列表 |
| **不补会怎样** | 现在的守卫是从两篇论文的 limitation 零散反推的，没有对照一份已发表的偏差清单，容易漏（例如 verbosity bias 完全没处理：啰嗦但正确的答案会不会拿高分？） |
| **必读** | **Zheng et al. (2023)**, NeurIPS, "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena" —— position / verbosity / self-enhancement 三大偏差的标准定义<br>**Liu et al. (2023)**, EMNLP, "G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment" —— **直接支持你的核心设计**：详细 rubric + 分步 + 结构化输出显著提升与人类一致性。你的 anchor 表 + JSON 输出本质是 G-Eval 变体，必须引用<br>**Sharma et al. (2023)**, "Towards Understanding Sycophancy in Language Models" —— sycophancy 的规范来源（你目前引的是 Conversate 的现象观察）<br>**Ye et al. (2024)**, "Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge" —— 12 类偏差量化清单（authority / bandwagon / compassion 等），可做 G 列表的对照表<br>**Panickssery et al. (2024)**, NeurIPS, "LLM Evaluators Recognize and Favor Their Own Generations" —— 自我偏好偏差 |
| **用在哪一节** | Part 1.1 守卫设计的依据；用一张"偏差 → 对应 guard"的对照表替代现在的零散引证 |

### 缺口 G — 反馈理论：产品价值的前提可能被质疑

| 项 | 内容 |
|---|---|
| **影响哪一环** | G4（改进建议）、产品价值论证 |
| **不补会怎样** | 你的逻辑是"给分 → 用户改进"。教育研究显示这个链条是有条件的，而且存在反例：约 1/3 的反馈干预**降低**了表现 |
| **必读** | **Hattie & Timperley (2007)**, *Review of Educational Research*, "The power of feedback" —— feed-up / feed-back / feed-forward 三层模型。你现在只有 feed-forward（G4），缺 feed-up<br>**Kluger & DeNisi (1996)**, *Psychological Bulletin* —— **反例论文**：只给分数/评级、不指向具体任务的反馈常常有害。必须回应，否则"给用户打四个分"这个设计的前提不成立<br>**Carless & Boud (2018)**, *AEHE*, "The development of student feedback literacy" —— 用户需要被教怎么读反馈<br>**Ericsson, Krampe & Tesch-Römer (1993)**, *Psychological Review* —— 刻意练习：即时反馈 + 可重复 + 明确目标。模拟面试属于此类 |
| **用在哪一节** | 设计依据章（为什么这么呈现分数）；G4 的升级（三层反馈结构）；讨论章 |

### 缺口 H — 公平性：用户群正好是受影响最深的群体

| 项 | 内容 |
|---|---|
| **影响哪一环** | Config B 的 `language_quality` 维度；伦理章 |
| **不补会怎样** | 产品面向中国学生做英文面试。语言质量维度会**系统性惩罚非母语者**，而"语法准确"和"表达思想的能力"是两件事 |
| **必读** | **Raghavan, Barocas, Kleinberg & Levy (2020)**, FAT* —— 算法招聘偏差缓解，claims vs practices<br>**Barocas & Selbst (2016)**, *California Law Review*, "Big data's disparate impact" —— 差别影响框架<br>**Koenecke et al. (2020)**, *PNAS*, "Racial disparities in automated speech recognition" —— 语音识别对非标准口音错误率显著更高（若未来加语音输入，这是硬约束）<br>**待确认**：2024 年后关于 LLM 打分中方言/非母语偏差的实证论文，需自行检索 |
| **用在哪一节** | 伦理章；`language_quality` 维度的限制说明（该分不反映沟通能力，只反映语言形式） |

### 缺口 I —（可选，加分项）诊断模型

| 项 | 内容 |
|---|---|
| **影响哪一环** | 产品定位：从"打分工具"升级为"诊断工具" |
| **必读** | **Leighton & Gierl (2007)**, *Cognitive Diagnostic Assessment for Education*<br>**Rupp, Templin & Henson (2010)**, *Diagnostic Measurement* |
| **核心概念** | attribute mastery profile：不给总分，给"哪些属性已掌握"的向量。四维 × 四档天然可转成这种 profile |
| **用在哪一节** | 理论贡献章（如果时间允许） |

---

## 3. 三条会挑战现有设计的结论

这三条必须写进 threats to validity，不能回避。评审看到你主动讨论反证，比看到十篇支持性引用更有说服力。

| 结论 | 出处 | 挑战什么 | 你的应对 |
|---|---|---|---|
| **Halo effect**：真实评分者对不同维度的打分相关性常在 0.6–0.8，因为人先形成整体印象再拆维度 | Viswesvaran et al. (2005); Murphy et al. (1993) | "四维独立"假设 | baseline 必测四维相关矩阵；若 r > 0.8 则合并维度，作为数据驱动的结论报告 |
| **反馈可能有害**：约 1/3 反馈干预降低表现，尤其是指向自我而非任务的反馈 | Kluger & DeNisi (1996) | "打分 → 改进"的产品前提 | 输出必须包含 feed-forward（可执行下一步），不能只给分数；在讨论章明确这一限制 |
| **四档可能实际只有三级**：若相邻档位从不被区分，说明该档无效 | Linacre (2002) | 四档设计 | baseline 用 Rasch 评定量表模型检查档位功能；每档观测数 ≥10，阈值须单调 |

---

## 4. 优先级：先读这 10 篇

| # | 文献 | 补哪个洞 | 读完能改什么 |
|---|---|---|---|
| 1 | Jonsson & Svingby (2007) | D 测量学 | 四档 + 分析式设计有了直接依据，替代零散引证 |
| 2 | Liu et al. (2023) G-Eval | F LLM 偏差 | 整个方法（rubric + 结构化输出）的核心依据 |
| 3 | Kurdi et al. (2020) QG 综述 | B 出题 | 一篇覆盖出题全领域 |
| 4 | Huffcutt et al. (2001) | E 组织心理学 | 可能推翻"四维独立"，越早读越好 |
| 5 | McClelland (1998) BEI | C 追问 | STAR 源头，直接决定 cap 3 怎么论证 |
| 6 | Daxenberger et al. (2017) | A 提取 | "提取"这个动作的理论定义 |
| 7 | Menick et al. (2022) | A+B grounding | 你 E2 机制的权威来源，可复用到出题 |
| 8 | Viswesvaran et al. (2005) | E halo | 决定四维相关矩阵怎么设计 |
| 9 | Kluger & DeNisi (1996) | G 反馈 | 回应"给分是否有害" |
| 10 | Linacre (2002) | D 档位 | 教你怎么用数据判断四档是否成立 |

读完之后建议做一次判断：**现有 11 篇作为"同类系统"综述保留，新增文献作为"方法论"支撑**，两者在论文里分属不同小节，不要混在一起引。

---

## 5. 三套评价体系（对应管线三段）

这是当前设计最大的结构性问题：只有一个 baseline，但管线有三段需要评价。

| 阶段 | 评价问题 | 指标 | 当前状态 |
|---|---|---|---|
| **提取** | 抽出的声明是否覆盖了文书要点？有无虚构？ | 覆盖率（人工标注应提取项作为 gold）<br>虚构率（提取项在原文中找不到） | 无 |
| **出题** | 题目是否 grounded？可答？有区分度？够深？ | faithfulness（`source.includes(quote)`）<br>answerability（人工或 LLM 双评）<br>coverage（覆盖了几条声明）<br>discriminative value（强弱候选人得分差）<br>difficulty（Bloom 层级分布） | 无 |
| **评分** | 分数是否准确、稳定、不膨胀？ | 平均分差、quote 合规率、分散度、区分度、sycophancy rate、与人工一致性（ICC） | 方案完整 |

**关键点**：Supervisor 说的"一个管线、两份配置"是**架构**原则，不是**评价**原则。三段的评价指标天然不同，论文里必须分开写，否则会被质疑"只验证了最后一步"。

**附带发现**：出题的 faithfulness 可以直接复用评分的 E2 机制。同一套 `source.includes(quote)` 逻辑，既是评分时的证据验证，也是出题时的 grounding 验证——这正好体现"一个引擎、多份配置"的架构原则。

---

## 6. 文献清单（按主题分组）

### 提取 / 声明识别
- Daxenberger, J., Eger, S., Stab, C., & Gurevych, I. (2017). What is the Essence of a Claim? Cross-Domain Claim Identification. *EMNLP*.
- Hassan, N., Zhang, G., Arslan, F., Caraballo, J., & Tremayne, M. (2017). ClaimBuster: The First-ever End-to-end Fact-checking System. *KDD*.
- Swales, J. M. (1990). *Genre Analysis: English in Academic and Research Settings*. Cambridge University Press.
- Ding, H. (2007). Genre analysis of personal statements. *English for Specific Purposes*.

### 出题 / 问题生成
- Kurdi, G., Leo, J., Parsia, B., Sattler, U., & Al-Emari, S. (2020). A Systematic Review of Automatic Question Generation for Educational Purposes. *IJAIED*.
- Du, X., Shao, J., & Cardie, C. (2017). Learning to Ask: Neural Question Generation for Reading Comprehension. *ACL*.
- Rus, V., Wyse, B., Piwek, P., Lintean, M., Rishes, A., Mostow, J., & Liu, Y. (2010). The First Question Generation Shared Task and Evaluation Challenge.
- Anderson, L. W., & Krathwohl, D. R. (2001). *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy*.
- Webb, N. L. (1997). Criteria for Alignment of Expectations and Assessments in Mathematics and Science Education.
- Novikova, J., Dušek, O., Cercas Curry, A., & Rieser, V. (2017). Why We Need New Evaluation Metrics for NLG. *EMNLP*.

### 追问 / 面试方法
- McClelland, D. C. (1998). Identifying Competencies with Behavioral-Event Interviews. *Psychological Science*.
- Flanagan, J. C. (1954). The Critical Incident Technique. *Psychological Bulletin*.
- Rao, S., & Daumé III, H. (2018). Learning to Ask Good Questions: Ranking Clarification Questions using Neural Expected Value of Perfect Information. *ACL*.
- Fisher, R. P., & Geiselman, R. E. (1992). *Memory-Enhancing Techniques for Investigative Interviewing: The Cognitive Interview*.

### Grounding / 归因 / 幻觉
- Menick, J., et al. (2022). Teaching Language Models to Support Answers with Verified Quotes.
- Rashkin, H., et al. (2023). Measuring Attribution in Natural Language Generation Models. *TACL*.
- Gao, T., et al. (2023). Enabling Large Language Models to Generate Text with Citations. *ACL*.
- Ji, Z., et al. (2023). Survey of Hallucination in Natural Language Generation. *ACM Computing Surveys*.
- Maynez, J., Narayan, S., Bohnet, B., & McDonald, R. (2020). On Faithfulness and Factuality in Abstractive Summarization. *ACL*.

### 心理测量学
- Jonsson, A., & Svingby, G. (2007). The use of scoring rubrics: Reliability, validity and educational consequences. *Educational Research Review*.
- Messick, S. (1995). Validity of psychological assessment. *American Psychologist*.
- Kane, M. T. (2013). Validating the interpretations and uses of test scores. *Journal of Educational Measurement*.
- Williamson, D. M., Xi, X., & Breyer, F. J. (2012). A framework for evaluation and use of automated scoring. *Educational Measurement: Issues and Practice*.
- Krippendorff, K. (2004). *Content Analysis: An Introduction to Its Methodology*.
- Hayes, A. F., & Krippendorff, K. (2007). Answering the call for a standard reliability measure for coding data. *Communication Methods and Measures*.
- Shrout, P. E., & Fleiss, J. L. (1979). Intraclass correlations: Uses in assessing rater reliability. *Psychological Bulletin*.
- Brennan, R. L. (2001). *Generalizability Theory*. Springer.
- Linacre, J. M. (2002). Optimizing rating scale category effectiveness. *Journal of Applied Measurement*.
- AERA, APA, & NCME (2014). *Standards for Educational and Psychological Testing*.
- Brookhart, S. M., & Chen, F. (2015). The quality and effectiveness of descriptive rubrics. *Educational Review*.
- Sadler, D. R. (2005). Interpretations of criteria-based assessment and grading in higher education. *Assessment & Evaluation in Higher Education*.

### 工业组织心理学 / 面试效度
- Schmidt, F. L., & Hunter, J. E. (1998). The validity and utility of selection methods in personnel psychology. *Psychological Bulletin*.
- Campion, M. A., Palmer, D. K., & Campion, J. E. (1997). A review of structure in the selection interview. *Personnel Psychology*.
- Huffcutt, A. I., Conway, J. M., Roth, P. L., & Stone, N. J. (2001). Identification and meta-analytic assessment of psychological constructs measured in employment interviews. *Personnel Psychology*.
- Levashina, J., Hartwell, C. J., Morgeson, F. P., & Campion, M. A. (2014). The structured employment interview. *Journal of Management*.
- Smith, P. C., & Kendall, L. M. (1963). Retranslation of expectations: An approach to the construction of unambiguous anchors for rating scales. *Journal of Applied Psychology*.
- Viswesvaran, C., Schmidt, F. L., & Ones, D. S. (2005). Is there a general factor in ratings of job performance? *Journal of Applied Psychology*.
- Murphy, K. R., Jako, R. A., & Anhalt, R. L. (1993). Nature and consequences of halo error. *Journal of Applied Psychology*.

### LLM-as-judge
- Zheng, L., et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. *NeurIPS*.
- Liu, Y., et al. (2023). G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment. *EMNLP*.
- Sharma, M., et al. (2023). Towards Understanding Sycophancy in Language Models.
- Ye, J., et al. (2024). Justice or Prejudice? Quantifying Biases in LLM-as-a-Judge.
- Panickssery, A., et al. (2024). LLM Evaluators Recognize and Favor Their Own Generations. *NeurIPS*.
- Sclar, M., et al. (2024). Quantifying Language Models' Sensitivity to Spurious Features in Prompt Design. *ICLR*.

### 反馈 / 学习
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research*.
- Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance. *Psychological Bulletin*.
- Carless, D., & Boud, D. (2018). The development of student feedback literacy. *Assessment & Evaluation in Higher Education*.
- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. *Psychological Review*.

### 公平性
- Raghavan, M., Barocas, S., Kleinberg, J., & Levy, K. (2020). Mitigating bias in algorithmic hiring. *FAT\**.
- Barocas, S., & Selbst, A. D. (2016). Big data's disparate impact. *California Law Review*.
- Koenecke, A., et al. (2020). Racial disparities in automated speech recognition. *PNAS*.

### 招生面试
- Eva, K. W., Rosenfeld, J., Reiter, H. I., & Norman, G. R. (2004). An admissions OSCE: the multiple mini-interview. *Medical Education*.
  - 相关性：MMI 文献显示单站面试信度很低（约 0.4），需 12 站才达 0.7 以上。**这直接说明单次模拟面试的可靠性上限，报告分数时应给置信区间而非点值。**

### 诊断模型（可选）
- Leighton, J. P., & Gierl, M. J. (2007). *Cognitive Diagnostic Assessment for Education*.
- Rupp, A. A., Templin, J., & Henson, R. A. (2010). *Diagnostic Measurement*.

---

## 7. 下一步建议

| 顺序 | 动作 | 产出 |
|---|---|---|
| 1 | 读第 4 节前 5 篇 | 判断"四维是否成立"是否有文献层面的问题 |
| 2 | 与 supervisor 过一遍本文档 | 确定读哪些、砍哪些（不必全读，10 篇是合理规模） |
| 3 | 按缺口 A/B 重写提取与出题模块的设计说明 | 补齐上游三段的依据 |
| 4 | 把第 3 节三条挑战写进 threats to validity | 主动暴露局限，而不是被评审指出 |
| 5 | 按第 5 节把 baseline 扩成三段评价 | 避免"只验证了最后一步"的质疑 |
