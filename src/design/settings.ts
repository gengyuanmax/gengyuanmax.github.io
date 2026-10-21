import {selectedDirections,retiredElements} from '../config/main-version.ts';
import {screenTokens,screenScale} from './screen.ts';
import {placements} from '../config/compositions.ts';
import {printObjects,printWords,printGrounds} from '../config/print-objects.ts';
import {selectedComposition} from '../config/portrait-composition.ts';
import {operations} from './element-composition.ts';
import {emphasisMaterial} from './emphasis.ts';
import {dotPlateImage,groundFirstCoverage} from './print-pipeline/first-frame.ts';
export type Scope = 'global' | 'area' | 'element';
export type Parameter = { label: string; group: string; scopes: readonly Scope[]; css?: string } & (
  { type: 'number'; default: number; min: number; max: number; step: number; unit?: string } |
  { type: 'select'; default: string; options: Record<string, string> }
);
const all: readonly Scope[] = ['global', 'area', 'element'];
const globalOnly: readonly Scope[] = ['global'];
export const palettes = {
  blueVermilion: { label: '蓝 / 朱红', yellow:'#dfba29', paper: '#f0ebdf', text: '#242921', muted: '#62665a', rule: '#b9b8aa', primary: '#283eb5', secondary: '#cf5037' },
  pinkBlue: { label: '荧光粉 / 蓝', yellow:'#dfba29', paper: '#f3f1e9', text: '#20212a', muted: '#626370', rule: '#bdbdc2', primary: '#173d9a', secondary: '#e341a1' },
  blackRed: { label: '黑 / 红', yellow:'#dfba29', paper: '#f0eee7', text: '#232323', muted: '#63605b', rule: '#bab6ae', primary: '#292927', secondary: '#b7392f' },
};
export const paletteRoles = { yellow:'黄色版 · 研究圆', paper:'纸色', text:'正文墨色', muted:'次要文字', rule:'分隔线', primary:'主墨色', secondary:'第二墨色' };
export type PaletteRole=keyof typeof paletteRoles;
export type InkPalette=Record<PaletteRole,string>;
export const fontFamilies = {
  bricolage: '"Bricolage Grotesque", "PingFang SC", sans-serif',
  instrument: '"Instrument Serif", "Songti SC", serif',
  newsreader: '"Newsreader", "Songti SC", Georgia, serif',
  inter: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
  jetbrains: '"JetBrains Mono", "PingFang SC", monospace',
};
export const parameters = {
  researchSeed:{label:'研究圆 · 种子（0 = 今日日期）',group:'构图',type:'number',default:0,min:0,max:99999999,step:1,scopes:globalOnly},
  researchDropout:{label:'研究圆 · 掉点阈值',group:'构图',type:'number',default:.06,min:0,max:.15,step:.01,scopes:globalOnly},
  researchDotGain:{label:'研究圆 · 网点扩大',group:'构图',type:'number',default:1.12,min:1,max:1.3,step:.01,scopes:globalOnly},
  researchInkNoise:{label:'研究圆 · 墨量起伏',group:'构图',type:'number',default:.15,min:0,max:.15,step:.01,scopes:globalOnly},
  researchFeedNoise:{label:'研究圆 · 走纸浅带',group:'构图',type:'number',default:.2,min:0,max:.2,step:.01,scopes:globalOnly},
  researchFiberNoise:{label:'研究圆 · 纸纤维减墨',group:'构图',type:'number',default:.065,min:0,max:.08,step:.005,scopes:globalOnly},

  researchStagger:{label:'研究圆 · 上下偏移',group:'构图',type:'number',default:18,min:-30,max:30,step:2,scopes:globalOnly},
  researchOperation:{label:'研究圆 · 元素操作',group:'构图',type:'select',default:'over',options:{over:'叠印'},scopes:globalOnly},

  researchPitch:{label:'研究圆 · 可见网点网距',group:'构图',type:'number',default:7,min:6,max:8,step:1,scopes:globalOnly},

  researchView:{label:'研究关系 · 树 / 叠印圆',group:'构图',type:'select',default:'circles',options:{tree:'树 · 对照',circles:'三色叠印圆'},scopes:globalOnly},
  researchRatio:{label:'研究圆 · 水平间距 / 半径',group:'构图',type:'number',default:1.33,min:.55,max:1.4,step:.01,scopes:globalOnly},
  researchCoverage:{label:'研究圆 · 网点覆盖率',group:'构图',type:'number',default:.45,min:.4,max:.5,step:.01,scopes:globalOnly},
  researchAnchors:{label:'研究圆 · 区域锚点',group:'构图',type:'select',default:'off',options:{off:'隐藏',on:'显示'},scopes:globalOnly},
  yellowAngle:{label:'黄色版 · 网角',group:'印刷墨层',type:'number',default:0,min:0,max:180,step:1,scopes:globalOnly},
  yellowX:{label:'黄色版 · 错版 X',group:'印刷墨层',type:'number',default:-1,min:-2,max:2,step:.5,scopes:globalOnly},
  yellowY:{label:'黄色版 · 错版 Y',group:'印刷墨层',type:'number',default:1.5,min:-2,max:2,step:.5,scopes:globalOnly},

  homeDividerStyle:{label:'首页分隔处理',group:'构图',type:'select',default:'print',options:{print:'双墨章节线 + News 细网过渡',plain:'原细线 · 对照'},scopes:['global','area']},
  dividerMotion:{label:'分隔印出动态 · 全局',group:'构图',type:'select',default:'once',options:{once:'首次进入视口印出',none:'静态'},scopes:globalOnly},
  homeDividerCoverage:{label:'News 过渡带墨量',group:'构图',type:'number',default:.18,min:.08,max:.3,step:.01,scopes:['global','area']},
  homeSectionGap:{label:'个人信息 / 品牌间距',group:'构图',type:'number',default:56,min:32,max:104,step:8,unit:'px',scopes:['global','area'],css:'--home-section-gap'},
  homeBrandSize:{label:'品牌字号',group:'构图',type:'number',default:56,min:36,max:68,step:4,unit:'px',scopes:['global','area'],css:'--home-brand-size'},
  emphasisPitch:{label:'正文强调网距',group:'正文强调',type:'number',default:2,min:2,max:4,step:.25,unit:'px',scopes:['global','area']},
  emphasisCoverage:{label:'正文强调网点覆盖率',group:'正文强调',type:'number',default:.5,min:.2,max:.6,step:.01,scopes:['global','area']},
  emphasisOffset:{label:'正文强调网点带右下偏移',group:'正文强调',type:'number',default:1.5,min:1,max:2,step:.5,unit:'px',scopes:['global','area'],css:'--emphasis-offset'},
  toneLight:{label:'统一光源方向 · 225° 为左上',group:'加网前影调',type:'number',default:225,min:0,max:359,step:1,unit:'°',scopes:globalOnly},
  toneNoise:{label:'影调低频起伏 · 正负幅度',group:'加网前影调',type:'number',default:.065,min:.02,max:.08,step:.005,scopes:all},
  toneNoiseScale:{label:'影调起伏尺度',group:'加网前影调',type:'number',default:140,min:80,max:200,step:10,unit:'px',scopes:all},
  toneDirection:{label:'平面方向性 · 克制渐变',group:'加网前影调',type:'number',default:.45,min:.1,max:1,step:.05,scopes:all},
  tonePlaneMin:{label:'平面最少墨量',group:'加网前影调',type:'number',default:.7,min:.55,max:.8,step:.01,scopes:all},
  tonePlaneMax:{label:'平面最多墨量',group:'加网前影调',type:'number',default:.95,min:.85,max:.97,step:.01,scopes:all},
  toneSphereMin:{label:'球面亮部墨量',group:'加网前影调',type:'number',default:.3,min:.15,max:.5,step:.01,scopes:all},
  toneSphereMax:{label:'球面暗部墨量',group:'加网前影调',type:'number',default:.95,min:.7,max:.97,step:.01,scopes:all},
  screenPitch:{label:'旧网距 · 兼容导入',group:'印刷墨层',type:'number',default:3,min:1.5,max:8,step:.25,unit:'px',scopes:globalOnly},
  primaryDotShape:{label:'蓝版网点形状 · 全页',group:'印刷墨层',type:'select',default:'round',options:{round:'圆点',square:'方点'},scopes:globalOnly},
  secondaryDotShape:{label:'朱红版网点形状 · 全页',group:'印刷墨层',type:'select',default:'round',options:{round:'圆点',square:'方点'},scopes:globalOnly},
  primaryAngle:{label:'主墨网角 · 蓝版',group:'印刷墨层',type:'number',default:75,min:0,max:90,step:1,unit:'°',scopes:globalOnly},
  secondaryAngle:{label:'第二墨网角 · 朱红版',group:'印刷墨层',type:'number',default:15,min:0,max:90,step:1,unit:'°',scopes:globalOnly},
  grainSize:{label:'颗粒直径 · 另受网距 30% 限制',group:'印刷墨层',type:'number',default:1.5,min:1,max:2,step:.25,unit:'设备 px',scopes:all},
  inkEdge:{label:'转印扩墨（全局暂时关闭）',group:'印刷墨层',type:'number',default:.15,min:0,max:.5,step:.05,unit:'px',scopes:all},
  compositionOperation:{label:'人像与底形的组合',group:'人像组合',type:'select',default:selectedComposition.selection.op,options:operations,scopes:all},
  compositionShape:{label:'几何底形',group:'人像组合',type:'select',default:selectedComposition.selection.shape,options:{circle:'圆形',triangle:'三角形'},scopes:all},
  compositionPitch:{label:'人像网距 · 640px 参考画幅',group:'人像组合',type:'number',default:selectedComposition.selection.pitch,min:3,max:12,step:.5,unit:'px',scopes:all},
  compositionMis:{label:'组合错位 · 实验室单位',group:'人像组合',type:'number',default:selectedComposition.selection.mis,min:0,max:2,step:.25,unit:'mm',scopes:all},
  readingGuide: {label:'作品阅读引导',group:'几何',type:'select',default:'line',options:{line:'页边连线与编号',marks:'仅保留编号',none:'隐藏引导'},scopes:['global','area']},
  readingWeight: {label:'阅读引导线宽',group:'几何',type:'number',default:1.5,min:1.5,max:3,step:.5,unit:'px',scopes:['global','area'],css:'--reading-weight'},
  readingInk: {label:'阅读引导用墨',group:'几何',type:'select',default:'primary',options:{primary:'主墨',secondary:'第二墨'},scopes:['global','area']},
  groundInk: {label:'底形用墨',group:'模块底形',type:'select',default:'primary',options:{primary:'主墨',secondary:'第二墨'},scopes:all},
  groundOpacity: {label:'底形不透明度',group:'模块底形',type:'number',default:.07,min:0,max:1,step:.01,scopes:all,css:'--ground-opacity'},
  groundWidth: {label:'底形宽度 · 相对模块',group:'模块底形',type:'number',default:96,min:10,max:100,step:1,unit:'%',scopes:all,css:'--ground-width'},
  groundBleed: {label:'底形向左出血',group:'模块底形',type:'number',default:12,min:0,max:20,step:2,unit:'px',scopes:all,css:'--ground-bleed'},
  groundEdge: {label:'底形下沿',group:'模块底形',type:'select',default:'screened',options:{screened:'网点收尾',cut:'直切'},scopes:all},
  fieldCoverage: {label:'几何影调密度 · 0.42 为基准',group:'元素印刷',type:'number',default:.42,min:0,max:.75,step:.01,scopes:all},
  fieldPitch: {label:'色域网距 · 360px 参考画幅',group:'元素印刷',type:'number',default:6,min:3,max:14,step:.5,unit:'px',scopes:all},
  fieldAngle: {label:'色域网角',group:'元素印刷',type:'number',default:15,min:0,max:90,step:1,unit:'°',scopes:all},
  fieldOverlap: {label:'主体与底形的交叠',group:'元素印刷',type:'number',default:.4,min:0,max:1,step:.05,scopes:all},
  fieldScale: {label:'底形在元素内的尺度',group:'元素印刷',type:'number',default:1,min:.65,max:1.25,step:.05,scopes:all,css:'--field-scale'},
  spreadBleed: {label:'墨版向页边出血',group:'构图',type:'number',default:1,min:0,max:1,step:.1,scopes:['global','area'],css:'--spread-bleed'},
  portraitTilt: {label:'人像轻微倾斜',group:'构图',type:'number',default:0,min:-3,max:3,step:.5,unit:'deg',scopes:all,css:'--portrait-tilt'},
  navigationStyle: {label:'导航编排',group:'构图',type:'select',default:'swiss',options:{swiss:'A · Swiss 印刷索引',riso:'B · Riso 色块',thumb:'C · 书边拇指索引'},scopes:globalOnly},
  homeComposition: {label:'首页姓名与人像构图',group:'构图',type:'select',default:'open',options:{open:'01 · 舒展留白',interlock:'02 · 姓名与人像咬合'},scopes:['global','area']},
  homeScale: {label:'首页姓名与人像比例 · 桌面',group:'构图',type:'number',default:1,min:.7,max:1,step:.01,scopes:['global','area'],css:'--home-scale'},
  palette: { label: '纸色与墨色', group: '全局风格', type: 'select', default: 'blueVermilion', options: Object.fromEntries(Object.entries(palettes).map(([id, p]) => [id, p.label])), scopes: all },
  displayFont: { label: '展示字体', group: '字体', type: 'select', default: 'bricolage', options: { bricolage: 'Bricolage Grotesque', instrument: 'Instrument Serif' }, scopes: globalOnly },
  bodyFont: { label: '正文字体', group: '字体', type: 'select', default: 'inter', options: { newsreader: 'Newsreader · Editorial', inter: 'Inter · Sans' }, scopes: globalOnly },
  emphasisFont: {label:'正文强调字体',group:'字体',type:'select',default:'bricolage',options:{bricolage:'Bricolage Grotesque',newsreader:'Newsreader',inter:'Inter'},scopes:globalOnly},
  emphasisWeight: {label:'正文强调字重',group:'字体',type:'number',default:550,min:450,max:650,step:50,scopes:['global','area'],css:'--emphasis-weight'},
  emphasisScale: {label:'正文强调相对字号',group:'字体',type:'number',default:.94,min:.85,max:1,step:.01,scopes:['global','area'],css:'--emphasis-scale'},
  metadataFont: { label: '标签字体', group: '字体', type: 'select', default: 'jetbrains', options: { jetbrains: 'JetBrains Mono' }, scopes: globalOnly },
  displayScale: { label: '标题比例', group: '字体', type: 'number', default: 1, min: .85, max: 1.12, step: .01, scopes: all, css: '--display-scale' },
  bodySize: { label: '正文大小', group: '字体', type: 'number', default: 16, min: 16, max: 20, step: 1, unit: 'px', scopes: globalOnly, css: '--body-size' },
  gutter: { label: '列间距', group: '网格', type: 'number', default: 20, min: 12, max: 28, step: 1, unit: 'px', scopes: globalOnly, css: '--column-gap' },
  pageGutter: { label: '页面留白上限', group: '网格', type: 'number', default: 56, min: 32, max: 72, step: 2, unit: 'px', scopes: globalOnly, css: '--page-gutter-max' },
  geometrySize: { label: '导航编号大小', group: '几何', type: 'number', default: 27, min: 20, max: 32, step: 1, unit: 'px', scopes: all, css: '--geometry-size' },
  geometryStroke: { label: '几何线宽', group: '几何', type: 'number', default: 2, min: 1, max: 4, step: .5, unit: 'px', scopes: all, css: '--geometry-stroke' },
  cueStyle: { label: '图像到 News 的衔接', group: '几何', type: 'select', default: 'ink', options: { portrait:'人物 / 底版 AM 网格 · 旧版对照', ink: '色块延续', dots: '独立点阵 · 旧版对照' }, scopes: all },
  cueEdgeDensity: {label:'人物下沿的剩余墨量',group:'几何',type:'number',default:.22,min:.08,max:.5,step:.02,scopes:all},
  cueCurveDepth: {label:'衔接弧线下探 · 屏幕 px',group:'几何',type:'number',default:45,min:20,max:80,step:5,scopes:all},
  cueTailWidth: {label:'拖尾收束宽度 · 相对人像',group:'几何',type:'number',default:.35,min:.25,max:.6,step:.01,scopes:all},
  cuePhotoStart: {label:'人物与底版开始散开的高度',group:'几何',type:'number',default:.82,min:.72,max:.9,step:.01,scopes:all},
  cuePhotoPitch: {label:'照片起始网距 · 屏幕 px',group:'几何',type:'number',default:1.8,min:1,max:3,step:.1,scopes:all},
  cueTailPitch: {label:'拖尾末端网距 · 屏幕 px',group:'几何',type:'number',default:6.5,min:4,max:10,step:.5,scopes:all},
  cuePhotoAngle: {label:'照片与拖尾的共同网角',group:'几何',type:'number',default:15,min:15,max:75,step:5,unit:'°',scopes:all},
  cueGrowth: {label:'前 20% 路径网点半径增幅',group:'几何',type:'number',default:2.25,min:2,max:2.5,step:.05,scopes:all},
  pressBlack: {label:'照片黑场',group:'图像与加网',type:'number',default:.09,min:.08,max:.1,step:.01,scopes:all},
  pressWhite: {label:'照片白场',group:'图像与加网',type:'number',default:.91,min:.9,max:.92,step:.01,scopes:all},
  pressLevels: {label:'影调级数',group:'图像与加网',type:'number',default:4,min:3,max:6,step:1,scopes:all},
  pressBlueAngle: {label:'深蓝版网角',group:'图像与加网',type:'number',default:75,min:60,max:90,step:1,unit:'°',scopes:all},
  pressGrain: {label:'细颗粒影响面积 · 仅变浅',group:'图像与加网',type:'number',default:.03,min:0,max:.04,step:.005,scopes:all},
  cueThickness: { label: '衔接色带宽度', group: '几何', type: 'number', default: 18, min: 8, max: 28, step: 1, unit: 'px', scopes: all, css: '--cue-thickness' },
  cueReach: { label: '衔接纵向区域占比', group: '几何', type: 'number', default: 28, min: 20, max: 40, step: 1, unit: '%', scopes: all, css: '--cue-reach' },
  cueDot: { label: '装饰点半径', group: '几何', type: 'number', default: 1.7, min: 1, max: 2.5, step: .1, unit: 'px', scopes: all, css: '--cue-dot' },
  cuePitch: { label: '装饰点间距', group: '几何', type: 'number', default: 6, min: 5, max: 12, step: 1, unit: 'px', scopes: all, css: '--cue-pitch' },
  printMethod: { label: '加网方式', group: '图像与加网', type: 'select', default: 'am', options: { am: 'AM 网点', lines: '线条网', hatch:'交叉排线', benday:'Ben-Day', bayer:'有序抖动', fs:'误差扩散', fm:'FM 调频网', threshold:'阈值位图' }, scopes: all },
  inkMode: { label: '油墨组合', group: '图像与加网', type: 'select', default: 'separated', options: { separated:'双色分版叠印', two: '灰度双色调', one: '单色' }, scopes: all },
  printPitch: { label: '网点间距', group: '图像与加网', type: 'number', default: 6, min: 3, max: 12, step: .5, unit: 'px', scopes: all },
  printAngle: { label: '网角', group: '图像与加网', type: 'number', default: 15, min: 0, max: 90, step: 1, unit: '°', scopes: all },
  contrast: { label: '图像对比度', group: '图像与加网', type: 'number', default: 1.15, min: .6, max: 1.8, step: .05, scopes: all },
  registration: { label: '套色错位 X', group: '印刷墨层', type: 'number', default: 2, min: -3, max: 3, step: .5, unit: 'px', scopes: all, css:'--registration-x' },
  grain: { label: '图形颗粒最大减墨', group: '印刷墨层', type: 'number', default: .12, min: 0, max: .12, step: .01, scopes: all },
  seed: { label: '颗粒种子', group: '印刷墨层', type: 'number', default: 23, min: 0, max: 9999, step: 1, scopes: all },
  edgeFade: { label: '边缘淡出', group: '图像与加网', type: 'number', default: 0, min: 0, max: .3, step: .01, scopes: all },
  imageZoom: { label: '裁切放大', group: '图像与加网', type: 'number', default: 1, min: 1, max: 1.8, step: .05, scopes: all },
  imageX: { label: '裁切横向焦点', group: '图像与加网', type: 'number', default: .5, min: 0, max: 1, step: .05, scopes: all },
  imageY: { label: '裁切纵向焦点', group: '图像与加网', type: 'number', default: .6, min: 0, max: 1, step: .05, scopes: all },
  baseline: {label:'垂直间距基准',group:'网格',type:'number',default:8,min:6,max:12,step:1,unit:'px',scopes:globalOnly,css:'--baseline'},
  whitespace: {label:'分区留白倍率',group:'构图',type:'number',default:1,min:.75,max:1.5,step:.05,scopes:['global','area'],css:'--whitespace'},
  rhythm: {label:'编排节奏',group:'构图',type:'select',default:'editorial',options:{editorial:'跨栏与错落',aligned:'收敛对齐'},scopes:['global','area']},
  titleWeight: {label:'展示字重',group:'字体',type:'number',default:750,min:400,max:800,step:50,scopes:all,css:'--title-weight'},
  titleWidth: {label:'展示字宽 · Bricolage',group:'字体',type:'number',default:100,min:75,max:100,step:1,scopes:all,css:'--title-width'},
  titleLeading: {label:'展示行距',group:'字体',type:'number',default:.94,min:.9,max:1.15,step:.01,scopes:all,css:'--title-leading'},
  titleTracking: {label:'展示字距',group:'字体',type:'number',default:-.05,min:-.06,max:.02,step:.005,unit:'em',scopes:all,css:'--title-tracking'},
  bodyMeasure: {label:'正文行宽上限',group:'字体',type:'number',default:52,min:32,max:72,step:1,unit:'ch',scopes:['global','area'],css:'--body-measure'},
  titleTreatment: {label:'展示字处理',group:'印刷墨层',type:'select',default:'overprint',options:{solid:'实心墨色',overprint:'双色错位叠印',outline:'轮廓与实心',dotted:'实色字 + 字级 AM 网点'},scopes:all},
  titleDotPitch: {label:'字内装饰网距 · 相对字号',group:'印刷墨层',type:'number',default:screenScale.coarseEm,min:.015,max:.16,step:.005,unit:'em',scopes:all,css:'--title-dot-pitch'},
  titleDotRadius: {label:'字内圆点半径 · 相对网距',group:'印刷墨层',type:'number',default:.37,min:.25,max:.38,step:.01,scopes:all,css:'--title-dot-radius'},
  titleLayerX: {label:'网点字形横向错开 · 相对字号',group:'印刷墨层',type:'number',default:-.075,min:-.12,max:.12,step:.005,unit:'em',scopes:all,css:'--title-layer-x'},
  titleLayerY: {label:'网点字形纵向错开 · 相对字号',group:'印刷墨层',type:'number',default:-.06,min:-.12,max:.12,step:.005,unit:'em',scopes:all,css:'--title-layer-y'},
  registrationY: {label:'套色错位 Y',group:'印刷墨层',type:'number',default:1,min:-3,max:3,step:.5,unit:'px',scopes:all,css:'--registration-y'},
  blend: {label:'油墨覆盖方式',group:'印刷墨层',type:'select',default:'multiply',options:{multiply:'透明叠印',normal:'不透明遮盖'},scopes:all},
  starvation: {label:'图形低频缺墨',group:'印刷墨层',type:'number',default:.12,min:0,max:.15,step:.01,scopes:all},
  banding: {label:'滚筒墨量变化',group:'图像与加网',type:'number',default:.08,min:0,max:.1,step:.01,scopes:all},
  paperTexture: {label:'共享纸纹',group:'纸张',type:'number',default:.08,min:0,max:.1,step:.005,scopes:globalOnly,css:'--paper-texture'},
  dotShape: {label:'网点形状 · AM / Ben-Day',group:'图像与加网',type:'select',default:'round',options:{round:'圆形',ellipse:'椭圆',diamond:'菱形',square:'方形'},scopes:all},
  dotGain: {label:'中间调网点增益',group:'图像与加网',type:'number',default:0,min:0,max:.4,step:.05,scopes:all},
  imageMask: {label:'图像外形（不等于去背）',group:'图像与加网',type:'select',default:'arch',options:{source:'保留源图边界 / 透明通道',arch:'拱形裁片',oval:'椭圆裁片'},scopes:all},
  portraitMaterial: {label:'人像素材',group:'图像与加网',type:'select',default:'cutout',options:{composition:'已选配方 · 人像与几何叠印',press:'旧版 · 双版照片与拖尾',cutout:'旧版抠图 + Riso 成品',recipe:'原图 · 可调加网方案'},scopes:all},
  portraitOverlap: {label:'人像向标题延伸 · 桌面',group:'构图',type:'number',default:1,min:0,max:1,step:.25,scopes:['global','area'],css:'--portrait-overlap'},
  cueMotion: {label:'网点引导动态',group:'几何',type:'select',default:'none',options:{none:'保持静态',reveal:'进入视野时渐显一次'},scopes:all},
  cueDuration: {label:'网点渐显时长',group:'几何',type:'number',default:800,min:300,max:1200,step:50,unit:'ms',scopes:all,css:'--cue-duration'},
  tabLift: {label:'导航纸签层次',group:'纸张',type:'number',default:2,min:0,max:4,step:.5,unit:'px',scopes:all,css:'--tab-lift'},
  edgeDepth: {label:'页面边缘材质宽度',group:'纸张',type:'number',default:16,min:0,max:22,step:1,unit:'px',scopes:['global','area'],css:'--edge-depth'},
  portraitSpan: {label:'首页人像占栏',group:'构图',type:'number',default:4,min:3,max:5,step:1,scopes:['global','area'],css:'--portrait-span'},
  nameIndent: {label:'姓名第二行缩进',group:'构图',type:'number',default:1,min:0,max:1,step:.25,scopes:['global','area'],css:'--name-indent'},
  itemStart: {label:'起始栏 · 桌面',group:'编排位置',type:'number',default:1,min:1,max:10,step:1,scopes:['element'],css:'--item-start'},
  itemSpan: {label:'占栏 · 桌面',group:'编排位置',type:'number',default:6,min:3,max:12,step:1,scopes:['element'],css:'--item-span'},
  itemOffset: {label:'向下错落 · 基准倍数',group:'编排位置',type:'number',default:0,min:0,max:12,step:1,scopes:['element'],css:'--item-offset'},
} satisfies Record<string, Parameter>;
export type Key = keyof typeof parameters;
export type Settings = { [K in Key]: (typeof parameters)[K]['type'] extends 'number' ? number : string };
export type Overrides = Partial<Settings>;
export const areaIds = ['home', 'research', 'artifacts', 'about'] as const;
export type Area = typeof areaIds[number];
export interface DesignConfig { version: 1; global: Overrides; areas: Partial<Record<Area, Overrides>>; elements: Record<string, Overrides>; palettes?:Partial<Record<keyof typeof palettes,Partial<InkPalette>>> }
export const elementAreas: Record<string, Area> = {
  ...Object.fromEntries(Object.entries({...printObjects,...printWords,...printGrounds}).map(([id,p])=>[id,p.area])),
  'home-name': 'home', 'home-portrait': 'home', 'home-bridge': 'home',
  'research-title': 'research', 'artifacts-title': 'artifacts', 'about-title': 'about',
  ...Object.fromEntries(Object.entries(placements).map(([id,p])=>[id,p.area])),
  'nav-home': 'home', 'nav-research': 'research', 'nav-artifacts': 'artifacts', 'nav-about': 'about',
};
export const defaults = Object.fromEntries(Object.entries(parameters).map(([k, p]) => [k, p.default])) as Settings;

const inkKeys=['registration','registrationY','grain','starvation','seed','blend','grainSize','inkEdge','dotGain','pressGrain'];
export function applicable(key:Key,scope:Scope,target?:string) {
  const p:Parameter=parameters[key];
  if(!p.scopes.includes(scope))return false;
  if(scope==='global')return true;
  if(scope==='area'){if(['homeSectionGap','homeBrandSize','homeDividerStyle','homeDividerCoverage'].includes(key))return target==='home';if(key.startsWith('reading'))return target==='research'||target==='artifacts';if(key==='tabLift')return false;if(p.group==='图像与加网'||p.group==='人像组合'||key.startsWith('cue')||['homeComposition','homeScale','portraitSpan','portraitOverlap','portraitTilt','nameIndent'].includes(key))return target==='home';return true;}
  if(target&&Object.hasOwn(printGrounds,target))return p.group==='模块底形'||p.group==='加网前影调'||inkKeys.includes(key)||key==='palette';
  if(target&&Object.hasOwn(printObjects,target))return p.group==='元素印刷'||p.group==='加网前影调'||inkKeys.includes(key)||key==='palette';
  if(target==='home-portrait')return key==='portraitTilt'||p.group==='图像与加网'||p.group==='人像组合'||p.group==='加网前影调'||inkKeys.includes(key)||key==='palette';
  if(target==='home-bridge')return key.startsWith('cue')||inkKeys.includes(key)||key==='palette';
  if(target?.startsWith('nav-'))return ['geometrySize','geometryStroke','paperTexture','tabLift','palette',...inkKeys].includes(key);
  if(target&&Object.hasOwn(placements,target))return p.group==='编排位置';
  return ['palette','displayScale','titleWeight','titleWidth','titleLeading','titleTracking','titleTreatment','titleDotPitch','titleDotRadius','titleLayerX','titleLayerY',...inkKeys].includes(key);
}

export function validateConfig(value: unknown): asserts value is DesignConfig {
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!object(value) || value.version !== 1 || !object(value.global) || !object(value.areas) || !object(value.elements)) throw new Error('配置结构或版本无效');
  for (const k of Object.keys(value)) if (!['version','global','areas','elements','palettes'].includes(k)) throw new Error(`未知配置字段：${k}`);
  if(value.palettes!==undefined){
    if(!object(value.palettes))throw new Error('色板配置无效');
    for(const [id,colors]of Object.entries(value.palettes)){
      if(!Object.hasOwn(palettes,id)||!object(colors))throw new Error(`未知色板：${id}`);
      for(const [role,color]of Object.entries(colors))if(!Object.hasOwn(paletteRoles,role)||typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))throw new Error(`无效颜色：${role}`);
    }
  }
  function check(v: unknown, scope: Scope,target?:string) {
    if (!object(v)) throw new Error('覆盖配置应为对象');
    for (const [k, val] of Object.entries(v)) {
      if (!Object.hasOwn(parameters, k)) throw new Error(`未知参数：${k}`);
      const p: Parameter = parameters[k as Key];
      if (!applicable(k as Key,scope,target)) throw new Error(`${p.label}不适用于当前调整范围`);
      if (p.type === 'select' ? typeof val !== 'string' || !Object.hasOwn(p.options, val) : typeof val !== 'number' || !Number.isFinite(val) || val < p.min || val > p.max) throw new Error(`参数值超出范围：${p.label}`);
    }
  }
  check(value.global, 'global');
  for (const [id, v] of Object.entries(value.areas)) { if (!(areaIds as readonly string[]).includes(id)) throw new Error(`未知页面：${id}`); check(v, 'area',id); }
  for (const [id, v] of Object.entries(value.elements)) { if (!Object.hasOwn(elementAreas, id)) throw new Error(`未知元素：${id}`); check(v, 'element',id); }
  for(const [id,p]of Object.entries(placements)){
    const o=(value.elements[id]||{}) as Overrides;
    const start=o.itemStart??p.start,span=o.itemSpan??p.span;
    if(!Number.isInteger(start)||!Number.isInteger(span)||start+span>13)throw new Error(`${id} 的占栏超出 12 栏网格`);
    for(const [other,q]of Object.entries(placements)){
      if(other<=id||p.spread!==q.spread||p.row!==q.row)continue;
      const v=(value.elements[other]||{}) as Overrides,otherStart=v.itemStart??q.start,otherSpan=v.itemSpan??q.span;
      if(start<otherStart+otherSpan&&otherStart<start+span)throw new Error(`${id} 与 ${other} 的内容占栏重叠`);
    }
  }
}
const pageLocked:Key[]=['palette','primaryAngle','secondaryAngle','primaryDotShape','secondaryDotShape','registration','registrationY','dotShape','banding'];
export function resolve(config: DesignConfig, area?: Area, element?: string) {
  const values = { ...defaults };
  const placement=element?placements[element as keyof typeof placements]:undefined;
  if(placement)Object.assign(values,{itemStart:placement.start,itemSpan:placement.span,itemOffset:placement.offset});
  const sources = Object.fromEntries(Object.keys(defaults).map(k => [k, 'default'])) as Record<Key,string>;
  const layers: [string, Overrides | undefined][] = [['global', config.global], [area ? `area:${area}` : '', area ? config.areas[area] : undefined], [element ? `element:${element}` : '', element ? config.elements[element] : undefined]];
  for (const [label, layer] of layers) if (layer) for (const key of Object.keys(layer) as Key[]) {
    if(label!=='global'&&pageLocked.includes(key))continue;
    Object.assign(values, { [key]: layer[key] }); sources[key] = label;
  }
  for(const [key,value] of Object.entries(selectedDirections)){Object.assign(values,{[key]:value});sources[key as Key]='selected';}
  return { values, sources };
}
/** Normalize old drafts without reintroducing archived directions. */
export function mainDesignConfig(input:DesignConfig):DesignConfig{
 const config=structuredClone(input);
 const obsolete=(key:string)=>key.startsWith('cue')||['portraitOverlap','portraitSpan','nameIndent','portraitTilt'].includes(key);
 for(const layer of [config.global,...Object.values(config.areas),...Object.values(config.elements)]){
  if(!layer)continue;
  for(const key of Object.keys(layer))if(obsolete(key)||key in selectedDirections)delete layer[key as Key];
 }
 Object.assign(config.global,selectedDirections);
 for(const id of retiredElements)delete config.elements[id];
 return config;
}
export function getPalette(config:DesignConfig|undefined,id:string):InkPalette {
  const p={...palettes[id as keyof typeof palettes],...config?.palettes?.[id as keyof typeof palettes]};
  // Legacy roles remain import-compatible, but cannot add a third ink.
  return {...p,text:p.primary,muted:p.primary,rule:p.primary};
}
export function cssVariables(settings: Overrides,config?:DesignConfig): Record<string,string> {
  const shared=config?resolve(config).values:defaults;
  settings={...settings};
  if(config)for(const key of pageLocked)if(key in settings)Object.assign(settings,{[key]:shared[key]});
  const css: Record<string,string> = screenTokens({...shared,...settings});
  for (const key of Object.keys(settings) as Key[]) {
    const p: Parameter = parameters[key];
    if (p.css) css[p.css] = String(settings[key]) + (p.type === 'number' ? p.unit || '' : '');
  }
  if (settings.palette) {
    const p = getPalette(config,settings.palette);
    Object.assign(css, { '--paper':p.paper,'--ink':'var(--blue-ink)','--muted-ink':'var(--blue-ink)','--rule-ink':'var(--blue-ink)','--blue-ink':p.primary,'--red-ink':p.secondary,'--media-paper':p.paper });
  }
  if(settings.palette||settings.emphasisPitch!==undefined||settings.emphasisCoverage!==undefined){
    const global=config?resolve(config).values:defaults;
    const material=emphasisMaterial(getPalette(config,settings.palette||global.palette),settings.emphasisPitch??global.emphasisPitch,settings.emphasisCoverage??global.emphasisCoverage);
    css['--emphasis-dots']=material.image;css['--emphasis-tile']=`${material.tile}px`;
  }
  // First-frame print: final geometry painted by CSS before any canvas or mask exists.
  const all={...shared,...settings} as Settings;
  if(settings.titleTreatment==='dotted')css['--dot-plate']=dotPlateImage(all.primaryAngle,all.titleDotRadius,(config?resolve(config).values:defaults).seed);
  if(settings.groundOpacity!==undefined)css['--ground-first']=groundFirstCoverage(all).toFixed(3);
  if(settings.blend)css['--ink-blend']=settings.blend;
  if(settings.itemStart!==undefined&&settings.itemSpan!==undefined)css['--item-start']=String(Math.min(settings.itemStart,13-settings.itemSpan));
  for (const [key, cssName] of [['displayFont','--display-face'],['bodyFont','--reading-face'],['emphasisFont','--emphasis-face'],['metadataFont','--metadata-face']] as const) if (settings[key]) css[cssName] = fontFamilies[settings[key] as keyof typeof fontFamilies];
  return css;
}
export function styleText(settings: Overrides,config?:DesignConfig) { return Object.entries(cssVariables(settings,config)).map(([k,v]) => `${k}:${v}`).join(';'); }

export function designAttributes(s:Settings) { return {'data-home-dividers':s.homeDividerStyle,'data-divider-motion':s.dividerMotion,'data-reading-guide':s.readingGuide,'data-reading-ink':s.readingInk,'data-ground-ink':s.groundInk,'data-ground-edge':s.groundEdge,'data-navigation':s.navigationStyle,'data-home-composition':s.homeComposition,'data-cue':s.cueStyle,'data-treatment':s.titleTreatment,'data-rhythm':s.rhythm,'data-mask':s.portraitMaterial!=='recipe'?'source':s.imageMask,'data-material':s.portraitMaterial,'data-cue-motion':s.cueMotion}; }

export function editorialBounds(config:DesignConfig,id:string){
 const p=placements[id as keyof typeof placements];if(!p)return null;
 const current=resolve(config,p.area,id).values;let left=1,right=13;
 for(const [other,q]of Object.entries(placements)){
  if(other===id||p.spread!==q.spread||p.row!==q.row)continue;
  const item=resolve(config,q.area,other).values;
  if(item.itemStart+item.itemSpan<=current.itemStart)left=Math.max(left,item.itemStart+item.itemSpan);
  if(item.itemStart>=current.itemStart+current.itemSpan)right=Math.min(right,item.itemStart);
 }
 return {startMin:left,startMax:Math.min(10,right-current.itemSpan),spanMax:right-current.itemStart};
}

export function activeParameter(key:Key,s:Settings,scope:Scope,target?:string){
 if(key in selectedDirections||key.startsWith('cue')||['portraitOverlap','portraitSpan','nameIndent','portraitTilt','homeScale'].includes(key))return false;
 if(['screenPitch','titleDotPitch','titleLayerX','titleLayerY','dotShape','emphasisPitch','emphasisCoverage','emphasisOffset'].includes(key))return false;
 if(pageLocked.includes(key)&&scope!=='global')return false;
 if(['emphasisFont','emphasisWeight','emphasisScale'].includes(key))return false; // Keep old recipes readable; body type is inherited now.
 if(['titleDotPitch','titleDotRadius','titleLayerX','titleLayerY'].includes(key))return s.titleTreatment==='dotted';
 if(key==='groundEdge')return false; // Current material pass uses straight ink fields.
 if(['compositionPitch','compositionMis','fieldPitch','fieldAngle','printPitch','printAngle','pressBlueAngle'].includes(key))return false; // Superseded by one display-space press lattice.
 if(['registration','registrationY'].includes(key)&&scope!=='global')return false;
 if(key.startsWith('composition'))return s.portraitMaterial==='composition';
 if(s.portraitMaterial==='composition'){
  if(key.startsWith('cue')||key==='portraitTilt')return false;
  if(parameters[key].group==='图像与加网'&&!['portraitMaterial','dotGain','pressGrain'].includes(key))return false;
 }
 if(s.portraitMaterial==='press'&&scope==='element'&&target==='home-bridge'&&['registration','registrationY','grain','starvation','seed','blend','palette'].includes(key))return false;
 if(s.portraitMaterial==='press'&&scope==='element'&&target==='home-portrait'&&['grain','blend'].includes(key))return false;
 if(['cuePhotoPitch','cueTailPitch','cuePhotoAngle'].includes(key))return false; // Historical recipes remain readable.
 if(key==='cueGrowth')return s.cueStyle==='portrait';
 // Retain old configuration compatibility without exposing obsolete folder-tab controls.
 if(key.startsWith('cuePhoto')||['cueTailPitch','cueCurveDepth','cueTailWidth','cueEdgeDensity'].includes(key))return s.cueStyle==='portrait';
 if(['cueDot','cuePitch','cueMotion','cueDuration','cueReach','cueThickness'].includes(key)&&s.cueStyle==='portrait')return false;
 if(key==='tabLift'||(key==='paperTexture'&&scope==='element'&&target?.startsWith('nav-')))return false;
 if(s.portraitMaterial==='press'&&['printMethod','inkMode','dotShape','edgeFade','imageZoom','imageX','imageY','imageMask','banding'].includes(key))return false;
 if(scope==='element'&&target==='home-portrait'&&s.portraitMaterial==='cutout')return key==='portraitMaterial'||key==='portraitTilt';
 return true;
}
