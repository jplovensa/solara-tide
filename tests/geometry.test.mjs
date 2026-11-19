import test from 'node:test';
import assert from 'node:assert/strict';
import {clipFlooring,insideInset,bounds,tailorCushion} from '../tools/geometry-refinement.mjs';
test('timber is trimmed to the curved room with a glass-edge allowance',()=>{
 const ring=Array.from({length:160},(_,i)=>[5.3+5.3*Math.cos(i*Math.PI/80),8.2+4.4*Math.sin(i*Math.PI/80),.725]);
 const src={objects:[{name:'Bedroom wing polished concrete',v:ring,f:[ring.map((_,i)=>i)]},...Array.from({length:12},(_,i)=>({name:'Bedroom 1 timber board',v:[[i*.5,3.79,.73],[i*.5+.49,3.79,.73],[i*.5+.49,7.94,.74],[i*.5,7.94,.74]],f:[]}))]};
 const result=clipFlooring(src);assert.ok(result.trimmed>0);const boards=src.objects.slice(1);assert.ok(boards.length>0);for(const board of boards){assert.ok(board.v.every(p=>insideInset(p,ring)));assert.deepEqual(bounds(board.v)[2],[.73,.74]);assert.ok(board.f.length>=5);}
});
test('tailored cushions retain placement, support height and allocated clearance',()=>{
 const v=[];for(const x of [-.5,.5])for(const y of [-.1,.1])for(const z of [-.325,.325]){const c=Math.cos(.28),s=Math.sin(.28);v.push([12+x*c-z*s,1.3+y,8+x*s+z*c]);}const o={name:'Curved sofa seat cushion',v,f:[]},before=bounds(v);assert.ok(tailorCushion(o));const after=bounds(o.v);for(let k=0;k<3;k++)for(let j=0;j<2;j++)assert.ok(Math.abs(before[k][j]-after[k][j])<1e-7);assert.ok(o.v.every(p=>p.every(Number.isFinite)));assert.ok(o.f.length>500);
});
