import {spawnSync} from 'node:child_process';
for(const file of ['runtime-assets.zip','two-bedroom-assets.zip','estate-assets.zip']){const result=spawnSync('unzip',['-q','-o',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log('All three villas are ready. Run npm run dev.');
