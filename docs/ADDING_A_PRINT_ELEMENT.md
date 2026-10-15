# 新增印刷元素

本指南描述已经接入首页的 API，不是待实现的提案。目标是统一流程，保留参数决定的视觉差异。设计约束仍以 `DESIGN_CONSTRAINTS.md` 为准。

## 入口和职责

- 纯渲染入口：`src/design/print-pipeline/index.ts`。所有新元素必须经 `definePrintElement`；`screenOriginal` 是会调用它的栅格便捷入口。
- 浏览器输出入口：`src/design/print-pipeline/browser.ts`。提供离屏画布、像素/多边形输出、叠印、裁切和发布。
- `material-v1` 保留现有标题、色带、print field 和人像的阈值加网/转印；`polygon-v1` 保留研究圆的不规则网点。这是同一核心支持的两种版本化配方，不是要求把所有元素改成同一种点形。
- `insert` 显式保留图像源，不分色、不加网、不重新染色，也不默认增加噪声。
- 元素负责内容、原稿覆盖、构图及交互；不实现 PRNG、加网、材质转印、套准采样或 Canvas 叠印。

距离与网距使用 CSS px；栅格数组使用实际像素尺寸。`scale` 是 DPR。`mask` 为原稿覆盖范围，`tone` 为已经包含覆盖率的墨量，不能再次乘 mask。透明区域与反白操作保留独立 mask。网格原点通过 `origin` 明确传入。

## 文字原稿

真实文字保留 DOM，轮廓不侵蚀、不模糊。`sharp-type-v3` 的 `textRecipe`（size / dotted / radius）通过公共声明入口解析：固体字只输出有界低频墨量遮罩；≥72px的网点字用 `textCoverage` 原稿检查每个完整网点的容纳范围。文字不再经过图像 `paintMaterial` 二次转印。24px以下不用材质。

```ts
import {screenOriginal,pressSettings,elementPress} from '../design/print-pipeline/index';
import {typeScreenLevel} from '../design/screen';
const level = typeScreenLevel(fontSize);
// level === null 时保持现有单墨实字，不创建网点遮罩。
if (level) {
  const press = elementPress(pressSettings(settings, level, fontSize), id, 'title', fontSize);
  const tone = new Float32Array(width * height).fill(coverage);
  const printed = screenOriginal(id, {kind:'text', mask:tone, tone}, width, height, 'b', press, dpr, origin, false, {size:fontSize,dotted:fontSize>=72,radius:.30});
  // 文字输出直接作为 alpha 经 pixelSurface 挂载；不再叠加图像转印。
  // 完整在用例子：src/client/print-material.ts 的 textureMask。
}
```

遮罩缓存必须包含实际字号、宽高、字体就绪后的测量、DPR、网格原点、seed 和全部材质参数。文字原稿等待字体就绪后重测；等待期间保留现有文字。

## 几何原稿

SVG/程序生成适配器提供形状及色调，不提供加网算法。

```ts
import {definePrintElement,screenPrintElement} from '../design/print-pipeline/index';
const element = definePrintElement({
  id:'example-shape', profile:'polygon-v1', width, height, seed,
  plate:'blue',
  source:{kind:'procedural', sample:(x,y)=>({
    shape:circleCoverage(x,y), focus:radialTone(x,y),
  })},
  screen:resolvedPolygonRecipe,
});
const dots = screenPrintElement(element);
// polygonSurface(dots, resolvedInkColor, width, height, dpr)
// → compositeCanvas(...): 共享套准和叠印，不在元素内 drawImage/multiply。
```

完整在用例子：`src/design/research-render.ts` 只声明几何原稿、参数和状态；`src/client/research-map.ts` 保留链接、动画时序和调试锚点。SVG 原稿可以使用 `svgCoverage` 后经 `makeToneField` / `screenOriginal`；同一个几何不应无故切换已批准的加网配方。

线条类不另写噪声：直线分隔线用 `rule-v1`（`client/print-guides.ts`）；地铁式引导线由 `route.ts` 只提供几何覆盖率，作为 `MaskJob.route` 交给与色带相同的平面加网与转印（`client/print-routes.ts`）。

## 照片原稿

```ts
import {darkness,screenOriginal} from '../design/print-pipeline/index';
const original = darkness(rgba, true); // 当前批准的百分位色阶与曲线
const screened = screenOriginal('example-photo', {
  kind:'photo', mask:original.mask, tone:original.tone,
}, width, height, 'b', resolvedPress, dpr, origin);
```

单墨照片需要保住暖色主体轮廓时（如 About 的拱门），用 `separateSubject`（`photo-subject-v1`）代替 `darkness`，并可乘以 `raggedFrame` 的手工上墨边；完整例子是 `scripts/render-about-photo.mjs`。

真实照片和几何背景分别适配、分版，再合成；不能把几何球面色调应用到照片上。现有裁切、色阶和分色公式不变。完整例子是 `composition-canvas.ts` 与 `scripts/render-portrait-composition.mjs`，二者使用相同核心；浏览器和 sharp 的源图采样是明确的环境适配差异，不能声称两者逐像素相同。

## 原色图像 / 插页

```ts
import {definePrintElement,screenPrintElement} from '../design/print-pipeline/index';
const src = screenPrintElement(definePrintElement({
  id:'artifact-preview', profile:'insert',
  source:{kind:'graphic', src:'/images/print-lab-layout.png'},
}));
// 作为真实 <img src={src} alt="..."> 挂载；原色、原文件和浏览器图片加载机制保留。
```

插页的摆放（如 Print Labs 的样张叠放，`insert-stack.ts`）属于布局，不修改图像像素；胶带已移除。需要新图像分色算法时，在核心增添受测配方，不能把 Bayer/FM 当成颜色量化。

## 输出、缓存与失败

每个可替换输出使用 `createPrintMount()`。`begin(key)` 返回本次票据；重复已完成 key 不重绘。异步工作完成后检查 `ticket.current()`，最后 `ticket.commit(publish)`。最新请求使旧票据失效，即使最新请求命中缓存；失败不记入成功缓存，允许重试。

先用 `pixelSurface` / `polygonSurface` 完整准备，再用 `publishCanvas` 替换。不得先清空可见 Canvas，不提前隐藏后备图，不自动淡入。照片原稿在图片加载后提交，字形相关工作在字体就绪后重测。尺寸观察、区域导航和用户交互由宿主保留；不要把所有元素绑到同一种刷新时序。

## 新印版与验证

核心 `Press<PlateId>`、`PrintPlate<PlateId>` 和调色表支持 N 块命名版。角度、点形、套准、颜色从已解析配方传入；不要在组件中写死墨色。旧 `a/b` 套准行为保留为兼容规则，新版使用明确的 `registration`。`polygon-v1` 仿射变换通过核心 `registeredPlates` 与 Canvas 后端完成。

执行 `npm test`、`npm run check`、`npm run build`。固定基准在 `tests/fixtures/print-baseline-a7a7483.json`，覆盖 44 个源输出指纹；禁止为让测试通过而重录基准。视觉变化获批后才增加新的版本化基准。浏览器还要检查 1440/768/375/320、交互、分版、设计台一致性。

边界测试使用 AST 记录仍待处理的旧路径/原稿适配器；允许清单只能缩小，扩展须说明原稿适配需要，不能掩护新渲染旁路。当前仍保留旧 `print.ts`、portrait-flow 的历史兼容实现，不要给它们增加新调用。下一阶段清理前先确认构建脚本、无 JS 后备和历史测试的依赖。

## 页面纸张坐标

活动网页适配器在完成排版测量后调用 `onSheet(press, resolve(config).values.seed, paperOrigin(element,page), page.offsetHeight)`，并把同一 origin 用于加网。该绑定让共享材质采用矩形硬边路径，不再以元素ID改变纸张场。`paperOrigin` 会还原设计台的显示缩放。不要把此绑定用于需要复现旧指纹的迁移基准。

文字的 `print-type-v4` 读取这张场上与图像相同的转印（低频缺墨、细颗粒减墨、滚筒），总减墨受 15%/12% 上限保护；正文不加材质。研究圆的多边形配方通过可选 sheet 参数读取同一纸张场。滚筒场是周长 1440 CSS px、20 段的固定滚筒，按纸面 Y 往返延续，与页面长度无关；正文仍不参与。人像、研究圆、几何插图的静态后备使用相同核心和固定参考纸张坐标，响应式运行时按实际布局重新生成。全局纸纹与墨层的进一步物理交互仍未实现。原版对照的覆盖范围见 `tests/sheet-material.test.mjs`，不能把有限阶段一致扩大为完整渲染一致。

## 分色与静态输出

`separateOriginal` 是分色入口。照片继续选择 `photo-percentile-v1`，几何选择 `shape-alpha-v1`；`separatePrintLab` 提供原版 mono/sep/duo/tri 的黑白场、gamma、色阶、对比度与 gain。原版配方已在分色时应用 gain，后续加网不得重复应用。选定照片配方仍在加网阶段使用其原有 gain。

人像浏览器和构建端共用 `preparePortraitOriginals` / `paintPortraitOriginals`；几何插图共用 `renderFieldOriginals`；研究圆共用 polygon 配方。Canvas 与 sharp 只负责原稿采样和输出。静态参考纸张高度为1440 CSS px，尺寸与位置由构建适配器明确指定，不宣称与任意响应式页面逐像素一致。文字后备保留可读 DOM。SVG 墨纹滤镜及 InkDefs 已删除。

测试覆盖完整四种原版分色的逐值比较、无噪声合成误差≤1、滚筒裁切连续性、关闭参数和构建/浏览器共用入口。整页新纸张噪声与原版局部随机域不同，不以整页零差作为验收。

## 姓名视觉快照

`tests/fixtures/name-v3.png` 是 0.37 半径、无网点噪声、.5px 套准方案的旧候选快照。2026-10-14 用户要求姓名网点加噪声和偏移后，当前页面与它不一致是预期结果；新快照须经用户认可后再替换。1440×1000、DPR1、默认已保存配置、Home顶部、字体和材质完成后截图。执行 `npm run test:name-visual -- /absolute/path/to/home.png`；裁切姓名区域，单通道差异超过20的像素占比不得超过0.5%。失败保存实际裁切到 `/tmp/name-visual-actual.png`。不得自动更新基准；确认视觉变更后才手动替换 PNG 和配方说明。

此命令消费真实浏览器截图，不会自行启动浏览器；每次改文字渲染或CSS都必须另行捕获当前页面再运行。`npm test` 保证网点无随机缺失、硬边、边缘裁切以及文字墨量上限，但不能替代浏览器快照。

导航线条网使用 `line-v3`，经 `definePrintElement` / `screenPrintElement` 输出矢量 SVG。pitch、angle 读取共享 screen 配方，颜色继承朱红 token；coverage 控制线宽，不用透明度。当前仅用于研究子导航的单个移动指示块，不改变其他元素的点形。

研究子导航线网按用户参考图使用近水平斜线、粗细起伏、硬边毛刺和局部断墨；复用共享 noise 的 seed、grain 与 starvation 参数。线网以一个 medium 单元为一个周期，不改照片和字形的网点频率。

## 阶段命名与兼容入口（2026-10-16）

- `composePlateCoverage`：原稿版面运算（挖空、陷印、交并），输出覆盖量，不处理油墨颜色；`compose` 仅为兼容别名。
- `prepareSheetTransfer`：生成纸面着墨强度采样器，负责缺墨、颗粒和滚筒减墨，不处理形状或 RGB。
- `compositeRasterPlates`：使用覆盖量、着墨采样器、套准与墨色执行最终合成，不生成噪声。
- `renderSheet`：组合上述着墨与合成阶段。`paintSheet` 为兼容别名；`paintMaterial` 是兼容的整段渲染入口，并不是单独的着墨阶段。非 sheet 的历史配方保持原样。
- Canvas 版参数 `inkStrength` 是均匀油墨强度，不是一个 Transfer 模块。旧 `transfer` 属性暂时兼容；新调用使用 `inkStrength`。文字仍使用自身有上限的 transfer 配方，不能为了统一名字重复施加一次。
- `line-v3` 的 line / wave / knurl 是加网几何，不是滚筒条纹。原配方的波形、线宽起伏、毛边、断墨与随机序列保留；移除外围随机多边形 mask。SVG 自身的矩形承载边界仍存在，不另造破边轮廓。

此次不调整参数或重排浮点运算；固定最新主分支的像素指纹覆盖精确/快速路径和 DPR 1/2，线网仅允许移除外围裁切，内部 path 指纹保持一致。
