// Element Lab study → responsive compositions. These are decorative print
// fields, never figures encoding research results. No new editorial copy.
export const printObjects = {
 'mark-news': {area:'home',kind:'orbit',label:'Home · News 的网点底形'},
 'mark-benchmarking': {area:'research',kind:'orbit',label:'Research · Benchmarking 章标'},
 'mark-applications': {area:'research',kind:'orbit',label:'Research · Domain 章标'},
 'mark-machines': {area:'research',kind:'orbit',label:'Research · Machines 章标'},
 'mark-mosaic': {area:'research',kind:'windows',label:'Research · Mosaic 组合'},
 'mark-avila': {area:'research',kind:'sequence',label:'Research · AViLA 组合'},
 'mark-printlab': {area:'artifacts',kind:'orbit',label:'Artifacts · Print Lab 底形'},
 'mark-paper': {area:'artifacts',kind:'windows',label:'Artifacts · Mosaic 底形'},
 'mark-wikitilo': {area:'artifacts',kind:'earth',label:'Artifacts · WikiTiLo 地球'},
 'mark-mevtr': {area:'artifacts',kind:'sequence',label:'Artifacts · MeVTR 色带'},
 'mark-about': {area:'about',kind:'orbit',label:'About · 页边底形'},
} as const;
export const printWords = {
 'word-project-a':{area:'research',label:'Research · Mosaic 标题'},
 'word-project-b':{area:'research',label:'Research · ICQ 标题'},
 'word-project-c':{area:'research',label:'Research · ReEXplore 标题'},
 'word-project-d':{area:'research',label:'Research · Surgeon 标题'},
 'word-project-e':{area:'research',label:'Research · Me-Retriever 标题'},
 'word-project-f':{area:'research',label:'Research · AViLA 标题'},
 'word-news':{area:'home',label:'Home · News 标题'},
 'word-printlab':{area:'artifacts',label:'Artifacts · Print Lab 标题'},
 'word-mosaic':{area:'artifacts',label:'Artifacts · Mosaic 标题'},
 'word-icq':{area:'artifacts',label:'Artifacts · ICQ 标题'},
 'word-wikitilo':{area:'artifacts',label:'Artifacts · WikiTiLo 标题'},
 'word-mevtr':{area:'artifacts',label:'Artifacts · MeVTR 标题'},
} as const;

// Ink fields are independent of foreground graphics and grid slots.
// Full-strength fields sit behind cutouts or knockout headings; text grounds remain optional.
export const printGrounds = {
 'plate-home':{area:'home',label:'Home · 出血墨版'},
 'plate-about':{area:'about',label:'About · 页边墨版'},
 'plate-benchmarking':{area:'research',label:'Research · Benchmarking 章题墨版'},
 'plate-applications':{area:'research',label:'Research · Domain 章题墨版'},
 'plate-publications':{area:'research',label:'Research · Publications 附录章题墨版'},
 'plate-machines':{area:'research',label:'Research · Machines 章题墨版'},
 'ground-home-role':{area:'home',label:'Home · 身份信息底形'},
 'ground-home-pillars':{area:'home',label:'Home · 研究方向索引底形'},
 'ground-about-intro':{area:'about',label:'About · 简介标题底形'},
 'ground-about-education':{area:'about',label:'About · Education 标题底形'},
 'ground-about-funding':{area:'about',label:'About · Funding 标题底形'},
 'ground-mosaic':{area:'research',label:'Research · Mosaic 浅墨底形'},
 'ground-avila':{area:'research',label:'Research · AViLA 浅墨底形'},
} as const;
