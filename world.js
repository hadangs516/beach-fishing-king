/* A painted orthographic environment with a live 3D angler, rod, float and line.
   Map coordinates refer to pixels in the 1536 × 1024 environment illustration. */
function beachWorld(canvas,onFrame) {
  const T=THREE,scene=new T.Scene(),camera=new T.OrthographicCamera(-10,10,10,-10,.1,130);
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.setClearColor(0,0);
  scene.add(new T.HemisphereLight(0xfff5df,0xb9c9d3,2.15));
  const sun=new T.DirectionalLight(0xffe4a9,2.4);sun.position.set(-14,23,11);scene.add(sun);
  const material=new Map();
  function mat(color){if(!material.has(color))material.set(color,new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));return material.get(color)}
  function mesh(geometry,color,x,y,z,parent=scene){const o=new T.Mesh(geometry,mat(color));o.position.set(x,y,z);parent.add(o);return o}
  function group(x,y,z,p=scene){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
  function ball(x,y,z,a,b,c,color,parent=scene,detail=0){const o=mesh(new T.IcosahedronGeometry(1,detail),color,x,y,z,parent);o.scale.set(a,b,c);return o}
  function box(x,y,z,w,h,d,color,parent=scene){return mesh(new T.BoxGeometry(w,h,d),color,x,y,z,parent)}
  function cyl(x,y,z,top,base,h,n,color,parent=scene){return mesh(new T.CylinderGeometry(top,base,h,n),color,x,y,z,parent)}
  function beam(a,b,r,color,parent=scene,top=r){const p=new T.Vector3(...a),q=new T.Vector3(...b),o=cyl(0,0,0,top,r,p.distanceTo(q),7,color,parent);o.position.copy(p).lerp(q,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o}

  const actor=group(3.05,0,1.65,scene),body=group(0,0,0,actor);
  const feet=[-.17,.17].map(x=>{const f=group(x,0,.015,body);box(0,.22,0,.23,.32,.25,0x324f59,f);ball(0,.09,.07,.175,.105,.22,0x855641,f,1);return f});
  ball(0,.61,0,.41,.41,.29,0x4a8385,body,1);box(0,.56,.23,.53,.43,.09,0xe89054,body);box(0,.44,.29,.34,.08,.04,0xf1b263,body);
  ball(0,1.23,0,.44,.43,.38,0xffc89b,body,2);ball(0,1.37,-.095,.445,.35,.35,0x674835,body,1);
  for(const x of [-.16,.16]){ball(x,1.24,.34,.034,.047,.025,0x453c35,body,1);ball(x*1.55,1.15,.294,.057,.029,.028,0xe99c7f,body)}
  ball(0,1.16,.37,.063,.052,.047,0xf1ac81,body,1);cyl(0,1.53,0,.62,.66,.093,24,0xddae62,body);cyl(0,1.69,-.01,.34,.43,.32,16,0xefc783,body);cyl(0,1.58,-.01,.423,.445,.09,16,0x8e674b,body);
  for(const x of [-.37,.37]){beam([x*.78,.79,0],[x,.62,.20],.112,0x508687,body);ball(x,.63,.22,.105,.12,.11,0xfbc293,body,1)}
  const rod=group(.37,.63,.21,body);const tip=new T.Object3D();tip.position.set(.55,1.43,1.12);rod.add(tip);
  beam([0,0,0],[.25,.75,.48],.044,0x94643c,rod,.034);beam([.25,.75,.48],[.55,1.43,1.12],.032,0xc49252,rod,.013);
  const shade=new T.Mesh(new T.CircleGeometry(1,28),new T.MeshBasicMaterial({color:0x553b38,opacity:.27,transparent:true,depthWrite:false}));shade.rotation.x=-Math.PI/2;shade.scale.set(.52,.36,1);shade.position.set(.06,.007,.04);actor.add(shade);actor.rotation.y=.35;
  const float=group(0,0,0,scene);ball(0,.075,0,.10,.12,.10,0xffedca,float,1);ball(0,.16,0,.096,.08,.096,0xe36345,float,1);cyl(0,.28,0,.024,.03,.18,7,0x9a6348,float);float.visible=false;
  const thread=new T.Line(new T.BufferGeometry().setAttribute("position",new T.BufferAttribute(new Float32Array(13*3),3)),new T.LineBasicMaterial({color:0xfff3cb,transparent:true,opacity:.82}));thread.frustumCulled=false;thread.visible=false;scene.add(thread);

  const W=1536,H=1024,X=52,Z=30,origin={x:780,y:548},start={x:3.05,z:1.65};
  const toMap=(x,z)=>({x:origin.x+(x-start.x)*X,y:origin.y+(z-start.z)*Z});
  const toWorld=(x,y)=>({x:(x-origin.x)/X+start.x,z:(y-origin.y)/Z+start.z});
  const shore=[[0,625],[95,609],[184,605],[268,612],[365,601],[455,611],[560,584],[638,579],[728,589],[796,583],[905,606],[985,586],[1064,578],[1158,565],[1262,577],[1338,583],[1422,555],[1536,535]];
  function heightOn(points,x){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}return points.at(-1)[1]}
  const back=[[0,453],[105,454],[220,375],[385,346],[615,340],[650,303],[833,303],[855,334],[1000,323],[1210,333],[1400,375],[1536,382]];
  const deck=[[50,480],[124,469],[409,805],[308,820]];
  function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
  function walkable(x,z){const p=toMap(x,z);if(inside(deck,p.x,p.y))return true;
    if(p.x<22||p.x>1512||p.y<heightOn(back,p.x)||p.y>heightOn(shore,p.x)-3)return false;
    return !inside([[35,372],[142,370],[219,434],[178,459],[74,455]],p.x,p.y);}
  const backdrop=document.querySelector("#coast"),ctx=backdrop.getContext("2d");
  const art=new Image();art.src="assets/sorabit-cove.webp";
  const ocean=new Path2D();shore.forEach(([x,y],i)=>i?ocean.lineTo(x,y):ocean.moveTo(x,y));ocean.lineTo(W,H);ocean.lineTo(0,H);ocean.closePath();
  // Cut the raised pier out of the animated water, including the posts and lantern.
  const pierCut=[[4,449],[149,449],[256,600],[318,641],[326,701],[369,720],[372,659],[437,658],[438,732],[385,740],[438,789],[435,911],[293,917],[277,838],[211,768],[160,729],[96,661],[60,620],[0,555]];
  pierCut.forEach(([x,y],i)=>i?ocean.lineTo(x,y):ocean.moveTo(x,y));ocean.closePath();
  const glints=Array.from({length:80},(_,i)=>({x:(i*179.3)%W,y:626+(i*89.7)%370,k:(i*1.37)%6.28}));
  let w=1,h=1,scale=1,ox=0,oy=0,elapsed=0,last=0,lastPaint=-1,phase="idle",locked=false,going=null,castAt=0;
  const keys=new Set(),joy={x:0,y:0},target=new T.Vector3(),tipPos=new T.Vector3();
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function view(snap=false){
    const p=toMap(actor.position.x,actor.position.z),follow=phase==="wait"||phase==="bite"?toMap(target.x,target.z):p;
    const focusX=p.x+(follow.x-p.x)*.26,focusY=p.y+(follow.y-p.y)*.22;
    const tx=clamp(w*.5-focusX*scale,w-W*scale,0),ty=clamp(h*.56-focusY*scale,h-H*scale,0);
    const ease=snap?1:.14;ox+=(tx-ox)*ease;oy+=(ty-oy)*ease;
    const mid=toWorld((w/2-ox)/scale,(h/2-oy)/scale);
    const elev=Math.asin(Z/X);
    camera.position.set(mid.x,55*Math.sin(elev),mid.z+55*Math.cos(elev));camera.lookAt(mid.x,0,mid.z);
  }
  function paint(){
    if(!art.complete||!art.naturalWidth)return;
    const dpr=backdrop.width/w;ctx.setTransform(dpr*scale,0,0,dpr*scale,ox*dpr,oy*dpr);
    ctx.drawImage(art,0,0,W,H);ctx.save();ctx.clip(ocean,"evenodd");
    for(let y=528;y<H;y+=8){const v=Math.min(8,H-y),dx=Math.sin(y*.049+elapsed*1.9)*1.8+Math.sin(y*.019-elapsed)*1.3;
      ctx.drawImage(art,0,y,W,v,dx,y,W,v+.3)}
    for(let wave=0;wave<3;wave++){const t=(elapsed*.19+wave/3)%1;ctx.beginPath();
      for(let x=0;x<=W;x+=9){const y=heightOn(shore,x)+6+36*t+3.3*Math.sin(x*.026+elapsed*1.35+wave)+2.2*Math.sin(x*.083+wave);if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
      ctx.strokeStyle="rgba(255,254,235,"+(.37*Math.sin(Math.PI*t))+")";ctx.lineWidth=1.8+1.5*(1-t);ctx.stroke()}
    for(const g of glints){const light=Math.sin(elapsed*1.7+g.k);if(light<.15)continue;
      const x=g.x+3*Math.sin(elapsed+g.k),y=g.y+1.5*Math.sin(elapsed*1.2+g.k);ctx.strokeStyle="rgba(237,255,247,"+light*.64+")";ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(x-5,y);ctx.quadraticCurveTo(x,y+2,x+5,y-.5);ctx.stroke()}
    ctx.restore();
    for(const side of [0,1]){const edge=side?W:0,inner=side?W-36:36;const fog=ctx.createLinearGradient(edge,0,inner,0);fog.addColorStop(0,"rgba(221,240,226,.55)");fog.addColorStop(1,"rgba(221,240,226,0)");ctx.fillStyle=fog;ctx.fillRect(Math.min(edge,inner),0,36,H)}
  }
  function resize(){w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);scale=Math.max(w/W,h/H);
    const dpr=Math.min(devicePixelRatio||1,1.45);backdrop.width=Math.round(w*dpr);backdrop.height=Math.round(h*dpr);
    renderer.setSize(w,h,false);camera.left=-w/(2*X*scale);camera.right=-camera.left;camera.top=h/(2*X*scale);camera.bottom=-camera.top;camera.updateProjectionMatrix();view(true);paint();renderer.render(scene,camera)}
  new ResizeObserver(resize).observe(canvas);art.onload=()=>{resize();canvas.dataset.ready="true"};resize();
  const rings=[0,1].map(()=>{const m=new T.Mesh(new T.RingGeometry(.40,.42,36),new T.MeshBasicMaterial({color:0xf1fff8,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);return m});
  function move(x,z){if(!walkable(x,z))return false;actor.position.set(x,0,z);return true}
  function update(now){
    requestAnimationFrame(update);if(document.hidden||now-last<31)return;
    const dt=Math.min(.08,(now-last)/1000);last=now;elapsed+=dt;
    let dx=Number(keys.has("arrowright")||keys.has("d"))-Number(keys.has("arrowleft")||keys.has("a"))+joy.x;
    let dz=Number(keys.has("arrowdown")||keys.has("s"))-Number(keys.has("arrowup")||keys.has("w"))+joy.y;
    if(dx||dz)going=null;else if(going){dx=going.x-actor.position.x;dz=going.z-actor.position.z;if(Math.hypot(dx,dz)<.10){going=null;dx=dz=0}}
    const speed=Math.hypot(dx,dz),walking=speed>.015&&!locked&&phase==="idle";
    if(walking){const step=3.2*dt/(going?speed:Math.max(1,speed)),{x,z}=actor.position;
      if(!(move(x+dx*step,z+dz*step)||move(x+dx*step,z)||move(x,z+dz*step)))going=null;
      actor.rotation.y=Math.atan2(dx,dz);}
    feet.forEach((f,i)=>f.rotation.x=walking?Math.sin(elapsed*15+i*Math.PI)*.44:0);
    body.position.y=walking?Math.abs(Math.sin(elapsed*15))*.035:Math.sin(elapsed*2)*.012;
    rod.rotation.x=phase==="charge"?-.55:0;
    if(float.visible){const u=Math.min(1,(elapsed-castAt)/.55);tip.getWorldPosition(tipPos);float.position.copy(tipPos).lerp(target,u);float.position.y+=Math.sin(u*Math.PI)*1.9+Math.sin(elapsed*(phase==="bite"?16:3))*(phase==="bite"?.13:.027);
      const pos=thread.geometry.attributes.position;for(let i=0;i<13;i++){const p=i/12;pos.setXYZ(i,tipPos.x+(float.position.x-tipPos.x)*p,tipPos.y+(float.position.y-tipPos.y)*p-.18*Math.sin(p*Math.PI),tipPos.z+(float.position.z-tipPos.z)*p)}pos.needsUpdate=true;
      rings.forEach((m,i)=>{const wave=((elapsed-castAt)*(phase==="bite"?1.8:.8)+i*.5)%1;m.visible=u>=1;m.position.copy(target);m.scale.setScalar(.35+wave*1.6);m.material.opacity=(1-wave)*.76})}
    const px=ox,py=oy;view();if(elapsed-lastPaint>.075||Math.abs(px-ox)+Math.abs(py-oy)>.4){paint();lastPaint=elapsed}
    onFrame(dt);renderer.render(scene,camera)
  }
  requestAnimationFrame(update);
  canvas.addEventListener("pointerdown",e=>{if(locked||phase!=="idle")return;const r=canvas.getBoundingClientRect(),p=toWorld((e.clientX-r.left-ox)/scale,(e.clientY-r.top-oy)/scale);if(walkable(p.x,p.z))going=p});
  return {keys,joy,position:()=>[+actor.position.x.toFixed(2),+actor.position.z.toFixed(2)],
    restore(p){if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||!move(...p))move(start.x,start.z);view(true)},
    lock(v){locked=v;keys.clear();joy.x=joy.y=0;going=null},
    setPhase(next,meters=2){phase=next;going=null;if(next==="wait"){castAt=elapsed;const reach=meters*.32;
      target.set(actor.position.x+Math.sin(actor.rotation.y)*reach,.022,actor.position.z+Math.cos(actor.rotation.y)*reach)}
      float.visible=thread.visible=next==="wait"||next==="bite";if(!float.visible)rings.forEach(m=>m.visible=false)}
  };
}
