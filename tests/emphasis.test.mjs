import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emphasisMaterial,contrastRatio} from '../src/design/emphasis.ts';
import {palettes} from '../src/design/settings.ts';

test('body ink stays readable on paper and on the emphasis band as the eye averages it',()=>{
 for(const palette of Object.values(palettes)){
  const m=emphasisMaterial(palette);
  assert(m.paperContrast>=4.5);assert(m.bandContrast>=4.5);assert(m.coverage>=.3,'the band must be visible');
  // Worst-case shared 8% paper layer, applied to both foreground and background.
  const paperOverlay=hex=>'#'+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*.92).toString(16).padStart(2,'0')).join('');
  assert(contrastRatio(paperOverlay(palette.primary),paperOverlay(m.average))>=4.5);
 }
 assert(contrastRatio(palettes.blueVermilion.primary,palettes.blueVermilion.secondary)<4.5);
});
