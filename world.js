/* All distances are in beach-world units. The same shore outline drives the mesh and movement. */
function beachWorld(canvas, onFrame) {
  const T=THREE, scene=new T.Scene(), camera=new T.OrthographicCamera(-12,12,8,-8,.1,145);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
  renderer.setClearColor(0xc0e6da);
  scene.fog=new T.FogExp2(0xbbe3d9,.013);
  scene.add(new T.HemisphereLight(0xfff5df,0xaac5ae,2.05));
  const sun=new T.DirectionalLight(0xffe2ad,2.05);sun.position.set(-14,23,11);scene.add(sun);
  let seed=3742;
  function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  const material=new Map(),staticRoot=new T.Group();scene.add(staticRoot);
  function mat(color){if(!material.has(color))material.set(color,new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));return material.get(color)}
  function mesh(geometry,color,x,y,z,parent=staticRoot){const o=new T.Mesh(geometry,mat(color));o.position.set(x,y,z);parent.add(o);return o}
  function group(x,y,z,p=staticRoot){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
  function ball(x,y,z,a,b,c,color,parent=staticRoot,detail=0){const o=mesh(new T.IcosahedronGeometry(1,detail),color,x,y,z,parent);o.scale.set(a,b,c);return o}
  function box(x,y,z,w,h,d,color,parent=staticRoot){return mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent)}
  function cyl(x,y,z,top,base,h,n,color,parent=staticRoot){return mesh(new T.CylinderGeometry(top,base,h,n),color,x,y,z,parent)}
  function beam(a,b,r,color,parent=staticRoot,top=r){const p=new T.Vector3(...a),q=new T.Vector3(...b),o=cyl(0,0,0,top,r,p.distanceTo(q),7,color,parent);o.position.copy(p).lerp(q,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o}
  function faces(points,indices,color,p=staticRoot){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(indices.flatMap(i=>points[i]),3));g.computeVertexNormals();const o=mesh(g,color,0,0,0,p);o.material.side=T.DoubleSide;return o}
  function shadow(x,y,z,rx,rz,color,p=staticRoot){const o=cyl(x,y,z,1,1,.012,24,color,p);o.scale.set(rx,1,rz);return o}
  const shore=(a)=>1+.045*Math.cos(a*3)+.035*Math.sin(a*5);
  function island(cx,cz,rx,rz,grass=true,small=false){
    const count=64, levels=[[1.14,-.09,0x7bd8bd],[1.07,.015,0xa7e5c6],[1.031,.042,0xe1f2d5],[1,.075,0xffe6a8],[.96,.22,0xf5ce88],[.86,.31,0xf9d895]];
    if(grass)levels.push([.70,.34,0xe8c181],[.68,.55,0x94b766],[.64,.62,0x9ac876]);else levels.push([.45,.38,0xf5d69c]);
    let prev;
    for(const [s,h,color] of levels){const ring=[];for(let i=0;i<count;i++){const a=i*2*Math.PI/count,k=shore(a)*s;ring.push([cx+Math.cos(a)*rx*k,h,cz+Math.sin(a)*rz*k])}if(prev){const pts=prev.concat(ring),ids=[];for(let i=0;i<count;i++){const j=(i+1)%count;ids.push(i,count+i,j,j,count+i,count+j)}faces(pts,ids,color)}prev=ring}
    const center=[cx,levels.at(-1)[1],cz];faces([center,...prev],Array.from({length:count},(_,i)=>[0,1+(i+1)%count,1+i]).flat(),levels.at(-1)[2]);
  }
  island(-12,2,12,8.7);island(6,-9.6,3.5,1.95);island(-20,-24,6,3.3);island(24,-25,8,3.6);
  // Water patterns are evaluated in world space, so they stay on the surface as the camera moves.
  const waterMat=new T.ShaderMaterial({uniforms:{clock:{value:0}},vertexShader:'varying vec3 v; void main(){vec4 p=modelMatrix*vec4(position,1.);v=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:`
    varying vec3 v; uniform float clock;
    void main(){vec2 p=v.xz;float swell=sin(p.x*.63+p.y*.87+clock*.55)*.5+sin(p.y*1.48-p.x*.32-clock*.36)*.5;
    float depth=smoothstep(2.,24.,length((p-vec2(-8.,2.))*vec2(.9,1.)));
    vec3 col=mix(vec3(.36,.79,.72),vec3(.23,.67,.72),depth);
    col+=swell*.012;float bands=sin(p.y*7.+sin(p.x*.81+clock*.3)*1.8+clock*.6);
    col+=vec3(.10,.13,.11)*smoothstep(.94,.999,bands)*smoothstep(.38,.92,swell)*(.4+.6*sin(p.x*1.4)*sin(p.x*1.4));
    col=mix(col,vec3(.73,.87,.84),smoothstep(15.,65.,-p.y)*.76);gl_FragColor=vec4(col,1.);}`});
  const water=new T.Mesh(new T.PlaneGeometry(185,145),waterMat);water.rotation.x=-Math.PI/2;water.position.y=-.1;scene.add(water);
  function rock(x,z,s,y=0){const a=ball(x,y+s*.27,z,s,.69*s,.83*s,rand()>.5?0x788e88:0x91a39a);a.rotation.y=rand()*6;return a}
  function palm(x,z,s,az=0){
    const g=group(x,.4,z);g.scale.setScalar(s);g.rotation.y=az;
    for(let i=0;i<8;i++){const u=i/8,v=(i+1)/8;beam([u*u*.53,u*3.5,0],[v*v*.53,v*3.5,0],.22-.065*u,i%2?0xab784a:0xb98352,g,.215-.065*v)}
    for(let j=0;j<10;j++){const a=j*2.399,reach=1.55+rand()*.68,pts=[],ids=[];for(let k=0;k<=8;k++){const u=k/8,d=u*reach,w=Math.sin(Math.PI*u)*(.31+rand()*.07),h=3.52+Math.sin(u*Math.PI)*.60-u*u*.48;
      const xx=.53+Math.cos(a)*d,zz=Math.sin(a)*d;pts.push([xx+Math.sin(a)*w,h-w*.5,zz-Math.cos(a)*w],[xx,h+.06,zz],[xx-Math.sin(a)*w,h-w*.5,zz+Math.cos(a)*w]);if(k){const b=k*3;ids.push(b-3,b,b-2,b,b+1,b-2,b-2,b+1,b-1,b+1,b+2,b-1)}}faces(pts,ids,[0x4b9766,0x72ad66,0x358e66,0x87b967][j%4],g)}
    for(let i=0;i<3;i++)ball(.53+Math.sin(i*2)*.19,3.35,Math.cos(i*2)*.18,.19,.22,.18,0xb48a44,g);
  }
  function tree(x,z,s){const g=group(x,.5,z);g.scale.setScalar(s);cyl(0,.6,0,.16,.23,1.2,8,0x956e4e,g);for(const [dx,h,dz,r,c] of [[0,1.55,0,1.13,0x60975d],[-.53,1.8,0,.78,0x81aa63],[.48,1.95,.1,.8,0x78ab64],[0,2.36,0,.75,0x94b968]])ball(dx,h,dz,r,r*.93,r,c,g,1)}
  [[-3.9,-.3,1.1,-.5],[-6.4,-3.7,1.23,.8],[-11,6.4,1.1,1.8],[-14,-4.7,1.4,.5],[-5.5,7.2,.77,-1.4],[7.4,-9.6,.56,1]].forEach(a=>palm(...a));
  [[-13,-1,1.35],[-14,-3,1.1],[-15,3,1.4],[-10,-3.9,1.2],[-16,-23,.8],[21,-26,1.3],[24,-25,1]].forEach(a=>tree(...a));
  function lighthouse(x,z){const g=group(x,.57,z);cyl(0,.12,0,.9,1,.24,12,0x9b9d8e,g);
    const colors=[0xfff1c9,0xcf5945,0xfff1c9,0xcb503e,0xfff1c9];for(let i=0;i<5;i++)cyl(0,.28+i*.57+.28,0,.75-(i+1)*.063,.75-i*.063,.58,14,colors[i],g);
    cyl(0,3.2,0,.72,.72,.14,14,0x375b58,g);cyl(0,3.64,0,.4,.4,.74,8,0xffcd63,g);for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(Math.cos(a)*.43,3.62,Math.sin(a)*.43,.036,.036,.78,5,0x426865,g)}
    cyl(0,4.22,0,.07,.76,.52,12,0xbf5741,g);cyl(0,4.61,0,.04,.045,.32,6,0x84633e,g);box(0,.65,.7,.34,.7,.08,0x486e6d,g);box(0,2.75,.51,.2,.26,.08,0x406c71,g)}
  lighthouse(5.45,-9.73);
  function hut(x,z){const g=group(x,.65,z);g.rotation.y=.2;box(0,.9,0,2.2,1.8,1.9,0xffe2a9,g);for(let i=0;i<11;i++)box(-1.03+i*.205,.9,.96,.035,1.77,.035,0xddb680,g);
    box(.53,.66,.99,.64,1.32,.09,0x518f81,g);box(-.50,.98,1,.7,.66,.12,0xfaf2cb,g);box(-.50,.98,1.08,.52,.46,.06,0x568e9a,g);
    for(let j=0;j<2;j++){const side=j?1:-1;const roof=box(side*.58,2.02,0,1.52,.16,2.42,0xb95642,g);roof.rotation.z=-side*.42;for(let k=0;k<7;k++){const r=box(side*.60,2.12,-1.13+k*.37,1.5,.045,.06,0xd77853,g);r.rotation.z=-side*.42}}
    box(0,.11,1.27,2.4,.2,.65,0xba8f69,g)}
  hut(-8,-1.7);
  shadow(-7.9,.635,-1.75,1.56,1.24,0x87ab68);
  shadow(-4.25,.342,4.62,1.28,.9,0xe9bf80);
  for(const [x,z] of [[-13,-1],[-14,-3],[-15,3],[-10,-3.9],[-11,6.4]])shadow(x+.18,.635,z-.12,1.05,.65,0x87ae67);
  // The pier is built from individually weathered planks and rope rails.
  const pierZ=1.65,end=4.1;
  for(let j=0;j<25;j++){const x=-2.85+j*.285;box(x,.66,pierZ,.273,.19,1.77,[0xb48558,0xc39769,0xcda575,0xb98c60][j%4]);if(j%3===0){for(const z of [-.66,.66])cyl(x,.76,pierZ+z,.025,.025,.008,6,0x785f4c)}}
  for(const x of [-2.6,-.48,1.72,3.91]){for(const side of [-1,1]){const z=pierZ+side*.85;cyl(x,.49,z,.102,.125,1.71,9,0x946a47);cyl(x,1.18,z,.118,.118,.12,9,0xe6c797);if(x<3.9&&side<0){beam([x,1.15,z],[x+1.06,.94,z],.035,0xe7cea1);beam([x+1.06,.94,z],[x+2.13,1.15,z],.035,0xe7cea1)}}}
  const life=group(.23,.68,pierZ+.92);for(let i=0;i<8;i++){const arc=mesh(new T.TorusGeometry(.29,.079,6,5,Math.PI/4+.012),i%2?0xffedcf:0xd56d50,0,0,0,life);arc.rotation.z=i*Math.PI/4}
  box(1.28,.94,pierZ-.48,.53,.35,.38,0x629b91);box(1.28,1.13,pierZ-.48,.56,.075,.40,0xf4e0b3);
  box(1.28,1.005,pierZ-.28,.105,.12,.04,0xe8c279);
  for(const [x,z] of [[-1.63,2.94],[-1.38,3.13]]){cyl(x,.62,z,.21,.18,.53,12,0xad7951);for(const y of [.45,.78])cyl(x,y,z,.215,.213,.045,12,0x837564);cyl(x,.897,z,.17,.17,.02,12,0xcca171)}
  function umbrella(x,z){const g=group(x,.34,z);cyl(0,.89,0,.055,.065,1.8,8,0xb38c59,g);for(let i=0;i<10;i++){const a=i*.62832,b=(i+1)*.62832,m=(a+b)/2;faces([[0,2.22,0],[1.35*Math.cos(a),1.68,1.35*Math.sin(a)],[1.4*Math.cos(m),1.62,1.4*Math.sin(m)],[1.35*Math.cos(b),1.68,1.35*Math.sin(b)]],[0,1,2,0,2,3],i%2?0xffedbd:0xed8060,g)}cyl(0,2.27,0,.04,.055,.12,8,0xc89966,g);
    const towel=box(.65,.025,.6,.72,.03,1.65,0xd98467,g);towel.rotation.y=.18}
  umbrella(-4.25,4.75);
  function sail(x,z,s){const g=group(x,.02,z);g.scale.setScalar(s);const hull=ball(0,.18,0,1.3,.29,.48,0xae6447,g,1);hull.rotation.y=.1;box(0,.36,0,1.65,.13,.51,0xffe5b3,g);cyl(0,1.28,0,.032,.05,1.95,6,0x99754f,g);faces([[.04,2.23,0],[.04,.55,0],[1.03,.56,0]],[0,1,2],0xffedc6,g);faces([[-.11,1.99,0],[-.11,.63,0],[-.89,.69,0]],[0,1,2],0xe99072,g);g.rotation.y=-.28} sail(11,-5.9,.85);sail(-6,-20,.57);
  for(const [x,z,s] of [[-1,-3,.65],[.3,-2.7,.32],[2,6.6,.75],[2.9,6.85,.43],[3.15,6.6,.28],[9.5,-12.4,.65],[11,-11.8,.43],[-6.7,9,.63],[-5.9,9,.34],[-2,4.8,.38]])rock(x,z,s);
  for(let i=0;i<87;i++){const a=rand()*6.28,r=.77+rand()*.17,x=-12+Math.cos(a)*12*r*shore(a),z=2+Math.sin(a)*8.7*r*shore(a);if(x>-3.5&&Math.abs(z-pierZ)<1.3)continue;const s=.025+rand()*.06;ball(x,.32,z,s*1.4,s*.6,s,[0xddb581,0xe9c399,0xffe1ad][i%3])}
  for(let i=0;i<45;i++){const a=rand()*6.28,r=.54+rand()*.085,x=-12+Math.cos(a)*12*r,z=2+Math.sin(a)*8.7*r;
    for(let j=0;j<3;j++){const blade=cyl(x+j*.08,.68+rand()*.07,z,.008,.055,.33,4,[0x7d9e59,0x789f56,0x9ab15f][j]);blade.rotation.z=(j-1)*.4}
    if(i%4===0){for(let k=0;k<5;k++)ball(x+Math.cos(k*1.26)*.08,.85,z+Math.sin(k*1.26)*.08,.075,.042,.075,0xfff1c4);ball(x,.88,z,.047,.04,.047,0xf4b23e)}}
  function star(x,z){const g=group(x,.35,z);for(let i=0;i<5;i++){const a=i*Math.PI*.4;faces([[0,.07,0],[Math.cos(a-.55)*.10,.01,Math.sin(a-.55)*.10],[Math.cos(a)*.32,0,Math.sin(a)*.32],[Math.cos(a+.55)*.1,.01,Math.sin(a+.55)*.1]],[0,1,2,0,2,3],0xe88660,g)}}star(-2.4,4.1);star(-4,7);
  // Merge stationary geometry by material. Only characters, fish and birds require per-frame transforms.
  staticRoot.updateMatrixWorld(true);const batches=new Map();
  staticRoot.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,{p:[],n:[]});const b=batches.get(o.material);b.p.push(...g.attributes.position.array);b.n.push(...g.attributes.normal.array);g.dispose();o.geometry.dispose()});
  scene.remove(staticRoot);for(const [m,b] of batches){const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(b.p,3));g.setAttribute("normal",new T.Float32BufferAttribute(b.n,3));scene.add(new T.Mesh(g,m))}
  const actor=group(3.05,.76,pierZ,scene),body=group(0,0,0,actor);
  const feet=[-.17,.17].map(x=>{const f=group(x,0,.015,body);box(0,.22,0,.23,.32,.25,0x324f59,f);ball(0,.09,.07,.175,.105,.22,0x855641,f,1);return f});
  ball(0,.61,0,.41,.41,.29,0x4a8385,body,1);box(0,.56,.23,.53,.43,.09,0xe89054,body);box(0,.44,.29,.34,.08,.04,0xf1b263,body);
  ball(0,1.23,0,.44,.43,.38,0xffc89b,body,2);ball(0,1.37,-.095,.445,.35,.35,0x674835,body,1);
  for(const x of [-.16,.16]){ball(x,1.24,.34,.034,.047,.025,0x453c35,body,1);ball(x*1.55,1.15,.294,.057,.029,.028,0xe99c7f,body)}
  ball(0,1.16,.37,.063,.052,.047,0xf1ac81,body,1);cyl(0,1.53,0,.62,.66,.093,24,0xddae62,body);cyl(0,1.69,-.01,.34,.43,.32,16,0xefc783,body);cyl(0,1.58,-.01,.423,.445,.09,16,0x8e674b,body);
  for(const x of [-.37,.37]){beam([x*.78,.79,0],[x,.62,.20],.112,0x508687,body);ball(x,.63,.22,.105,.12,.11,0xfbc293,body,1)}
  const rod=group(.37,.63,.21,body);const tip=new T.Object3D();tip.position.set(.55,1.43,1.12);rod.add(tip);
  beam([0,0,0],[.25,.75,.48],.044,0x94643c,rod,.034);beam([.25,.75,.48],[.55,1.43,1.12],.032,0xc49252,rod,.013);
  const shade=shadow(0,.01,0,.53,.31,0xa48462,actor);actor.rotation.y=.88;
  const float=group(0,0,0,scene);ball(0,.075,0,.10,.12,.10,0xffedca,float,1);ball(0,.16,0,.096,.08,.096,0xe36345,float,1);cyl(0,.28,0,.024,.03,.18,7,0x9a6348,float);float.visible=false;
  const thread=new T.Line(new T.BufferGeometry().setAttribute("position",new T.BufferAttribute(new Float32Array(13*3),3)),new T.LineBasicMaterial({color:0xfff3cb,transparent:true,opacity:.82}));thread.frustumCulled=false;thread.visible=false;scene.add(thread);
  const fish=[];for(let i=0;i<13;i++){const g=group(0,-.018,0,scene),size=.23+rand()*.2;ball(0,0,0,size*.45,.025,size,0x488e8c,g);faces([[0,0,-size*.55],[-size*.5,0,-size*1.23],[size*.5,0,-size*1.23]],[0,1,2],0x488e8c,g);fish.push({g,x:2+rand()*14,z:-9+rand()*20,phase:rand()*6})}
  const birds=[];for(let i=0;i<5;i++){const g=group(0,0,0,scene);for(const side of [-1,1]){faces([[0,0,0],[side*.26,.13,0],[side*.54,.08,0],[side*.20,.05,.10]],[0,1,3,1,2,3],0xfff5d9,g)}birds.push(g)}
  const keys=new Set(),joy={x:0,y:0},target=new T.Vector3(),tipPos=new T.Vector3();let phase="idle",strength=0,castAt=0,elapsed=0,locked=false,going=null;
  function ground(x,z){if(x>=-2.95&&x<=4.06&&Math.abs(z-pierZ)<.79)return .765;const nx=(x+12)/12,nz=(z-2)/8.7,r=Math.hypot(nx,nz)/shore(Math.atan2(nz,nx));if(r>.984||x<-21)return null;if(r<.7)return .63;if(r<.86)return .33;return .28-(r-.86)*1.45}
  function moveTo(x,z){const y=ground(x,z);if(y===null)return false;actor.position.set(x,y,z);return true}
  function canCast(){const {x,z}=actor.position;if(x>-.65&&Math.abs(z-pierZ)<.9)return true;const nx=(x+12)/12,nz=(z-2)/8.7;return Math.hypot(nx,nz)/shore(Math.atan2(nz,nx))>=.83}
  let last=0,camX=0,camZ=-2.5,ratio=1;function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);ratio=w/h;const s=ratio<.9?9.5:Math.max(6.5,Math.min(9.4,15.4/ratio));camera.left=-s*ratio;camera.right=s*ratio;camera.top=s;camera.bottom=-s;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}
  function drawStill(){resize();camera.position.set(camX+9,15.7,camZ+24);camera.lookAt(camX,.13,camZ);renderer.render(scene,camera);canvas.dataset.ready="true"}
  new ResizeObserver(drawStill).observe(canvas);drawStill();
  function update(now){requestAnimationFrame(update);if(document.hidden||now-last<30)return;const dt=Math.min(.075,(now-last)/1000);last=now;elapsed+=dt;
    let dx=(keys.has("arrowright")||keys.has("d")?1:0)-(keys.has("arrowleft")||keys.has("a")?1:0)+joy.x,dz=(keys.has("arrowdown")||keys.has("s")?1:0)-(keys.has("arrowup")||keys.has("w")?1:0)+joy.y;
    let wx=dx*.936+dz*.351,wz=-dx*.351+dz*.936;if(dx||dz)going=null;else if(going){wx=going.x-actor.position.x;wz=going.z-actor.position.z;if(Math.hypot(wx,wz)<.12){going=null;wx=wz=0}}
    const v=Math.hypot(wx,wz);if(v&&phase==="idle"&&!locked){const f=3.25*dt/(going?v:Math.max(v,1));const {x,z}=actor.position;const moved=moveTo(x+wx*f,z+wz*f)||moveTo(x+wx*f,z)||moveTo(x,z+wz*f);if(!moved)going=null;actor.rotation.y=Math.atan2(wx,wz);feet[0].rotation.x=Math.sin(elapsed*14)*.45;feet[1].rotation.x=-feet[0].rotation.x;body.position.y=Math.abs(Math.sin(elapsed*14))*.046}else{feet.forEach(f=>f.rotation.x=0);body.position.y=Math.sin(elapsed*2.2)*.014}
    rod.rotation.x=phase==="charge"?-.65:0;
    if(float.visible){const u=Math.min(1,(elapsed-castAt)/.58);tip.getWorldPosition(tipPos);float.position.copy(tipPos).lerp(target,u);float.position.y+=Math.sin(u*Math.PI)*1.8+Math.sin(elapsed*(phase==="bite"?13:3))*(phase==="bite"?.11:.025);const pos=thread.geometry.attributes.position;for(let i=0;i<13;i++){const p=i/12;pos.setXYZ(i,tipPos.x+(float.position.x-tipPos.x)*p,tipPos.y+(float.position.y-tipPos.y)*p-.22*Math.sin(p*Math.PI),tipPos.z+(float.position.z-tipPos.z)*p)}pos.needsUpdate=true}
    for(const f of fish){const a=elapsed*.22+f.phase;f.g.position.x=f.x+Math.sin(a)*1.2;f.g.position.z=f.z+Math.cos(a)*.65;f.g.rotation.y=Math.atan2(Math.cos(a)*1.2,-Math.sin(a)*.65)}
    birds.forEach((g,i)=>{const a=elapsed*.15+i*1.4;g.position.set(1+i*1.6+Math.sin(a)*1.4,3.5+Math.sin(a*2)*.26,-8-i*.8);g.rotation.z=Math.sin(a*3)*.16});
    waterMat.uniforms.clock.value=elapsed;const follow=ratio<1?.91:.56;const tx=(actor.position.x-3.05)*follow+(ratio<1?.55:0),tz=(actor.position.z-pierZ)*follow-2.5;
    camX+=(tx-camX)*(1-Math.exp(-dt*5));camZ+=(tz-camZ)*(1-Math.exp(-dt*5));camera.position.set(camX+9,15.7,camZ+24);camera.lookAt(camX,.13,camZ);onFrame(dt);renderer.render(scene,camera)}
  requestAnimationFrame(update);
  const ray=new T.Raycaster(),floor=new T.Plane(new T.Vector3(0,1,0),-.33);
  canvas.addEventListener("pointerdown",e=>{if(locked||phase!=="idle")return;const r=canvas.getBoundingClientRect(),p=new T.Vector3();ray.setFromCamera({x:(e.clientX-r.x)/r.width*2-1,y:1-(e.clientY-r.y)/r.height*2},camera);if(ray.ray.intersectPlane(floor,p)&&ground(p.x,p.z)!==null)going=p});
  return {keys,joy,canCast,position:()=>[Number(actor.position.x.toFixed(2)),Number(actor.position.z.toFixed(2))],restore(p){if(Array.isArray(p)&&p.every(Number.isFinite))moveTo(...p)},lock(v){locked=v;going=null;keys.clear();joy.x=joy.y=0},setPhase(next,p=0){phase=next;going=null;if(next==="charge"){const a=Math.atan2((actor.position.x+12)/12,(actor.position.z-2)/8.7);actor.rotation.y=a}
    if(next==="wait"){strength=p;castAt=elapsed;const d=2+strength*7;target.set(actor.position.x+Math.sin(actor.rotation.y)*d,.012,actor.position.z+Math.cos(actor.rotation.y)*d)}
    float.visible=thread.visible=next==="wait"||next==="bite"}};
}
