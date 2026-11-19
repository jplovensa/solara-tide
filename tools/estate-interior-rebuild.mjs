import {Shape,Path,ExtrudeGeometry,BoxGeometry,CylinderGeometry,TubeGeometry,CatmullRomCurve3,Vector3} from 'three';
import {RoundedBoxGeometry}from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export const interiorLayout={floor:4.03,island:{center:[40.5,19.7],width:3.8,depth:1.1,top:.91,overhang:.30},stools:[[39.3,18.93],[40.5,18.93],[41.7,18.93]],sofa:{center:[35.6,16.65],scale:[1.36,1.05,1.2]},chairs:[[39.25,16.2],[39.2,14.9]]};
export function rebuildEstateInterior(src){
 src.materials.Steel=['#9b9d96',1];src.material_specs.Steel={metallic:.85,roughness:.28};
 const room='Main Great Room',removed=[];src.objects=src.objects.filter(o=>{const replace=o.room===room&&(o.name==='Eight-place oval dining Oak'||/^(Main curved sectional|Sculpted living chair|Second living chair|Capsule stone island|Inset island sink|Island tap|Tap spout|Rounded bar stool cushion|Tapered stool leg|Stool footrest|Fitted working kitchen|Upper kitchen oak cabinetry|Integrated oven glass|Induction cooktop|Integrated fridge tower|Pantry storage|Beverage wine console|Travertine coffee table)/.test(o.name));if(replace)removed.push(o.name);return !replace;});
 let added=0;const F=interiorLayout.floor;
 function emit(name,g,mat='Oak',smooth=true){const p=g.attributes.position,idx=g.index,v=Array.from({length:p.count},(_,i)=>[p.getX(i),p.getY(i),p.getZ(i)]),f=[];for(let i=0;i<(idx?.count??p.count);i+=3)f.push([0,1,2].map(k=>idx?idx.getX(i+k):i+k));src.objects.push({name:'Rebuilt kitchen / '+name,room,level:'Main',tag:'Furniture',mat,smooth,v,f});g.dispose();added++;}
 function box(name,c,size,mat='Oak'){const g=new BoxGeometry(...size);g.translate(...c);emit(name,g,mat,false);}
 function capsule(l,w,cx,cy){const r=w/2,a=l/2-r,s=new Shape();s.moveTo(cx-a,cy-r);s.lineTo(cx+a,cy-r);s.absarc(cx+a,cy,r,-Math.PI/2,Math.PI/2,false);s.lineTo(cx-a,cy+r);s.absarc(cx-a,cy,r,Math.PI/2,Math.PI*1.5,false);return s;}
 function slab(name,shape,z,h,mat,bevel=.006){const g=new ExtrudeGeometry(shape,{depth:h,steps:1,curveSegments:32,bevelEnabled:!!bevel,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel});g.translate(0,0,z);emit(name,g,mat);}

 // Thin honed-stone counter, with a real opening above an undermount basin.
 const top=capsule(3.78,1.08,40.5,19.7),hole=new Path();hole.moveTo(39.78,19.53);hole.lineTo(39.78,19.94);hole.lineTo(40.42,19.94);hole.lineTo(40.42,19.53);hole.closePath();top.holes.push(hole);slab('honed limestone top with sink cutout',top,F+.865,.035,'Travertine',.005);
 slab('recessed dark toe plinth',capsule(3.18,.61,40.5,19.88),F,.09,'Dark oak',.004);
 const cabinet=capsule(3.44,.73,40.5,19.88);cabinet.holes.push(hole);slab('curved oak island cabinetry',cabinet,F+.10,.735,'Oak',.008);
 // Fine vertical tambour detail on the social side; separate drawer faces on the working side.
 for(let i=0;i<67;i++){const x=39.15+i*.04;box('tambour reed '+i,[x,19.507,F+.47],[.021,.018,.70]);}
 for(let i=0;i<3;i++)for(let j=0;j<2;j++){const x=39.61+i*.89,z=F+.30+j*.34;box('working-side drawer '+i+' '+j,[x,20.252,z],[.874,.018,.318]);box('recessed drawer pull '+i+' '+j,[x,20.264,z+.123],[.43,.009,.008],'Dark oak');}
 box('sink bowl bottom',[40.1,19.735,F+.685],[.63,.40,.014],'Steel');
 for(const x of [39.78,40.42])box('undermount basin side',[x,19.735,F+.77],[.014,.41,.17],'Steel');for(const y of [19.53,19.94])box('undermount basin end',[40.1,y,F+.77],[.64,.014,.17],'Steel');
 const faucet=new CatmullRomCurve3([[40.1,20.035,F+.90],[40.1,20.035,F+1.15],[40.1,19.99,F+1.23],[40.1,19.84,F+1.23],[40.1,19.79,F+1.16]].map(p=>new Vector3(...p)));emit('arched brushed bronze mixer',new TubeGeometry(faucet,48,.013,12,false),'Bronze');
 // Fitted galley: modular doors, actual worktop, shadow gaps and integrated appliances.
 box('galley recessed plinth',[40,22.11,F+.045],[5.12,.53,.09],'Dark oak');
 for(let i=0;i<8;i++){const x=37.75+i*.64;box('galley base carcass '+i,[x,22.12,F+.46],[.634,.61,.74]);box('galley front '+i,[x,21.802,F+.47],[.623,.027,.72]);box('galley finger rail '+i,[x,21.797,F+.805],[.60,.015,.018],'Dark oak');}
 box('continuous galley stone worktop',[40,22.1,F+.89],[5.2,.68,.04],'Travertine');box('stone splashback',[40,22.43,F+1.21],[5.2,.025,.55],'Travertine');
 for(let i=0;i<8;i++)box('upper handleless cabinet '+i,[37.75+i*.64,22.2,F+2.16],[.625,.40,.70],'Limewash');
 box('integrated induction glass',[39.3,22.1,F+.916],[.78,.45,.012],'Bronze');
 for(const x of [39.1,39.5])for(const y of [21.99,22.21]){const g=new CylinderGeometry(.079,.079,.001,48);g.rotateX(Math.PI/2);g.translate(x,y,F+.924);emit('induction cooking zone',g,'Steel');}
 box('built-in oven black glass',[41.59,21.774,F+.46],[.54,.018,.45],'Bronze');box('oven handle',[41.59,21.747,F+.61],[.40,.023,.014],'Steel');
 // Integrated full-height doors, appliance tower and pantry use furniture joinery, not pill-shaped solids.
 box('fridge housing',[43.5,22.0,F+1.25],[.90,.74,2.50]);
 for(const [z,h]of[[F+.49,.78],[F+1.69,1.58]]){box('integrated fridge door',[43.5,21.615,z],[.874,.027,h],'Limewash');box('fridge recessed handle',[43.80,21.594,z],[.014,.012,.34],'Dark oak');}
 box('pantry case',[46.3,22.63,F+1.12],[1.90,.45,2.24]);for(let i=0;i<3;i++)box('pantry full-height door '+i,[45.67+i*.63,22.392,F+1.15],[.615,.025,2.14],'Limewash');
 box('beverage plinth',[49.2,18.8,F+.05],[.43,1.90,.10],'Dark oak');box('beverage joinery',[49.2,18.8,F+.47],[.50,2,.74]);box('beverage stone top',[49.2,18.8,F+.87],[.54,2.04,.04],'Travertine');
 for(let i=0;i<3;i++)box('beverage cabinet door '+i,[48.935,18.14+i*.66,F+.48],[.022,.645,.70]);
 function oval(l,w,cx,cy){const s=new Shape();s.absellipse(cx,cy,l/2,w/2,0,Math.PI*2,false);return s;}
 slab('oval dining thin oak top',oval(3.8,1.44,45.7,18.4),F+.71,.035,'Oak',.009);
 for(const x of [44.65,46.75])slab('dining sculptural oak pedestal',oval(.55,.72,x,18.4),F,.70,'Oak',.01);
 slab('pebble coffee table honed top',oval(1.56,1.06,37.6,16.65),F+.32,.04,'Travertine',.012);
 for(const x of [37.20,38.00])slab('coffee table recessed stone pedestal',oval(.35,.58,x,16.65),F,.31,'Travertine',.012);
 for(const [i,y]of[15.5,16.65,17.8].entries()){const g=new RoundedBoxGeometry(.20,.56,.44,5,.07);g.rotateY(-.13);g.rotateZ(i===0?.35:i===2?-.35:0);g.translate(i===1?35.30:35.64,y,F+.755);emit('Crescent sofa loose back cushion '+i,g,'Linen');}
 const scatter=new RoundedBoxGeometry(.18,.38,.36,5,.07);scatter.rotateY(-.20);scatter.translate(35.84,15.65,F+.72);emit('Crescent sofa scatter pillow',scatter,'Olive Linen');
 const hits=[];for(const o of src.objects.filter(o=>o.name.startsWith('Rebuilt kitchen /')))for(const f of o.f){const [a,b,c]=f.map(i=>o.v[i]),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-9)continue;const u=((b[1]-c[1])*(40.1-c[0])+(c[0]-b[0])*(19.735-c[1]))/den,v=((c[1]-a[1])*(40.1-c[0])+(a[0]-c[0])*(19.735-c[1]))/den;if(u>=0&&v>=0&&u+v<=1){const z=u*a[2]+v*b[2]+(1-u-v)*c[2];if(z<F+.95)hits.push({z,mat:o.mat});}}hits.sort((a,b)=>b.z-a.z);if(hits[0]?.mat!=='Steel')throw Error('Sink bowl obstructed by cabinetry');
 return {sinkBasinClear:true,removedParts:removed.length,builtKitchenParts:added,worktopHeight:.91,seatingOverhang:.30,workingAisle:1.39};
}
