export const sources:Record<string,{label:string;url?:string}>={
 cv:{label:'用户提供的 CV Master · 2026-10-13'},user:{label:'用户对话：研究主线、Artifacts 定义与 Print Lab 优先级'},
 homepage:{label:'现有主页',url:'https://gengyuanmax.github.io/'},scholar:{label:'Google Scholar · 已展开全部 20 个条目并去重',url:'https://scholar.google.com/citations?user=LN2tYr0AAAAJ'},
 'print-lab':{label:'Print Lab · 四个实验室',url:'https://gengyuanmax.github.io/print-labs/index.html'},
 neurips:{label:'NeurIPS 2026 poster 页面',url:'https://neurips.cc/virtual/2026/loc/sydney/poster/139078'},
 mosaic:{label:'Mosaic · arXiv',url:'https://arxiv.org/abs/2609.39363'},avila:{label:'AViLA · arXiv',url:'https://arxiv.org/abs/2506.18472'},
 reexplore:{label:'ReEXplore · arXiv',url:'https://arxiv.org/abs/2511.19033'},icq:{label:'ICQ 项目页面',url:'https://icq-benchmark.github.io/'},
 mevtr:{label:'MeVTR · 官方仓库',url:'https://github.com/gengyuanmax/MeVTR'},wikitilo:{label:'WikiTiLo · 官方仓库',url:'https://github.com/gengyuanmax/WikiTiLo'},
};
export const reviewNotes=[
 '除用户明确确认的条目外，其余文案仍为待确认：标题、作者、日期与经历主要转录自 CV；短简介和项目描述经过压缩或改写。资料核对不等于用户批准文案。',
 'Oxford 访学由用户确认为 2026 年 3 月 16 日至 7 月 31 日；博士身份仍在读，预计 2026 年 12 月完成。没有改写成已毕业。',
 'Scholar 的 20 条记录含 prompt survey 重复条目，以及同一 arXiv 2505.23798 的两个题名。按 arXiv 当前题名与 CV 合并；再加入 CV 和 NeurIPS 页面确认的 surgical benchmark，共 19 篇。',
 'ReEXplore 的预印本发表于 2025 年，CV 标为 ECCV 2026 EMR Workshop；两者表示不同阶段。会议信息采用 CV，链接指向预印本。',
 'Conformalized LLMs 的 EMNLP 2026 accepted 状态来自 CV。Scholar 仍显示预印本；本轮未独立核对会议录用名单。',
 'Mosaic 的公开仓库当前为空；网站链接论文，不将其描述成已经发布的代码库。',
 'Print Labs 上线日期由用户确认为 2026 年 10 月 13 日，首页与 Artifacts 共用该日期。ICQ-Highlight、WikiTiLo、MeVTR 暂无核实的作品发布日期：保留为空，显示关联论文会议，待补日期后自动排序。',
 '三条研究方向下的代表项目归类为编辑提案；跨领域项目同时显示关联方向。Machines 命名仍待最终确认。',
 'News 按日期倒序排列。用户确认 Surgeon 录用为 2026-09-20、ReEXplore 举办为 2026-09-09；举办日不表示录用日或本人参会。Software Campus 金额统一为 €115,000，获资助月份已由用户确认为 2025 年 12 月；仅记录到月份，不推断具体日。',
 'CV 的完整 PDF 未复制到公开目录；本轮只提取网页所需内容。头像继续复用已选抠图；Print Lab 四张预览直接取自用户作品中已经处理过的图形。',
];
