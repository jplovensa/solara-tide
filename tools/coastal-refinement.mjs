import {IcosahedronGeometry} from 'three';
const box=o=>[0,1,2].map(k=>o.v.reduce((b,p)=>[Math.min(b[0],p[k]),Math.max(b[1],p[k])],[Infinity,-Infinity]));
const noise=(x,y)=>.5+.25*Math.sin(x*.91+y*.47)+.25*Math.sin(y*1.37-x*.29);
function rock(o){const bb=box(o),g=new IcosahedronGeometry(1,2),p=g.attributes.position,v=[],f=[];for(let i=0;i<p.count;i++){let q=[p.getX(i),p.getY(i),p.getZ(i)],n=1+.1*Math.sin(q[0]*17+q[1]*9+q[2]*13);v.push(q.map((x,k)=>(bb[k][0]+bb[k][1])/2+x*(bb[k][1]-bb[k][0])*.46*n));}for(let i=0;i<v.length;i+=3)f.push([i,i+1,i+2]);o.v=v;o.f=f;o.smooth=false;g.dispose();}
export function refineCoast(src,site){
 let rocks=0,grass=0;const building=src.objects.filter(o=>o.tag!=='Coastal setting'&&/Foundation|Floorplates|Terrace/.test(o.tag));
 const bv=building.flatMap(o=>o.v);const all=box({v:bv.length?bv:src.objects.find(o=>o.tag==='Glazing').v});
 const clear=(x,y)=>x<all[0][0]-1.2||x>all[0][1]+1.2||y<all[1][0]-1.2||y>all[1][1]+1.2;
 const trunks=site.objects.filter(o=>o.mat==='Almond bark').map(o=>{const b=box(o);return [(b[0][0]+b[0][1])/2,(b[1][0]+b[1][1])/2];});
 const relief=(x,y)=>{const dx=Math.max(all[0][0]-x,0,x-all[0][1]),dy=Math.max(all[1][0]-y,0,y-all[1][1]);let fade=Math.min(1,Math.max(0,(Math.hypot(dx,dy)-2)/8));for(const t of trunks)fade*=Math.min(1,Math.max(0,(Math.hypot(x-t[0],y-t[1])-1.5)/3));return fade*(.3+.27*Math.sin(x*.17+y*.11)+.16*Math.cos(y*.23-x*.08));};
 const grassObjects=site.objects.filter(o=>/Grass blade/.test(o.mat));
 for(const o of site.objects){
  if(/Layered coastal rock|Fractured coastal rock|Coastal boulder/.test(o.name)){rock(o);rocks++;}
  if(o.name==='Planted coastal landform'||o.name==='Coastal cliff face')for(const p of o.v)if(p[2]>-.15)p[2]+=relief(p[0],p[1]);
  if(/Grass blade/.test(o.mat)){const min=box(o)[2][0];for(const p of o.v){const h=Math.max(0,p[2]-min);p[2]=min+h*(.5+1.5*noise(p[0],p[1]))+relief(p[0],p[1]);}grass+=o.v.length;}
  if(/Almond leaf/.test(o.mat))o.smooth=true;
 }
 // Native shrubs with individual cupped leaves, placed only outside the architectural apron.
 const candidates=[];for(const o of grassObjects)for(let i=0;i<o.v.length;i+=173){const p=o.v[i];if(clear(p[0],p[1])&&p[2]<1&&!candidates.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<2.3))candidates.push(p);if(candidates.length>=44)break;}
 const shrubs={name:'Coastal native understory / layered leaves',assembly:'Coastal understory',tag:'Coastal setting',mat:'Almond leaf deep',smooth:true,v:[],f:[]};
 for(const [x,y,z]of candidates.slice(0,44))for(let k=0;k<65;k++){
  const a=k*2.39996,r=.5*Math.sqrt((k+.5)/65),h=.25+.28*(1-r/.6),cx=x+r*Math.cos(a),cy=y+r*Math.sin(a),cz=-.05+relief(x,y)+h;
  const len=.13+.08*noise(k,x),w=len*.45,dx=Math.cos(a),dy=Math.sin(a),n=shrubs.v.length;
  shrubs.v.push([cx-len*dx,cy-len*dy,cz-.035],[cx-w*dy,cy+w*dx,cz],[cx,cy,cz+.03],[cx+len*dx,cy+len*dy,cz+.035],[cx+w*dy,cy-w*dx,cz]);shrubs.f.push([n,n+1,n+2],[n+1,n+3,n+2],[n+3,n+4,n+2],[n+4,n,n+2]);
 }
 site.objects.push(shrubs);return {sculptedRocks:rocks,variedGrassVertices:grass,nativeShrubs:Math.min(candidates.length,44)};
}
