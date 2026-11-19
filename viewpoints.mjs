/** Room-camera refinements in source metres; source furniture stays in place. */
export function applyViewpoints(nav,variant){if(variant!=='estate')return nav;const edits={
 'great-room':[[38.2,13.4,5.65],[35.7,16.7,4.8]],
 'guest-2':[[11.0,16.7,5.65],[11.0,19.3,4.8]],
 'guest-3':[[20.2,4.5,2.05],[20.2,7.3,1.2]],
 'master':[[28.2,25.6,9.25],[28.2,28.3,8.4]],
 'master-bath':[[31.2,29.7,9.25],[32.35,28.8,8.4]],
 'family':[[42,14,2.05],[39,17,1.2]]
};const [ox,oy]=nav.originSketchup,world=p=>[p[0]-ox,p[2],oy-p[1]];for(const r of nav.rooms)if(edits[r.id]){r.position=world(edits[r.id][0]);r.target=world(edits[r.id][1]);}return nav;}
