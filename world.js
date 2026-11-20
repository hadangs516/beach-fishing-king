/* Each coastal illustration uses its own pixel coordinates and shore geometry. */
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
  function cyl(x,y,z,top,base,h,n,color,parent=scene){return mesh(new T.CylinderGeometry(top,base,h,n),color,x,y,z,parent)}

  const {actor,tip,pose}=createAngler(T,scene);
  const start={x:3.05,z:1.65};
  actor.position.set(start.x,0,start.z);
  const float=group(0,0,0,scene);ball(0,.075,0,.10,.12,.10,0xffedca,float,1);ball(0,.16,0,.096,.08,.096,0xe36345,float,1);cyl(0,.28,0,.024,.03,.18,7,0x9a6348,float);float.visible=false;
  const thread=new T.Line(new T.BufferGeometry().setAttribute("position",new T.BufferAttribute(new Float32Array(13*3),3)),new T.LineBasicMaterial({color:0xfff3cb,transparent:true,opacity:.82}));thread.frustumCulled=false;thread.visible=false;scene.add(thread);

  let viewMap=BEACH_VIEWS.wide,art=null,ocean,waterMask;
  let w=1,h=1,scale=1,ox=0,oy=0,elapsed=0,last=0,lastPaint=-1,phase="idle",locked=false,going=null,castAt=0;
  const keys=new Set(),joy={x:0,y:0},target=new T.Vector3(),tipPos=new T.Vector3();
  const backdrop=document.querySelector("#coast"),ctx=backdrop.getContext("2d");
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const maps=new Map(),tracks=[];let trackDistance=0,stepSide=1;
  const toMap=(x,z,map=viewMap)=>({x:map.spawn[0]+(x-start.x)*map.unit,y:map.spawn[1]+(z-start.z)*map.depth});
  const toWorld=(x,y,map=viewMap)=>({x:(x-map.spawn[0])/map.unit+start.x,z:(y-map.spawn[1])/map.depth+start.z});
  const walkable=(x,z)=>!!beachTriangleAt(toMap(x,z),viewMap);

  function changeMap(next) {
    const previous=viewMap;
    const foot=otherBeachView(toMap(actor.position.x,actor.position.z),previous,next);
    const targetPixel=toMap(target.x,target.z);
    const oldFoot=toMap(actor.position.x,actor.position.z);
    viewMap=next;const pos=toWorld(foot.x,foot.y);actor.position.set(pos.x,0,pos.z);
    if(phase==="wait"||phase==="bite"){
      target.x=pos.x+(targetPixel.x-oldFoot.x)/previous.unit;
      target.z=pos.z+(targetPixel.y-oldFoot.y)/previous.depth;
    }
    going=null;tracks.length=0;trackDistance=0;
    ocean=new Path2D();viewMap.coast.forEach(([x,y],i)=>i?ocean.lineTo(x,y):ocean.moveTo(x,y));
    ocean.lineTo(...viewMap.seaBottom);ocean.closePath();
    waterMask=new Path2D();waterMask.rect(0,0,viewMap.width,viewMap.height);
    viewMap.pierMask.forEach(([x,y],i)=>i?waterMask.lineTo(x,y):waterMask.moveTo(x,y));waterMask.closePath();
    if(!maps.has(next)){const img=new Image();maps.set(next,img);img.onload=()=>{if(viewMap===next){paint();canvas.dataset.ready="true"}};img.src=next.image}
    art=maps.get(next);canvas.dataset.ready=art.complete&&art.naturalWidth?"true":"loading";
  }
  function view(snap=false){
    const p=toMap(actor.position.x,actor.position.z),follow=phase==="wait"||phase==="bite"?toMap(target.x,target.z):p;
    const focusX=p.x+(follow.x-p.x)*.32,focusY=p.y+(follow.y-p.y)*.28;
    const anchor=viewMap===BEACH_VIEWS.tall?.33:.49;
    const tx=clamp(w*anchor-focusX*scale,w-viewMap.width*scale,0);
    const extra=viewMap.height*scale-h;
    const desired=-extra*.37+(viewMap.spawn[1]-focusY)*scale*.73;
    const ty=clamp(clamp(desired,h*.24-p.y*scale,h*.80-p.y*scale),-extra,0);
    const ease=snap?1:.16;ox+=(tx-ox)*ease;oy+=(ty-oy)*ease;
    const mid=toWorld((w/2-ox)/scale,(h/2-oy)/scale),elev=Math.asin(viewMap.depth/viewMap.unit);
    camera.position.set(mid.x,55*Math.sin(elev),mid.z+55*Math.cos(elev));camera.lookAt(mid.x,0,mid.z);
  }
  function paint(){
    if(!art?.complete||!art.naturalWidth)return;
    const {width:W,height:H,coast}=viewMap,dpr=backdrop.width/w;
    ctx.setTransform(dpr*scale,0,0,dpr*scale,ox*dpr,oy*dpr);
    ctx.drawImage(art,0,0,W,H);ctx.save();ctx.clip(ocean);ctx.clip(waterMask,"evenodd");
    const horizon=coast[0][1],stride=viewMap===BEACH_VIEWS.tall?12:9;
    for(let y=horizon;y<H;y+=stride){const v=Math.min(stride,H-y);
      const depth=clamp((y-horizon)/(H-horizon),0,1);
      const dx=(Math.sin(y*.042+elapsed*1.8)*2+Math.sin(y*.016-elapsed)*1.35)*(.25+depth);
      ctx.drawImage(art,0,y,W,v,dx,y,W,v+.35)}
    for(let wave=0;wave<2;wave++){
      const t=(elapsed*.18+wave*.5)%1;ctx.beginPath();
      for(let i=6;i<coast.length-1;i++){const a=coast[i],b=coast[i+1],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/8);
        for(let j=0;j<count;j++){const v=j/count,y=a[1]+(b[1]-a[1])*v,x=a[0]+(b[0]-a[0])*v+t*20+Math.sin(y*.056+elapsed)*2.6;
          if(i===6&&!j)ctx.moveTo(x,y);else ctx.lineTo(x,y)}}
      ctx.strokeStyle="rgba(255,254,238,"+(.34*Math.sin(Math.PI*t))+")";ctx.lineWidth=1.6+1.4*(1-t);ctx.stroke();
    }
    for(let i=0;i<82;i++){
      const a=Math.sin(elapsed*1.6+i*1.37);if(a<.22)continue;
      const x=(i*179.3)%W+Math.sin(elapsed+i)*3,y=horizon+(i*89.7)%(H-horizon);
      ctx.strokeStyle="rgba(248,255,247,"+(a*.61)+")";ctx.lineWidth=1.25;
      ctx.beginPath();ctx.moveTo(x-5,y);ctx.quadraticCurveTo(x,y+2,x+5,y-.5);ctx.stroke();
    }
    ctx.restore();
    for(const print of tracks){const alpha=(1-(elapsed-print.t)/8)*.24;if(alpha<=0)continue;
      ctx.fillStyle="rgba(139,99,61,"+alpha+")";ctx.beginPath();ctx.ellipse(print.x,print.y,3.3,6,print.angle,0,Math.PI*2);ctx.fill()}
  }
  function resize(){
    w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);
    const next=w/h<.92?BEACH_VIEWS.tall:BEACH_VIEWS.wide;
    if(!art||next!==viewMap)changeMap(next);
    scale=Math.max(w/viewMap.width,h/viewMap.height);
    const dpr=Math.min(devicePixelRatio||1,1.45);backdrop.width=Math.round(w*dpr);backdrop.height=Math.round(h*dpr);
    renderer.setSize(w,h,false);camera.left=-w/(2*viewMap.unit*scale);camera.right=-camera.left;
    camera.top=h/(2*viewMap.unit*scale);camera.bottom=-camera.top;camera.updateProjectionMatrix();
    view(true);paint();renderer.render(scene,camera);
  }
  // Render the profile from the actual angler so the badge matches the character.
  const portraitCamera=new T.OrthographicCamera(-.71,.71,.71,-.71,.1,15);
  portraitCamera.position.set(start.x+2.7,2.08,start.z+4);portraitCamera.lookAt(start.x,1.29,start.z);
  renderer.setSize(104,104,false);renderer.render(scene,portraitCamera);
  document.querySelector("#avatar").src=canvas.toDataURL("image/png");
  new ResizeObserver(resize).observe(canvas);resize();
  const rings=[0,1].map(()=>{const m=new T.Mesh(new T.RingGeometry(.40,.42,36),new T.MeshBasicMaterial({color:0xf1fff8,transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);return m});
  function move(x,z){if(!walkable(x,z))return false;actor.position.set(x,0,z);return true}
  function update(now){
    requestAnimationFrame(update);if(document.hidden||now-last<31)return;
    const dt=Math.min(.08,(now-last)/1000);last=now;
    if(locked){onFrame(dt);return}
    elapsed+=dt;
    let dx=Number(keys.has("arrowright")||keys.has("d"))-Number(keys.has("arrowleft")||keys.has("a"))+joy.x;
    let dz=Number(keys.has("arrowdown")||keys.has("s"))-Number(keys.has("arrowup")||keys.has("w"))+joy.y;
    if(dx||dz)going=null;else if(going){dx=going.x-actor.position.x;dz=going.z-actor.position.z;if(Math.hypot(dx,dz)<.10){going=null;dx=dz=0}}
    const speed=Math.hypot(dx,dz),walking=speed>.015&&!locked&&phase==="idle";
    if(walking){const step=3.2*dt/(going?speed:Math.max(1,speed)),{x,z}=actor.position;
      if(!(move(x+dx*step,z+dz*step)||move(x+dx*step,z)||move(x,z+dz*step)))going=null;
      trackDistance+=Math.hypot(actor.position.x-x,actor.position.z-z);
      if(trackDistance>.39){trackDistance=0;stepSide*=-1;const mark=toMap(actor.position.x,actor.position.z),hit=beachTriangleAt(mark,viewMap);
        if(hit&&hit.i>=viewMap.pierTriangleCount){tracks.push({x:mark.x+Math.cos(actor.rotation.y)*stepSide*4,y:mark.y,t:elapsed,angle:-actor.rotation.y});if(tracks.length>18)tracks.shift()}}
      actor.rotation.y=Math.atan2(dx,dz);}
    const foot=toMap(actor.position.x,actor.position.z);
    const depth=clamp((foot.y/viewMap.height-.38)/.45,0,1);
    actor.scale.setScalar(.75+depth*.72);
    pose(walking,phase,elapsed,elapsed-castAt);
    if(float.visible){const u=Math.min(1,(elapsed-castAt)/.55);tip.getWorldPosition(tipPos);float.position.copy(tipPos).lerp(target,u);float.position.y+=Math.sin(u*Math.PI)*1.9+Math.sin(elapsed*(phase==="bite"?16:3))*(phase==="bite"?.13:.027);
      const pos=thread.geometry.attributes.position;for(let i=0;i<13;i++){const p=i/12;pos.setXYZ(i,tipPos.x+(float.position.x-tipPos.x)*p,tipPos.y+(float.position.y-tipPos.y)*p-.18*Math.sin(p*Math.PI),tipPos.z+(float.position.z-tipPos.z)*p)}pos.needsUpdate=true;
      rings.forEach((m,i)=>{const wave=((elapsed-castAt)*(phase==="bite"?1.8:.8)+i*.5)%1;m.visible=u>=1;m.position.copy(target);m.scale.setScalar(.35+wave*1.6);m.material.opacity=(1-wave)*.76})}
    const px=ox,py=oy;view();if(elapsed-lastPaint>.075||Math.abs(px-ox)+Math.abs(py-oy)>.4){paint();lastPaint=elapsed}
    onFrame(dt);renderer.render(scene,camera)
  }
  requestAnimationFrame(update);
  canvas.addEventListener("pointerdown",e=>{if(locked||phase!=="idle")return;const r=canvas.getBoundingClientRect(),p=toWorld((e.clientX-r.left-ox)/scale,(e.clientY-r.top-oy)/scale);if(walkable(p.x,p.z))going=p});
  return {keys,joy,position(){const point=otherBeachView(toMap(actor.position.x,actor.position.z),viewMap,BEACH_VIEWS.wide);
      const w=toWorld(point.x,point.y,BEACH_VIEWS.wide);return [+w.x.toFixed(3),+w.z.toFixed(3)]},
    restore(p){const valid=Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
      const old=valid?toMap(p[0],p[1],BEACH_VIEWS.wide):null;
      if(old&&beachTriangleAt(old,BEACH_VIEWS.wide)){
        const projected=otherBeachView(old,BEACH_VIEWS.wide,viewMap),place=toWorld(projected.x,projected.y);
        actor.position.set(place.x,0,place.z);
      }else{actor.position.set(start.x,0,start.z)}view(true)},
    lock(v){locked=v;keys.clear();joy.x=joy.y=0;going=null},
    setPhase(next,meters=2){phase=next;going=null;if(next==="wait"){castAt=elapsed;const reach=meters*.32;
      target.set(actor.position.x+Math.sin(actor.rotation.y)*reach,.022,actor.position.z+Math.cos(actor.rotation.y)*reach)}
      float.visible=thread.visible=next==="wait"||next==="bite";if(!float.visible)rings.forEach(m=>m.visible=false)}
  };
}
