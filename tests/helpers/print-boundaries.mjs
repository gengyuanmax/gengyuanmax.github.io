import fs from 'node:fs/promises';
import ts from 'typescript';
export async function printBoundaries(){
 const found={};
 async function walk(dir){for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const path=`${dir}/${entry.name}`;
  if(entry.isDirectory()){if(!['print-pipeline','vendor'].includes(entry.name))await walk(path);continue;}
  if(!/\.(ts|mjs|astro)$/.test(path))continue;
  const code=await fs.readFile(path,'utf8'),ast=ts.createSourceFile(path,code,ts.ScriptTarget.Latest,true),counts={};
  const add=k=>counts[k]=(counts[k]||0)+1;
  function visit(n){
   if(ts.isCallExpression(n)){
    const expr=n.expression.getText(ast);
    if(/\.getContext$/.test(expr))add('canvas-context');
    if(expr==='Math.random')add('unseeded-random');
    if(expr==='Math.imul')add('seed-arithmetic');
   }
   ts.forEachChild(n,visit);
  }
  visit(ast);
  if(code.includes('<feTurbulence'))add('svg-noise');
  if(Object.keys(counts).length)found[path]=counts;
 }}await walk('src');await walk('scripts');return found;
}
