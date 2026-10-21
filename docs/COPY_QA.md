# Copy QA — 待填写

对外文案需要你确认后才能上线。逐项在 `答：` 后填写（中文或英文都行，我来定稿英文）。
不需要的项写“跳过”。括号里是现在网站上的写法或我的草稿，供参考，可以直接改。

---

## A. 首页身份与求职状态（招聘者最先看）

**A1. 一句话定位**：你希望读者 5 秒内记住你是做什么的？
（现在：“AI researcher, Based in Europe (Germany/UK)”）
（草稿：“Multimodal agents and video understanding”）
答：PhD AI Researcher in multimodal intelligence and visual understanding, based in Europe (Germany & UK)

**A2. 求职状态**：是否公开写？写成什么样？
- 预计毕业 / 可入职时间：（Education 里写的是 Dec 2026）
- 职位类型：Research Scientist / Research Engineer / Postdoc / 创业 / 其他？
- 地点偏好：（例：Europe, UK, remote）

答：Actively on job market and broader research collaboration 

**A3. 首页简介段**：现在这段是否保留？要不要加入 A2 的状态句？
（现在：“I am a final-year PhD student at LMU Munich, working on multimodal AI systems that understand and interact with the visual world. My research spans building multimodal models and agents, evaluating their visual intelligence in the wild, and applying their capabilities to specialized domains. I have also conducted research at the University of Oxford, Amazon, and TU Munich.”）
答：保留

**A4. 背书一行**：是否把机构单独列出来、一眼可见？列哪些、什么顺序？
（草稿：“LMU Munich · University of Oxford · Amazon · TU Munich”）
答：可以对机构加\emphasis

**A5. CV**：
- 是否放 CV 下载？（是 / 否）
- 文件：请提供 PDF，或告诉我仓库里用哪一份
- 链接文字：（草稿：“CV (PDF)”）

答：是 我等下发给你

---

## B. 研究方向（首页研究圆下方、Research 页章节）

每个方向一句话，让不熟悉的人也能看懂。现在屏幕上只显示一个词。

**B1. Building**（现在副标题：“Multimodal intelligent systems”）
答：Building AI models and systems that can understand and interact with visual/multimodal real-world  

**B2. Evaluating**（现在副标题：“Multimodal systems in the wild”）
答：what is the capability boundary of the evolving multimodal models? benchmakring and evaluating is the long-term goal

**B3. Applications**（现在副标题：“Multimodal intelligence in specialized domains”）
答：Leveraging multimodal intelligence in real production in expertise domain

---

## C. 首页 Selected projects

**C1. 选哪些、按什么顺序？** 现在草稿按以下顺序显示（已上线到预览，可直接改）：
1. Mosaic（arXiv 2026）
2. How to Train a Surgeon?（NeurIPS 2026）
3. AViLA（arXiv 2025）
4. ICQ（CVPR 2025）
5. Me-Retriever（ICCV 2023）

答（写项目名和顺序）：Mosaic, How to Train a Surgeon, ICQ, Me-Retriever, AViLA

**C2. 每项的一句话描述**：沿用 Research 页的描述，还是写更短的版本？需要改的请逐项写。
答：
Mosaic (rethinking multi-image representation in multi-image MLLMs)

How to Train a Surgeon? (Can genetic agents be trained as specialized surgeon?)

ICQ (Semantic event localization with multimodal user queries)

Me-Retriever (Multi-event video retrieval)

AViLA (on going project on online interactive multimodal systems)

**C3. 会议标签写法**：是否加 “Oral / Spotlight / Accepted (poster)” 这类说明？
答：不用

---

## D. 合作意向（首页或 About）

**D1. 现在最关心的开放问题**（2–3 条）
答：

**D2. 欢迎在哪些方面合作**（例：手术视频、智能体训练、评测方法、学生指导）
答：agent 训练和测试，multimodal intelligence define and evaluate，domain use
合作项目 工作机会 学生指导

**D3. 希望别人怎么联系你**（例：“Email me with a short note on …”）
答：email me

---

## E. 分区说明（读者分不清 Research 与 Artifacts）

**E1. Research 页头一句话**（现在：“Multimodal understanding, evaluation, and systems”）
答：My research interests spans in the following directions and delivers ...

**E2. Artifacts 页头一句话**（现在：“Interactive experiments, research tools, datasets, and papers.”）
（草稿：“Things you can use: tools, datasets, models and interactive labs.”）
答：artifacts created in my research and my person interests as portfolio, they are interactive demos, tools, datasets and paper, and more shapes

---

## F. 论文列表

**F1. 是否在 Research 页顶部放 3–5 篇 Selected publications？** 还是首页的 Selected projects 已经够了？
答：首页的够了，这个research页是作为一个story来说的

**F2. 完整论文列表默认展开还是折叠？**
答：可以默认展开

**F3. 作者名中你的名字是否加粗？** 共同一作如何标注？
答：可以加粗，星号就好
---

## 定稿（2026-10-21，按上面的回答整理成英文，已上线到 PR #28）

- A1 role: "PhD AI researcher in multimodal intelligence and visual understanding" / "Based in Europe (Germany & UK)"
- A2 status: "Actively on the job market and open to research collaboration." (home under the links; About › Contact)
- A3 intro: unchanged; A4: LMU Munich, University of Oxford, Amazon, TU Munich set in bold inside it
- A5 CV: pending the PDF
- B1 Building: "Building AI models and systems that understand and interact with the visual, multimodal real world."
- B2 Evaluating: "Where are the capability boundaries of evolving multimodal models? Benchmarking and evaluation as a long-term goal."
- B3 Applications: "Bringing multimodal intelligence into real production in expert domains."
- C1 order: Mosaic, How to Train a Surgeon?, ICQ, Me-Retriever, AViLA; C3: no presentation labels
- C2 lines: Mosaic "Rethinking multi-image representation in multi-image MLLMs." / Surgeon "Can generalist agents be trained into specialized surgeons?" / ICQ "Semantic event localization with multimodal user queries." / Me-Retriever "Multi-event video retrieval." / AViLA "Ongoing work on online, interactive multimodal systems."
- D1: left empty (not shown)
- D2/D3 (About › Contact): topics "Training and evaluating agents · Defining and evaluating multimodal intelligence · Domain applications"; "Open to collaborative projects, job opportunities and student mentoring. Email me."
- E1 Research: "My research spans three directions: building, evaluating and applying multimodal intelligence, told here through its projects."
- E2 Artifacts: "Artifacts from my research and personal interests: interactive demos, tools, datasets, papers and more."
- F1: no selected publications on Research; F2: publication list open by default; F3: own name bold, * for equal contribution (already)
