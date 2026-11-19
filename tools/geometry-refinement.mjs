// Geometry edits are applied to derivatives; original SketchUp exports stay untouched.
export const bounds = v => [0,1,2].map(k=>[Math.min(...v.map(p=>p[k])),Math.max(...v.map(p=>p[k]))]);
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
export function floorBoundary(src){
 const floor=src.objects.find(o=>o.name==='Bedroom wing polished concrete');
 if(!floor)throw Error('Bedroom floor envelope missing');
 let p=floor.f.reduce((a,b)=>a.length>b.length?a:b).map(i=>floor.v[i].slice(0,2));
 if(p.reduce((s,a,i)=>{let b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)<0)p.reverse();
 return p;
}
export function insideInset(p,poly,inset=.03){return poly.every((a,i)=>{let b=poly[(i+1)%poly.length];return cross(a,b,p)>=inset*Math.hypot(b[0]-a[0],b[1]-a[1])-1e-8;});}
export function clipFlooring(src){
 const poly=floorBoundary(src);let trimmed=0,removed=0;
 src.objects=src.objects.filter(o=>{
  if(!/^Bedroom [12] timber board$/.test(o.name))return true;
  const bb=bounds(o.v);let q=[[bb[0][0],bb[1][0]],[bb[0][1],bb[1][0]],[bb[0][1],bb[1][1]],[bb[0][0],bb[1][1]]];
  const was=q.some(p=>!insideInset(p,poly));
  for(let i=0;i<poly.length&&q.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],d=.03*Math.hypot(b[0]-a[0],b[1]-a[1]),out=[];
   for(let j=0;j<q.length;j++){const p=q[j],r=q[(j+1)%q.length],dp=cross(a,b,p)-d,dr=cross(a,b,r)-d;
    if(dp>=-1e-10)out.push(p);
    if((dp>=0)!==(dr>=0)){const t=dp/(dp-dr);out.push(p.map((v,k)=>v+t*(r[k]-v)));}
   }q=out;
  }
  if(q.length<3){removed++;return false;}
  const n=q.length;o.v=q.map(p=>[...p,bb[2][0]]).concat(q.map(p=>[...p,bb[2][1]]));
  o.f=[Array.from({length:n},(_,i)=>n-1-i),Array.from({length:n},(_,i)=>n+i)];
  for(let i=0;i<n;i++)o.f.push([i,(i+1)%n,(i+1)%n+n,i+n]);
  if(was)trimmed++;return true;
 });const boards=src.objects.filter(o=>/^Bedroom [12] timber board$/.test(o.name));const outside=boards.flatMap(o=>o.v).filter(p=>!insideInset(p,poly)).length;if(outside)throw Error('Timber extends outside glass boundary');return {trimmed,removed,insetMetres:.03,boards:boards.length,outsideVertices:outside};
}
// Principal axes retain the source cushion's rotation and lean.
function axesOf(v){
 const c=[0,1,2].map(k=>v.reduce((s,p)=>s+p[k],0)/v.length),a=Array.from({length:3},()=>[0,0,0]),r=[[1,0,0],[0,1,0],[0,0,1]];
 for(const p of v)for(let i=0;i<3;i++)for(let j=0;j<3;j++)a[i][j]+=(p[i]-c[i])*(p[j]-c[j]);
 for(let it=0;it<24;it++){let p=0,q=1;for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j;}if(Math.abs(a[p][q])<1e-10)break;
  const t=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),co=Math.cos(t),si=Math.sin(t);
  for(let k=0;k<3;k++){let ap=a[k][p],aq=a[k][q];a[k][p]=co*ap-si*aq;a[k][q]=si*ap+co*aq;}
  for(let k=0;k<3;k++){let ap=a[p][k],aq=a[q][k];a[p][k]=co*ap-si*aq;a[q][k]=si*ap+co*aq;let rp=r[k][p],rq=r[k][q];r[k][p]=co*rp-si*rq;r[k][q]=si*rp+co*rq;}
 }
 const order=[0,1,2].sort((i,j)=>a[j][j]-a[i][i]);return {c,axes:order.map(i=>r.map(row=>row[i]))};
}
const pow=(v,e)=>Math.sign(v)*Math.abs(v)**e;
export function tailorCushion(o){
 const before=bounds(o.v),{c,axes}=axesOf(o.v),local=o.v.map(p=>axes.map(a=>a.reduce((s,x,k)=>s+x*(p[k]-c[k]),0))),bb=bounds(local),half=bb.map(b=>(b[1]-b[0])/2),mid=bb.map(b=>(b[1]+b[0])/2);
 if(Math.min(...half)<.015)return false;
 const scatter=/scatter|pillow/.test(o.name),nu=48,nv=20,v=[],f=[];
 for(let j=0;j<=nv;j++){let lat=-Math.PI/2+j*Math.PI/nv;for(let i=0;i<nu;i++){
  const lon=i*2*Math.PI/nu,cl=pow(Math.cos(lat),scatter?.78:.62),l=[half[0]*cl*pow(Math.cos(lon),.32),half[1]*cl*pow(Math.sin(lon),.32),half[2]*pow(Math.sin(lat),scatter?.78:.62)];
  // A slight seam draw and cloth relaxation interrupt a perfectly manufactured surface.
  const relax=1-.012*Math.cos(lon*8)*Math.exp(-(((Math.abs(lat)-.45)/.19)**2));l[2]*=relax;
  v.push(c.map((x,k)=>x+axes.reduce((s,a,n)=>s+a[k]*(l[n]+mid[n]),0)));
 }}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++)f.push([j*nu+i,j*nu+(i+1)%nu,(j+1)*nu+(i+1)%nu,(j+1)*nu+i]);
 // Keep the entire replacement inside its existing allocated volume and on its support.
 const after=bounds(v);o.v=v.map(p=>p.map((x,k)=>before[k][0]+(x-after[k][0])/(after[k][1]-after[k][0])*(before[k][1]-before[k][0])));o.f=f;o.smooth=true;
 return true;
}
export function relaxCloth(o){
 const vv=[],lookup=new Map(),indices=o.v.map(p=>{const key=p.map(x=>Math.round(x*1e5)).join(',');if(!lookup.has(key)){lookup.set(key,vv.length);vv.push([...p]);}return lookup.get(key);});
 const adjacent=vv.map(()=>new Set());for(const face of o.f)for(let i=0;i<face.length;i++){let a=indices[face[i]],b=indices[face[(i+1)%face.length]];if(a!==b){adjacent[a].add(b);adjacent[b].add(a);}}
 let points=vv;for(let step=0;step<2;step++)points=points.map((p,i)=>{const ns=[...adjacent[i]];if(ns.length<3)return p;const avg=[0,1,2].map(k=>ns.reduce((s,j)=>s+points[j][k],0)/ns.length),delta=avg.map((x,k)=>(x-p[k])*.22),scale=Math.min(1,.006/Math.max(1e-8,Math.hypot(...delta)));return p.map((x,k)=>x+delta[k]*scale);});
 o.v=indices.map(i=>points[i]);o.smooth=true;
}
export function refineUpholstery(src){let count=0,cloth=0;for(const o of src.objects){if(/Linen|Bedding|Boucle|canvas/i.test(o.mat))o.smooth=true;if(o.mat==='Bedding'&&o.f.length>500){relaxCloth(o);cloth++;}if(/seat cushion|back cushion|scatter cushion|chaise cushion|sprung seat|loose back cushion|scatter pillow/i.test(o.name)&&/sofa|sectional|daybed|sprung|pillow/i.test(o.name))if(tailorCushion(o))count++;}src.clothRefinements=cloth;return count;}
