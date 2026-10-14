import fs from 'node:fs/promises';
// Preserve already-public downloads and the existing Print Labs redirects.
// This never reads the private CV master or local planning documents.
await fs.cp('assets/pdf','dist/assets/pdf',{recursive:true});
await fs.cp('print-lab','dist/print-lab',{recursive:true});
await fs.writeFile('dist/.nojekyll','');
await fs.cp('licenses','dist/licenses',{recursive:true});
await fs.copyFile('LICENSE','dist/LICENSE');
const redirects={publications:'research',projects:'artifacts',repositories:'artifacts',cv:'about'};
for(const [route,target] of Object.entries(redirects)){
 const href=`https://gengyuanmax.github.io/#${target}`;
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gengyuan Zhang</title><meta name="robots" content="noindex"><link rel="canonical" href="${href}"><meta http-equiv="refresh" content="0;url=${href}"><script>location.replace(${JSON.stringify(href)});</script></head><body><a href="${href}">Gengyuan Zhang</a></body></html>`;
 await fs.mkdir(`dist/${route}`,{recursive:true});
 await fs.writeFile(`dist/${route}/index.html`,html);
}
console.log('Prepared existing PDF downloads, Print Labs redirects, and four legacy page redirects.');
