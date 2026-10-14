import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import type {Plugin} from 'vite';
// Previous experiments remain archived as source, but have no competing UI.
export const retiredDesignRoutes=['/design/layout/','/design/navigation/','/design/home/','/design/portrait/','/design/composition/','/design/material/','/design/emphasis/'];
export function designServer():Plugin{
 const token=crypto.randomBytes(24).toString('hex');
 const configPath=fileURLToPath(new URL('../src/config/design.json',import.meta.url));
 const pagePath=fileURLToPath(new URL('../src/authoring.html',import.meta.url));
 return {name:'local-design-desk',apply:'serve',configureServer(server){
  server.middlewares.use(async(req,res,next)=>{
   const path=req.url?.split('?')[0];
   if(path!=='/design'&&!path?.startsWith('/design/')&&path!=='/__design/config')return next();
   const host=new URL(`http://${req.headers.host||'invalid'}`).hostname;
   if(!['127.0.0.1','localhost','[::1]'].includes(host)){res.statusCode=403;return res.end('Local access only');}
   res.setHeader('Cache-Control','no-store');
   try{
    if(path==='/design'||retiredDesignRoutes.includes(path!)){
     if(req.method!=='GET'){res.statusCode=405;return res.end();}
     res.statusCode=302;res.setHeader('Location','/design/');return res.end();
    }
    if(path==='/design/'){
     if(req.method!=='GET'){res.statusCode=405;return res.end();}
     const html=(await fs.readFile(pagePath,'utf8')).replace('__DESIGN_TOKEN__',token).replace('__STUDIO_VIEW__',new URL(req.url!,'http://localhost').searchParams.get('view')==='preview'?'preview':'desk');
     res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(await server.transformIndexHtml(path,html));
    }
    if(path==='/design/content/'){
     if(req.method!=='GET'){res.statusCode=405;return res.end();}
     for(const source of ['content','publications','provenance']){
      const file=fileURLToPath(new URL(`../src/data/${source}.ts`,import.meta.url));
      for(const mod of server.moduleGraph.getModulesByFile(file)||[])server.moduleGraph.invalidateModule(mod);
     }
     const {contentReview}=await server.ssrLoadModule('/src/design/content-review.ts');
     res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(contentReview());
    }
    if(path!=='/__design/config'){res.statusCode=404;return res.end('Archived design study');}
    res.setHeader('Content-Type','application/json');
    const {validateConfig,mainDesignConfig}=await server.ssrLoadModule('/src/design/settings.ts');
    if(req.method==='GET')return res.end(JSON.stringify(mainDesignConfig(JSON.parse(await fs.readFile(configPath,'utf8')))));
    if(req.method!=='POST'){res.statusCode=405;return res.end('{}');}
    const expected=`http://${req.headers.host}`;
    if(req.headers.origin!==expected||req.headers['x-design-token']!==token||!req.headers['content-type']?.startsWith('application/json')){res.statusCode=403;return res.end(JSON.stringify({error:'仅允许本地主设计台保存配置'}));}
    let body='';for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>65536){res.statusCode=413;return res.end(JSON.stringify({error:'配置过大'}));}}
    const input=JSON.parse(body);validateConfig(input);const config=mainDesignConfig(input);validateConfig(config);
    const temp=configPath+'.'+crypto.randomBytes(6).toString('hex')+'.pending';
    await fs.writeFile(temp,JSON.stringify(config,null,2)+'\n');await fs.rename(temp,configPath);
    res.end(JSON.stringify({saved:true,config}));
   }catch(error){res.statusCode=400;res.end(JSON.stringify({error:error instanceof Error?error.message:'无法保存配置'}));}
  });
 }};
}
