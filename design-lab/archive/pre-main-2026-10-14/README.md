# 主版本确定前的设计记录

2026-10-14：用户确认当前 B 版阅读动线，并要求只保留一个主版本继续调整。

此目录保留合并前的源文件与配方（加 `.txt` 避免成为可执行入口）。它是历史记录，不是可切换的主版本。
日常入口仅 `/design/`；独立网站 `/`；内容审核 `/design/content/`。旧设计页地址统一重定向到 `/design/`。
当前首页由 `src/components/areas/Home.astro`、`src/styles/home-main.css` 和 `src/client/home-branches.ts` 共同实现，设计台直接使用同一首页。
确认只涉及阅读动线；公开文案仍待用户确认。
