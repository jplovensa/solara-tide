import {refineUpholstery} from './geometry-refinement.mjs';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
export function upgradeFurniture(src,variant){for(const o of src.objects)if(/Linen|Bedding|Boucle|canvas/.test(o.mat))o.smooth=true;if(variant!=='one-bedroom')return {cushions:refineUpholstery(src)};src.materials['Sofa accent linen']=['#a99d8e',1];src.material_specs['Sofa accent linen']={texture:'ivory_linen',repeat:[.32,.32],roughness:.95,normal_scale:.25};src.objects=src.objects.filter(o=>!o.name.startsWith('Living soft upholstered sofa'));
 function part(name,size,center,mat='Linen',radius=.05,tilt=0){const g=new RoundedBoxGeometry(...size,5,radius),p=g.attributes.position,v=[];for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(tilt){const xx=x*Math.cos(tilt)-y*Math.sin(tilt);y=x*Math.sin(tilt)+y*Math.cos(tilt);x=xx;}v.push([center[0]+x,center[1]+z,center[2]+y]);}const f=[];for(let i=0;i<p.count;i+=3)f.push([i,i+1,i+2]);src.objects.push({name:'Living sculpted curved sofa / '+name,v,f,mat,tag:'Furniture',smooth:true});g.dispose();}
 part('recessed teak plinth',[.8,.12,1.8],[6.58,2.2,.62],'Oak',.025);part('soft upholstered base',[.91,.23,1.92],[6.58,2.2,.79],'Linen',.08);
 for(let i=0;i<3;i++){const y=1.6+i*.6,curve=i===1?0:.08;part('sprung seat '+i,[.7,.18,.565],[6.66+curve*.35,y,.965],'Linen',.065);part('curved back section '+i,[.18,.53,.65],[6.24+curve,y,1.07],'Linen',.07,-.08);part('loose back cushion '+i,[.18,.35,.54],[6.36+curve,y,1.17],'Linen',.07,-.16);}
 for(const y of [1.33,3.07])part('rounded end bolster',[.88,.25,.18],[6.61,y,.98],'Linen',.065);
 for(const [y,z]of[[1.68,1.2],[2.75,1.19]])part('scatter pillow',[.19,.3,.34],[6.48,y,z],'Sofa accent linen',.07,-.2);
 return {cushions:refineUpholstery(src)};
}
