import {refineCoast} from './coastal-refinement.mjs';
import fs from 'node:fs';
import {upgradeFurniture} from './furniture-upgrade.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Document, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { dedup, prune, meshopt } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { ShapeUtils, Vector2 } from 'three';
const ROOT=path.resolve(import.meta.dirname,'..');
const source=process.env.SOLARA_SOURCE||'/tmp/solara-small-coastal/one-bedroom/scene.json';
const siteSource=process.env.SOLARA_SITE||'/tmp/solara-small-coastal/one-bedroom/site_scene.json';
const sourceSKP='/tmp/solara-small-coastal/one-bedroom/Solara_Tide_One_Bedroom_Coastal_Pro2025.skp';
const src=JSON.parse(fs.readFileSync(source));const refinement=upgradeFurniture(src,'one-bedroom');
const site=JSON.parse(fs.readFileSync(siteSource));
refinement.coast=refineCoast(src,site);
const origin=[8.6,3.5,0];
const toWorld=p=>[p[0]-origin[0],p[2],-(p[1]-origin[1])];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const unit=v=>{let l=Math.hypot(...v);return l>1e-10?v.map(x=>x/l):[0,0,1];};
const round=p=>p.map(v=>Math.round(v*1e6)).join(',');
const bounds=vv=>[ [0,1,2].map(k=>Math.min(...vv.map(p=>p[k]))),[0,1,2].map(k=>Math.max(...vv.map(p=>p[k]))) ];
function normal(v,f){for(let j=1;j<f.length-1;j++){const n=cross(sub(v[f[j]],v[f[0]]),sub(v[f[j+1]],v[f[0]]));if(Math.hypot(...n)>1e-9)return unit(n);}return null;}
function triangles(v,f,n){if(f.length===3)return[f];if(f.length===4)return[[f[0],f[1],f[2]],[f[0],f[2],f[3]]];let axis=n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));let aa=axis===2?[0,1]:axis===1?[0,2]:[1,2];return ShapeUtils.triangulateShape(f.map(i=>new Vector2(v[i][aa[0]],v[i][aa[1]])),[]).map(t=>t.map(j=>f[j]));}
const document=new Document();const buffer=document.createBuffer('Solara Tide');const scene=document.createScene('One-bedroom coastal villa');
const textureCache=new Map(),mats=new Map();
function tex(stem,suffix){const key=stem+'_'+suffix;let t=textureCache.get(key);if(!t){t=document.createTexture(key).setImage(new Uint8Array(fs.readFileSync(path.join(ROOT,'assets/textures',key+'.jpg')))).setMimeType('image/jpeg');textureCache.set(key,t);}return t;}
for(const[name,[hex,opacity]]of Object.entries(src.materials)){
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const spec=src.material_specs[name]||{};
 const m=document.createMaterial(name).setDoubleSided(true).setBaseColorFactor([...rgb,opacity]).setRoughnessFactor(spec.roughness??.7).setMetallicFactor(spec.metallic??0);
 if(opacity<1)m.setAlphaMode('BLEND');
 if(spec.texture){m.setBaseColorFactor([1,1,1,opacity]).setBaseColorTexture(tex(spec.texture,'color')).setNormalTexture(tex(spec.texture,'normal')).setNormalScale(spec.normal_scale??.2).setMetallicRoughnessTexture(tex(spec.texture,'roughness'));}
 if(name==='Light')m.setEmissiveFactor([1,.72,.35]).setBaseColorFactor([1,.9,.7,1]);
 mats.set(name,m);
}
const buckets=new Map();const counts={sourceVillaFaces:0,webVillaTriangles:0,webLandscapeTriangles:0,webVertices:0};
const colliders=[],segments=[],doors=[],seenSegments=new Set(),furniture=new Map();let footprint=[];
function category(o){if(o.tag==='Coastal setting')return o.mat==='Coastal water'?'ocean':/Grass blade/.test(o.mat)?'grass':o.assembly?.startsWith('Coastal almond')?'trees':'landscape';if(o.tag==='Roof'||o.tag==='Solar')return'roof';if(o.tag==='Doors'&&/Bathroom entry door|Terrace sliding glass leaf/.test(o.name))return'door_'+(/Bathroom/.test(o.name)?'bath':'terrace');return o.tag==='Glazing'||o.mat==='Glass'?'glass':o.tag==='Lighting'?'lighting':/Interior|Furniture|Bathroom/.test(o.tag)?'furniture':'architecture';}
function addCollider(o){
 if(o.tag==='Coastal setting')return;
 if(o.name==='Polished concrete finished floor'){
  const tops=o.f.filter(f=>f.length>12&&f.every(i=>o.v[i][2]>.525));const best=tops.sort((a,b)=>b.length-a.length)[0];if(best)footprint=best.map(i=>[o.v[i][0]-origin[0],-(o.v[i][1]-origin[1])]);
 }
 if(['Architecture','Glazing','Doors'].includes(o.tag)){
  for(const f of o.f){const n=normal(o.v,f);if(!n||Math.abs(n[2])>.15)continue;const vv=f.map(i=>o.v[i]);let z0=Math.min(...vv.map(v=>v[2])),z1=Math.max(...vv.map(v=>v[2]));if(z1-z0<1.1)continue;let a=vv[0],b=vv.reduce((best,p)=>Math.hypot(p[0]-a[0],p[1]-a[1])>Math.hypot(best[0]-a[0],best[1]-a[1])?p:best,vv[0]);if(Math.hypot(b[0]-a[0],b[1]-a[1])<.18)continue;
   let aa=[a[0]-origin[0],-(a[1]-origin[1])],bb=[b[0]-origin[0],-(b[1]-origin[1])];const key=[aa,bb].map(p=>p.map(v=>Math.round(v*100)).join(',')).sort().join('|');if(seenSegments.has(key))continue;seenSegments.add(key);segments.push({a:aa,b:bb,door:category(o).startsWith('door_')?category(o):null});
  }
 }
 if(['Interior','Furniture','Bathroom'].includes(o.tag)&&! /lamp|shade|mixer|tap|spout|head|riser|arm|mirror|stem|handle|pull|shelf|hob|ring|sink|basin|board|rug/.test(o.name.toLowerCase())){
  let key=o.name.replace(/\s*\/\s*(part|mesh)\s*\d+.*/i,'');if(!furniture.has(key))furniture.set(key,[]);furniture.get(key).push(...o.v);
 }
}
function hull(points){const p=[...new Map(points.map(v=>[round(v),v])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const c=(a,b,d)=>(b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0]);let lo=[],hi=[];for(const q of p){while(lo.length>1&&c(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.toReversed()){while(hi.length>1&&c(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const objects=src.objects.filter(o=>o.tag!=='Coastal setting').concat(site.objects);
for(const[oindex,o]of objects.entries()){
 const cat=category(o);addCollider(o);let faces=o.f;
 // Preserve complete almond foliage silhouettes.
 if(cat==='grass')faces=faces.filter((f,i)=>Math.floor(i/2)%2===0);
 if(o.tag!=='Coastal setting')counts.sourceVillaFaces+=o.f.length;
 let normals=new Map();const faceNormals=[];
 for(const f of faces){const n=normal(o.v,f);faceNormals.push(n);if(n)for(const i of f){let key=round(o.v[i]);if(!normals.has(key))normals.set(key,[]);normals.get(key).push(n);}}
 const key=cat+'|'+o.mat;let bucket=buckets.get(key);if(!bucket){bucket={cat,mat:o.mat,p:[],n:[],uv:[],idx:[],lookup:new Map()};buckets.set(key,bucket);}
 for(let fi=0;fi<faces.length;fi++){
  const f=faces[fi],n=faceNormals[fi];if(!n)continue;const tris=triangles(o.v,f,n);const axis=n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));const axes=axis===2?[0,1]:axis===1?[0,2]:[1,2];const repeat=src.material_specs[o.mat]?.repeat||[1,1];
  for(const t of tris){if(Math.hypot(...cross(sub(o.v[t[1]],o.v[t[0]]),sub(o.v[t[2]],o.v[t[0]])))<1e-10)continue;
   for(const vi of t){const v=o.v[vi];let smooth=n;if(!['Grass blade dark','Grass blade green','Grass blade straw'].includes(o.mat)&&o.smooth){const ns=normals.get(round(v)).filter(nn=>dot(nn,n)>(o.mat==='Bedding'?.2:.65));smooth=unit(ns.reduce((a,b)=>a.map((x,i)=>x+b[i]),[0,0,0]));}
    const pos=toWorld(v),norm=[smooth[0],smooth[2],-smooth[1]],uv=[v[axes[0]]/repeat[0],v[axes[1]]/repeat[1]];const idkey=pos.concat(norm,uv).map(v=>Math.round(v*1e5)).join(',');let idx=bucket.lookup.get(idkey);
    if(idx===undefined){idx=bucket.p.length/3;bucket.lookup.set(idkey,idx);bucket.p.push(...pos);bucket.n.push(...norm);bucket.uv.push(...uv);}
    bucket.idx.push(idx);
   }
   if(o.tag==='Coastal setting')counts.webLandscapeTriangles++;else counts.webVillaTriangles++;
  }
 }
 if(oindex%150===0)console.log('Converted',oindex,'/',objects.length);
}
for(const[name,vv]of furniture){const bb=bounds(vv);if(bb[0][2]>1.1||bb[1][2]<.72)continue;const poly=hull(vv.map(v=>[v[0]-origin[0],-(v[1]-origin[1])]));if(poly.length>=3)colliders.push({name,poly});}
for(const b of buckets.values()){
 const mesh=document.createMesh(b.cat+' / '+b.mat);const primitive=document.createPrimitive().setAttribute('POSITION',document.createAccessor().setType('VEC3').setArray(new Float32Array(b.p)).setBuffer(buffer)).setAttribute('NORMAL',document.createAccessor().setType('VEC3').setArray(new Float32Array(b.n)).setBuffer(buffer)).setAttribute('TEXCOORD_0',document.createAccessor().setType('VEC2').setArray(new Float32Array(b.uv)).setBuffer(buffer)).setIndices(document.createAccessor().setType('SCALAR').setArray(new Uint32Array(b.idx)).setBuffer(buffer)).setMaterial(mats.get(b.mat));mesh.addPrimitive(primitive);scene.addChild(document.createNode(b.cat+' / '+b.mat).setMesh(mesh).setExtras({category:b.cat,sourceMaterial:b.mat}));counts.webVertices+=b.p.length/3;
}
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions([EXTMeshoptCompression,KHRMeshQuantization]).registerDependencies({'meshopt.encoder':MeshoptEncoder});
await document.transform(dedup(),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await io.write(path.join(ROOT,'assets/solara-tide.glb'),document);
const nav={originSketchup:origin,floorHeight:.528,groundHeight:-.06,footprint,segments,colliders,cliffSafeZ:9.2,bounds:{minX:-23,maxX:23,minZ:-25,maxZ:9.2},rooms:[{id:'terrace',label:'Ocean terrace',position:toWorld([14.35,3.0,2.148]),target:toWorld([10.7,3.2,1.5])},{id:'living',label:'Living room',position:toWorld([8.75,1.25,2.148]),target:toWorld([6.9,2.6,1.1])},{id:'kitchen',label:'Kitchen & dining',position:toWorld([8.9,3.3,2.148]),target:toWorld([10.6,4.8,1.3])},{id:'bedroom',label:'Panoramic bedroom',position:toWorld([5.15,2.4,2.148]),target:toWorld([3.0,3.7,1.0])},{id:'bathroom',label:'Private bathroom',position:toWorld([6.25,4.86,2.148]),target:toWorld([7.1,5.55,1.2])}],overview:{position:toWorld([26,-22,12]),target:toWorld([8.6,3.5,1.3])},dollhouse:{position:toWorld([23,-10,17]),target:toWorld([8.6,3.5,1])}};
fs.writeFileSync(path.join(ROOT,'assets/navigation.json'),JSON.stringify(nav));
const report={...counts,refinement,source:'Solara_Tide_One_Bedroom_Coastal_Pro2025.skp',sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(sourceSKP)).digest('hex'),sourceVillaGroupCount:src.objects.filter(o=>o.tag!=='Coastal setting').length,drawMeshes:buckets.size,trees:8,roofToggle:true,assetBytes:fs.statSync(path.join(ROOT,'assets/solara-tide.glb')).size,optimization:'Original villa geometry; landscape leaf and grass LOD; merged material batches; physical UVs; meshopt compression',copyright:'Villa and scene assets remain the property of their respective rights holders.'};fs.writeFileSync(path.join(ROOT,'assets/model-report.json'),JSON.stringify(report,null,2));console.log(report);
