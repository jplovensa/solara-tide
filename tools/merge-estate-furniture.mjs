import fs from 'node:fs';import {NodeIO}from '@gltf-transform/core';import {ALL_EXTENSIONS}from '@gltf-transform/extensions';import {mergeDocuments,getBounds,dedup,prune,meshopt,unpartition}from '@gltf-transform/functions';import {MeshoptEncoder,MeshoptDecoder}from 'meshoptimizer';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});const doc=await io.read('assets/estate.glb'),scene=doc.getRoot().listScenes()[0],placements=[];
async function addAsset(file,name,centres,scale,angles){
 const asset=await io.read('/tmp/solara-furniture-source/'+file),sourceScene=asset.getRoot().getDefaultScene();
 const map=mergeDocuments(doc,asset);const roots=sourceScene.listChildren().map(n=>map.get(n));const template=doc.createNode(name+' template');for(const node of roots)template.addChild(node);map.get(sourceScene).dispose();
 function clone(node){const copy=doc.createNode(node.getName()).setTranslation(node.getTranslation()).setRotation(node.getRotation()).setScale(node.getScale()).setMesh(node.getMesh()).setExtras(node.getExtras());for(const ch of node.listChildren())copy.addChild(clone(ch));return copy;}
 for(let i=0;i<centres.length;i++){const [x,y,z]=centres[i],a=angles[i]??0,root=doc.createNode(name+' '+(i+1)).setTranslation([x-26,z,16.5-y]).setScale(scale).setRotation([0,Math.sin(a/2),0,Math.cos(a/2)]);scene.addChild(root);for(const node of template.listChildren())root.addChild(clone(node));root.traverse(n=>{if(n.getMesh())n.setExtras({category:'furniture',sourceMaterial:n.getMesh().listPrimitives()[0].getMaterial()?.getName()||name,level:'Main',asset:name});});const bounds=getBounds(root);placements.push({name:name+' '+(i+1),bounds});}
 template.traverse(n=>{if(n!==template)n.dispose();});template.dispose();
}
await addAsset('crescent-sofa.glb','Crescent curved boucle sofa',[[35.6,16.65,4.03]],[1.36,1.05,1.2],[Math.PI/2]);
await addAsset('plyform-chair.glb','Plyform lounge chair',[[39.25,16.2,4.03],[39.2,14.9,4.03]],[1,1,1],[-Math.PI/2,-2.35]);
await addAsset('reed-stool.glb','Reed counter stool',[[39.3,18.93,4.03],[40.5,18.93,4.03],[41.7,18.93,4.03]],[1,1,1],[0,0,0]);
await doc.transform(unpartition(),dedup(),prune(),meshopt({encoder:MeshoptEncoder,level:'medium'}));await io.write('assets/estate.glb',doc);
const nav=JSON.parse(fs.readFileSync('assets/estate-navigation.json')),level=nav.levels.Main;
level.colliders=level.colliders.filter(c=>! /Main curved sectional|Sculpted living chair|Second living chair|Capsule stone island|Rounded bar stool|Tapered stool|Stool footrest|Fitted working kitchen|Upper kitchen oak cabinetry|Travertine coffee table|Crescent curved|Plyform lounge|Reed counter|Rebuilt capsule|Rebuilt fitted/.test(c.name));
for(const p of placements){const{min,max}=p.bounds;level.colliders.push({name:p.name,poly:[[min[0],min[2]],[max[0],min[2]],[max[0],max[2]],[min[0],max[2]]]});}
level.colliders.push({name:'Rebuilt capsule kitchen island',poly:[[38.61-26,16.5-19.16],[42.39-26,16.5-19.16],[42.39-26,16.5-20.24],[38.61-26,16.5-20.24]]},{name:'Rebuilt fitted galley',poly:[[37.4-26,16.5-21.76],[42.6-26,16.5-21.76],[42.6-26,16.5-22.45],[37.4-26,16.5-22.45]]});
level.colliders.push({name:'Coffee table honed stone',poly:[[36.82-26,16.5-16.12],[38.38-26,16.5-16.12],[38.38-26,16.5-17.18],[36.82-26,16.5-17.18]]});
fs.writeFileSync('assets/estate-navigation.json',JSON.stringify(nav));const report=JSON.parse(fs.readFileSync('assets/estate-report.json'));report.assetBytes=fs.statSync('assets/estate.glb').size;report.interiorAssets=placements;fs.writeFileSync('assets/estate-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({assetBytes:report.assetBytes,placements},null,2));
