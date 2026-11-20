/* The map and 3D camera share an orthographic ground projection in both orientations. */
function beachWorld(canvas,onFrame,onDoor,onSplash,{mobile,chapter}){
  const T=THREE,scene=new T.Scene(),camera=new T.OrthographicCamera(-10,10,10,-10,.1,220);
  let renderer=null;
  if(!mobile)try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:"low-power"});renderer.setClearColor(0,0)}catch{}
  const overlay=document.createElement("canvas");overlay.className="light-actors";canvas.after(overlay);
  const sprites=new Image(),ink=overlay.getContext("2d");sprites.src="assets/crew.webp";
  scene.add(new T.HemisphereLight(0xfff5df,0xb9c9d3,2));
  const sun=new T.DirectionalLight(0xffe5b5,2.3);sun.position.set(-14,23,11);scene.add(sun);
  const {actor,tip,pose}=createAngler(T,scene);
  const boat=createSkiff(T);actor.add(boat);boat.visible=false;
  const home={x:3.05,z:1.65}, {unit,depth,spawn,door}=HARBOR;
  const pixel=p=>({x:spawn[0]+(p.x-home.x)*unit,y:spawn[1]+(p.z-home.z)*depth});
  const ground=(x,y)=>({x:(x-spawn[0])/unit+home.x,z:(y-spawn[1])/depth+home.z});
  actor.position.set(home.x,0,home.z);actor.rotation.y=.21;actor.scale.setScalar(1.13);
  const img=new Image(),back=document.querySelector("#coast"),ctx=back.getContext("2d");
  const sign=document.querySelector("#doorSign"),interact=document.querySelector("#interact"),distance=document.querySelector("#flightMark");
  const trail=document.querySelector("#castTrail path");
  const keys=new Set(),joy={x:0,y:0},target=new T.Vector3(),tipPos=new T.Vector3(),launch=new T.Vector3(),project=new T.Vector3();
  const bob=new T.Group();scene.add(bob);bob.visible=false;
  function bead(color,y,wide,high){const m=new T.Mesh(new T.SphereGeometry(1,12,8),new T.MeshBasicMaterial({color}));m.position.y=y;m.scale.set(wide,high,wide);bob.add(m)}
  bead(0x78422d,.06,.144,.15);bead(0xfffae1,.14,.15,.17);bead(0xf04d37,.25,.14,.15);bead(0xffd753,.39,.035,.12);
  const thread=new T.Line(new T.BufferGeometry().setAttribute("position",new T.BufferAttribute(new Float32Array(25*3),3)),new T.LineBasicMaterial({color:0xfffae6,transparent:true,opacity:.94}));
  thread.frustumCulled=false;thread.visible=false;scene.add(thread);
  const rings=[0,1,2].map(()=>{const m=new T.Mesh(new T.RingGeometry(.59,.63,40),new T.MeshBasicMaterial({color:0xf6fffa,side:T.DoubleSide,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);return m});
  const spray=Array.from({length:10},()=>{const m=new T.Mesh(new T.SphereGeometry(.063,6,4),new T.MeshBasicMaterial({color:0xffffff}));m.visible=false;scene.add(m);return m});
  const water=new Path2D();
  for(const boundary of HARBOR_WATER){
    boundary.forEach(([x,y],i)=>i?water.lineTo(x,y):water.moveTo(x,y));
    water.closePath();
  }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const reduced=matchMedia("(prefers-reduced-motion:reduce)").matches;
  let w=1,h=1,scale=1,base=1,cx=spawn[0],cy=spawn[1],angle=0,time=0,last=0,lastPaint=-1;
  let locked=false,phase="idle",route=[],near=false,meters=2,castTime=0,flightDuration=1,flight=0,splashed=false,wetLanding=false;
  let stepSide=1,stride=0,tracks=[];
  let spot=null,spotTimer=4,hotLanding=false;
  const beacon=document.querySelector("#seaMark");
  const shoalName=document.querySelector("#shoalName");
  shoalName.onclick=()=>{if(locked||phase!=="idle"||!spot)return;const p=ground(spot.x,spot.y);route=[];actor.rotation.y=Math.atan2(p.x-actor.position.x,p.z-actor.position.z)};
  const elevation=Math.asin(depth/unit);
  function screen(p){
    const a=(p.x-cx)*scale,b=(p.y-cy)*scale,c=Math.cos(angle),s=Math.sin(angle);
    return {x:w/2+c*a-s*b,y:h/2+s*a+c*b};
  }
  function mapAt(x,y){
    const a=x-w/2,b=y-h/2,c=Math.cos(angle),s=Math.sin(angle);
    return {x:cx+(c*a+s*b)/scale,y:cy+(-s*a+c*b)/scale};
  }
  function cameraView(dt,snap=false){
    const foot=pixel(actor.position),dest=bob.visible?pixel(target):foot;
    const flightBlend=bob.visible?(.13+.42*Math.sin(flight*Math.PI/2)):0;
    const fitX=w*.76/(Math.abs(dest.x-foot.x)+32),fitY=h*.58/(Math.abs(dest.y-foot.y)+120);
    const nextScale=bob.visible?Math.min(base,fitX,fitY):base;
    const ease=snap?1:1-Math.exp(-6*dt);
    scale+=(nextScale-scale)*ease;
    const portrait=w/h<.92;
    const aimX=foot.x+(dest.x-foot.x)*flightBlend+Math.sin(actor.rotation.y)*(portrait?14:25);
    const aimY=foot.y+(dest.y-foot.y)*flightBlend+(portrait?.06:.055)*h/scale+Math.cos(actor.rotation.y)*11;
    const pad=14,halfW=w/(2*scale),halfH=h/(2*scale);
    cx+=(clamp(aimX,-384+halfW+pad,1664-halfW-pad)-cx)*ease;
    cy+=(clamp(aimY,-360+halfH+pad,984-halfH-pad)-cy)*ease;
    const tilt=reduced?0:clamp((foot.x-540)/520*.027+Math.sin(actor.rotation.y)*.014,-.045,.045);
    angle+=(tilt-angle)*ease;
    const mid=ground(cx,cy);camera.left=-w/(2*unit*scale);camera.right=-camera.left;camera.top=h/(2*unit*scale);camera.bottom=-camera.top;
    camera.updateProjectionMatrix();camera.up.set(0,1,0);camera.position.set(mid.x,70*Math.sin(elevation),mid.z+70*Math.cos(elevation));camera.lookAt(mid.x,0,mid.z);camera.rotateZ(angle);camera.updateMatrixWorld();
    const tag=screen({x:door[0],y:door[1]-45});sign.style.left=tag.x+"px";sign.style.top=tag.y+"px";
    shoalName.hidden=true;
    if(spot&&phase==="idle"&&!locked){const s=screen({x:spot.x,y:spot.y-spot.ry-4});if(s.x>42&&s.x<w-42&&s.y>95&&s.y<h-95){shoalName.hidden=false;shoalName.style.left=s.x+"px";shoalName.style.top=s.y+"px"}}
    sign.hidden=boat.visible||phase!=="idle"||tag.x<38||tag.x>w-38||tag.y<65||tag.y>h-80||(tag.x>w-105&&tag.y<146);
    const mark=SEA_MARKS[chapter()];
    beacon.hidden=!boat.visible||!mark||phase!=="idle";
    if(!beacon.hidden){
      const p=screen(mark),bx=clamp(p.x,75,w-75);
      let by=clamp(p.y-23,h<480?90:130,h*.68);
      if(!shoalName.hidden&&Math.abs(bx-parseFloat(shoalName.style.left))<112&&Math.abs(by-parseFloat(shoalName.style.top))<31)by-=33;
      beacon.style.left=bx+"px";beacon.style.top=by+"px";
      const foot=pixel(actor.position),dx=(mark.x-foot.x)/unit,dz=(mark.y-foot.y)/depth;
      beacon.querySelector("b").textContent=mark.name+" · "+Math.round(Math.hypot(dx,dz))+" m";
      beacon.querySelector("i").style.transform="rotate("+Math.atan2(dx,-dz)+"rad)";
    }
  }
  function paint(){
    const dpr=back.width/w;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.translate(w/2,h/2);ctx.rotate(angle);ctx.scale(scale,scale);ctx.translate(-cx,-cy);
    const cos=Math.abs(Math.cos(angle)),sin=Math.abs(Math.sin(angle));
    const halfX=(cos*w+sin*h)/(2*scale)+4,halfY=(sin*w+cos*h)/(2*scale)+4;
    const x0=Math.max(-384,Math.floor(cx-halfX)),y0=Math.max(-360,Math.floor(cy-halfY));
    const x1=Math.min(1664,Math.ceil(cx+halfX)),y1=Math.min(984,Math.ceil(cy+halfY));
    const densityX=img.naturalWidth/2048,densityY=img.naturalHeight/1344;
    if(img.naturalWidth)ctx.drawImage(img,(x0+384)*densityX,(y0+360)*densityY,(x1-x0)*densityX,(y1-y0)*densityY,x0,y0,x1-x0,y1-y0);
    else{ctx.fillStyle="#f2d89b";ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.fillStyle="#289dba";ctx.fill(water,"evenodd")}
    ctx.save();ctx.clip(water,"evenodd");
    const left=x0,right=x1;
    const upper=Math.max(-360,Math.floor(y0/10)*10),lower=y1;
    if(renderer&&img.naturalWidth&&right>left)for(let y=upper;y<lower;y+=10){
      const dx=Math.sin(y*.085+time*1.4)*1.1+Math.sin(y*.044-time*.9)*.75;
      ctx.drawImage(img,(left+384)*img.width/2048,(y+360)*img.height/1344,(right-left)*img.width/2048,10*img.height/1344,left+dx,y,right-left,10.35);
    }
    for(let j=0;j<2;j++){
      const t=(time*.21+j*.5)%1;ctx.beginPath();
      HARBOR.shore.forEach(([x,y],i)=>{const yy=y+2+t*12+Math.sin(x*.072+time)*1.8;i?ctx.lineTo(x,yy):ctx.moveTo(x,yy)});
      ctx.strokeStyle="rgba(255,255,246,"+(.47*Math.sin(Math.PI*t))+")";ctx.lineWidth=1.6;ctx.stroke();
    }
    ctx.restore();
    if(chapter()===3){const glow=ctx.createRadialGradient(1151,177,1,1151,177,29);glow.addColorStop(0,"#fff4bb");glow.addColorStop(.25,"rgba(192,255,250,.8)");glow.addColorStop(1,"rgba(100,239,242,0)");ctx.fillStyle=glow;ctx.fillRect(1122,148,58,58)}
    if(spot){
      const pulse=reduced?0:Math.sin(time*3);
      ctx.beginPath();ctx.ellipse(spot.x,spot.y,spot.rx,spot.ry,0,0,Math.PI*2);
      ctx.fillStyle="rgba(255,207,65,.19)";ctx.fill();ctx.strokeStyle="#fff1a0";ctx.lineWidth=2.8;ctx.stroke();
      ctx.beginPath();ctx.ellipse(spot.x,spot.y,spot.rx-5+pulse*1.5,spot.ry-4+pulse,0,0,Math.PI*2);ctx.setLineDash([8,7]);ctx.lineDashOffset=-time*6;ctx.strokeStyle="#dba841";ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<3;i++){const a=time*.5+i*2.1,x=spot.x+Math.cos(a)*spot.rx*.51,y=spot.y+Math.sin(a)*spot.ry*.46;ctx.fillStyle="#fff3ae";ctx.beginPath();ctx.ellipse(x,y,5,2,a*.15,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-4,y);ctx.lineTo(x-8,y-3);ctx.lineTo(x-8,y+3);ctx.fill()}
    }
    const mark=SEA_MARKS[chapter()];
    if(boat.visible&&mark){const y=mark.y+Math.sin(time*2)*1.4;ctx.fillStyle="#155165";ctx.beginPath();ctx.ellipse(mark.x,y+1,16,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ed854b";ctx.beginPath();ctx.ellipse(mark.x,y-4,10,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff3bb";ctx.fillRect(mark.x-2,y-24,4,17);ctx.fillStyle="#e8aa3c";ctx.beginPath();ctx.moveTo(mark.x+2,y-24);ctx.lineTo(mark.x+16,y-20);ctx.lineTo(mark.x+2,y-16);ctx.fill()}
    for(const mark of tracks){const alpha=(1-(time-mark.t)/5)*.25;if(alpha<=0)continue;ctx.fillStyle="rgba(123,91,63,"+alpha+")";ctx.beginPath();ctx.ellipse(mark.x,mark.y,1.6,3,mark.angle,0,2*Math.PI);ctx.fill()}
  }
  function resize(){
    w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);
    base=Math.max(w/1280,h/(w/h<.92?1240:770))*(w/h<.92?1.05:1.14);
    actor.scale.setScalar(clamp(1.24/base,1.03,1.68));
    const nativeRatio=devicePixelRatio||1;
    const dpr=Math.min(nativeRatio,renderer?2:1.25,Math.sqrt((renderer?3200000:850000)/(w*h)));
    back.width=Math.round(w*dpr);back.height=Math.round(h*dpr);ctx.imageSmoothingQuality="medium";
    if(renderer){renderer.setPixelRatio(Math.min(nativeRatio,1.75,Math.sqrt(2000000/(w*h))));renderer.setSize(w,h,false)}
    overlay.width=renderer?1:Math.round(w*dpr);overlay.height=renderer?1:Math.round(h*dpr);
    canvas.dataset.renderer=renderer?"webgl":"light";cameraView(0,true);paint();drawActors(false);
  }
  const artFiles=renderer?["harbor-hd","harbor-mobile","harbor"]:["harbor-mobile","harbor"];
  function loadMap(){if(artFiles.length)img.src="assets/"+artFiles.shift()+".webp";else{paint();canvas.dataset.ready="true"}}
  canvas.addEventListener("webglcontextlost",e=>{
    e.preventDefault();renderer=null;canvas.style.opacity="0";
    artFiles.splice(0,artFiles.length,"harbor-mobile","harbor");loadMap();resize();
  });
  img.onload=()=>{paint();canvas.dataset.ready="true"};img.onerror=loadMap;loadMap();
  new ResizeObserver(resize).observe(canvas);resize();
  function nearDoor(){
    const p=pixel(actor.position);return !boat.visible&&Math.hypot((p.x-door[0])/49,(p.y-door[1])/32)<1;
  }
  function atBuoy(){const m=SEA_MARKS[chapter()],p=pixel(actor.position);return boat.visible&&m&&Math.hypot((p.x-m.x)/unit,(p.y-m.y)/depth)<3}
  function updateDoor(){
    near=nearDoor();interact.disabled=!(near||atBuoy())||phase!=="idle"||locked;
    const actionLabel=atBuoy()?"부표 조사":near?"가게 입장":"상호작용",span=interact.querySelector("span");
    interact.title=boat.visible?"가까운 부표 조사":"상점 문 가까이에서 대화";
    if(span.textContent!==actionLabel)span.textContent=actionLabel;
    sign.classList.toggle("near",near);
  }
  function move(x,z){
    const p=pixel({x,z});if(boat.visible?!navigable(p):!harborGround(p.x,p.y))return false;
    actor.position.set(x,0,z);return true;
  }
  let marker=null;
  const markerEl=document.querySelector("#mapMark");
  function mark(p,aim){marker={p,until:time+1.35};markerEl.dataset.kind=aim?"aim":"walk";markerEl.hidden=false}
  function walkTo(p){
    if(locked||phase!=="idle"||!harborGround(p.x,p.y))return;
    route=harborRoute(pixel(actor.position),p).map(n=>ground(n.x,n.y));if(route.length)mark(p,false);
  }
  function updateFlight(){
    const age=(performance.now()-castTime)/1000;
    flight=clamp(age/flightDuration,0,1);
    const arc=4*flight*(1-flight)*(.9+meters*.14);
    bob.position.copy(launch).lerp(target,flight);bob.position.y+=arc;
    bob.scale.setScalar(clamp(1.45/scale,.95,2.5));
    if(flight<1&&!reduced){
      const sides=[[],[]],points=[];
      for(let i=0;i<=7;i++){
        const u=Math.max(0,flight-.20*(1-i/7));project.copy(launch).lerp(target,u);
        project.y+=4*u*(1-u)*(.9+meters*.14);project.project(camera);
        points.push({x:(project.x+1)*w/2,y:(1-project.y)*h/2});
      }
      points.forEach((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(7,i+1)];
        const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1,r=1.9*i/7;
        sides[0].push([p.x-r*dy/n,p.y+r*dx/n]);sides[1].unshift([p.x+r*dy/n,p.y-r*dx/n]);
      });
      trail.setAttribute("d","M"+sides.flat().map(p=>p.join(",")).join("L")+"Z");
    }else trail.removeAttribute("d");
    if(flight===1&&wetLanding)bob.position.y+=Math.sin(time*(phase==="bite"?17:4))*(phase==="bite"?.14:.025);
    tip.getWorldPosition(tipPos);
    const points=thread.geometry.attributes.position;
    for(let i=0;i<25;i++){const f=i/24;points.setXYZ(i,tipPos.x+(bob.position.x-tipPos.x)*f,tipPos.y+(bob.position.y-tipPos.y)*f+Math.sin(Math.PI*f)*(arc*.32-.16),tipPos.z+(bob.position.z-tipPos.z)*f)}
    points.needsUpdate=true;
    const after=age-flightDuration;
    if(after>=0&&!splashed){splashed=true;onSplash(wetLanding)}
    rings.forEach((m,i)=>{const t=(Math.max(0,after)*.72+i/3)%1;m.visible=wetLanding&&after>=0;m.position.copy(target);m.scale.setScalar(.22+t*(after<1.5?2.6:1.45));m.material.opacity=(1-t)*.82});
    spray.forEach((m,i)=>{m.visible=wetLanding&&after>=0&&after<.52;if(!m.visible)return;const u=after/.52,a=i*2.4,r=u*(.52+.05*i);m.position.set(target.x+Math.cos(a)*r,.05+Math.sin(Math.PI*u)*(.4+(i%3)*.18),target.z+Math.sin(a)*r);m.scale.setScalar(1-u*.6)});
    project.copy(bob.position).project(camera);
    const bobX=(project.x+1)*w/2, labelSide=bobX>w-76?-1:1;
    distance.style.left=clamp(bobX+labelSide*39,30,w-30)+"px";
    distance.style.top=clamp((1-project.y)*h/2-5,25,h-25)+"px";
    distance.textContent=(meters*flight).toFixed(1)+" m";distance.hidden=after>.85;
  }
  function drawActors(walking){
    if(renderer){renderer.render(scene,camera);return}
    const ratio=overlay.width/w;
    ink.setTransform(ratio,0,0,ratio,0,0);ink.clearRect(0,0,w,h);
    const foot=screen(pixel(actor.position)),dir=(Math.round(actor.rotation.y*4/Math.PI)%8+8)%8;
    const size=5.6*unit*scale*actor.scale.x;
    function sprite(row){
      if(!sprites.naturalWidth)return;
      ink.save();ink.translate(foot.x,foot.y);ink.rotate(angle);
      ink.drawImage(sprites,dir*160,row*160,160,160,-size/2,-size/2,size,size);ink.restore();
    }
    if(boat.visible)sprite(4);
    sprite(phase==="charge"?3:walking?(Math.sin(time*12)>0?1:2):0);
    if(!sprites.naturalWidth){ink.fillStyle="#276c69";ink.fillRect(foot.x-6,foot.y-19,12,18);ink.fillStyle="#e8b56c";ink.beginPath();ink.ellipse(foot.x,foot.y-23,11,5,0,0,Math.PI*2);ink.fill()}
    if(!bob.visible)return;
    function point(v){project.copy(v).project(camera);return [(project.x+1)*w/2,(1-project.y)*h/2]}
    const [x,y]=point(bob.position),[sx,sy]=point(tipPos);
    ink.beginPath();ink.moveTo(sx,sy);ink.quadraticCurveTo((sx+x)/2,(sy+y)/2+3,x,y);ink.strokeStyle="#fff6d9";ink.lineWidth=1;ink.stroke();
    if(flight>=1&&wetLanding){const r=4+((time*10)%13);ink.beginPath();ink.ellipse(x,y+3,r,r*.42,0,0,Math.PI*2);ink.strokeStyle="#d6fbeb";ink.stroke()}
    ink.fillStyle="#fff1c9";ink.beginPath();ink.ellipse(x,y-1,3.8,5,0,0,Math.PI*2);ink.fill();ink.fillStyle="#e46243";ink.beginPath();ink.arc(x,y-2,3.8,Math.PI,2*Math.PI);ink.fill();
  }
  function navigable(p){
    return p.x>-160&&p.x<1420&&p.y<880&&[[0,0],[-19,0],[19,0],[0,-15],[0,15]].every(([x,y])=>harborWater(p.x+x,p.y+y));
  }
  function updateShoal(dt){
    if(phase!=="idle")return;
    spotTimer-=dt;if(spotTimer>0)return;
    if(spot){spot=null;spotTimer=18+Math.random()*20;return}
    const foot=pixel(actor.position),start=Math.random()*Math.PI*2;
    for(let i=0;i<32;i++){
      const a=start+i*2.4,r=6+i%10;
      const p={x:foot.x+Math.sin(a)*r*unit,y:foot.y+Math.cos(a)*r*depth,rx:39,ry:26};
      if([[0,0],[-39,0],[39,0],[0,-26],[0,26]].every(([dx,dy])=>harborWater(p.x+dx,p.y+dy))){spot=p;break}
    }
    spotTimer=spot?42:3;
  }
  function changeArea(atSea,p){
    boat.visible=atSea;route=[];keys.clear();joy.x=joy.y=0;tracks=[];spot=null;spotTimer=3;marker=null;markerEl.hidden=true;
    actor.position.set(p.x,0,p.z);actor.rotation.y=.21;cameraView(0,true);updateDoor();paint();drawActors(false);
  }
  function update(now){
    requestAnimationFrame(update);if(document.hidden||now-last<31)return;
    const dt=Math.min(.085,(now-last)/1000);last=now;if(locked){onFrame(dt);return}time+=dt;updateShoal(dt);
    let dx=Number(keys.has("arrowright")||keys.has("d"))-Number(keys.has("arrowleft")||keys.has("a"))+joy.x;
    let dz=Number(keys.has("arrowdown")||keys.has("s"))-Number(keys.has("arrowup")||keys.has("w"))+joy.y;
    if(dx||dz){
      route=[];
      const c=Math.cos(angle),s=Math.sin(angle),strength=Math.min(1,Math.hypot(dx,dz));
      const x=(c*dx+s*dz)/unit,z=(-s*dx+c*dz)/depth,mag=Math.hypot(x,z);
      dx=x/mag*strength;dz=z/mag*strength;
    }else{
      while(route.length&&Math.hypot(route[0].x-actor.position.x,route[0].z-actor.position.z)<.07)route.shift();
      if(route.length){dx=route[0].x-actor.position.x;dz=route[0].z-actor.position.z}
    }
    const speed=Math.hypot(dx,dz),walking=speed>.015&&phase==="idle";
    if(walking){
      const pace=boat.visible?9:4.6,step=route.length?Math.min(speed,pace*dt)/speed:pace*dt/Math.max(1,speed),{x,z}=actor.position;
      if(!(move(x+dx*step,z+dz*step)||move(x+dx*step,z)||move(x,z+dz*step)))route=[];
      actor.rotation.y=Math.atan2(dx,dz);const p=pixel(actor.position);stride+=Math.hypot(actor.position.x-x,actor.position.z-z);
      if(stride>.45){stride=0;stepSide*=-1;if(p.y>170&&harborGround(p.x,p.y)==="land"){tracks.push({x:p.x+stepSide*2.5,y:p.y,t:time,angle:-actor.rotation.y});if(tracks.length>12)tracks.shift()}}
      if(!boat.visible&&Math.hypot((p.x-door[0])/11,(p.y-door[1])/7)<1){route=[];onDoor();return}
    }
    pose(walking,phase,time,(performance.now()-castTime)/1000);
    const oldX=cx,oldY=cy,oldAngle=angle,oldScale=scale;cameraView(dt);
    if(marker){
      const point=screen(marker.p);markerEl.style.left=point.x+"px";markerEl.style.top=point.y+"px";
      if(time>=marker.until||phase!=="idle"){markerEl.hidden=true;marker=null}
    }
    if(bob.visible)updateFlight();
    if(time-lastPaint>.085||Math.abs(oldX-cx)+Math.abs(oldY-cy)>.16||Math.abs(oldAngle-angle)>.0002||Math.abs(oldScale-scale)>.0005){paint();lastPaint=time}
    updateDoor();onFrame(dt);drawActors(walking);
  }
  requestAnimationFrame(update);
  function tap(clientX,clientY){
    if(locked||phase!=="idle")return;
    const r=canvas.getBoundingClientRect(),p=mapAt(clientX-r.left,clientY-r.top);
    if(!boat.visible&&Math.abs(p.x-door[0])<19&&p.y>door[1]-29&&p.y<door[1]+8){walkTo({x:door[0],y:door[1]+2});return}
    if(harborWater(p.x,p.y)){
      const aim=ground(p.x,p.y);route=[];actor.rotation.y=Math.atan2(aim.x-actor.position.x,aim.z-actor.position.z);
      mark(p,true);return;
    }
    if(!boat.visible)walkTo(p);
  }
  function walkToShop(){walkTo({x:door[0],y:door[1]+2})}
  sign.onclick=walkToShop;
  return {keys,joy,nearDoor,walkToShop,position(){return [+actor.position.x.toFixed(3),+actor.position.z.toFixed(3)]},
    tap,
    aboard(){return boat.visible},atBuoy,
    depart(){changeArea(true,ground(394,426))},
    returnHome(){changeArea(false,ground(...HARBOR.exit))},
    restore(p,unlocked){const valid=Array.isArray(p)&&p.length===2&&p.every(Number.isFinite),saved=valid?{x:p[0],z:p[1]}:home,at=pixel(saved),sea=!!unlocked&&navigable(at);changeArea(sea,sea||harborGround(at.x,at.y)?saved:home)},
    leaveShop(){const p=ground(...HARBOR.exit);actor.position.set(p.x,0,p.z);actor.rotation.y=.15;route=[];updateDoor()},
    lock(v){locked=v;keys.clear();joy.x=joy.y=0;route=[];updateDoor()},
    landed(){return bob.visible&&flight>=1},
    inWater(){return bob.visible&&wetLanding},
    shoalHit(){return wetLanding&&hotLanding},
    dryReturnDue(){return !wetLanding&&flight>=1&&(performance.now()-castTime)/1000>flightDuration+.6},
    preview(range){
      if(phase!=="charge")return;
      tip.getWorldPosition(project);project.project(camera);
      const startX=(project.x+1)*w/2,startY=(1-project.y)*h/2;
      const landing=pixel({x:actor.position.x+Math.sin(actor.rotation.y)*range,z:actor.position.z+Math.cos(actor.rotation.y)*range});
      const end=screen(landing);
      const bend=(.9+range*.14)*unit*scale*Math.cos(elevation)*2;
      document.querySelector("#aimCurve").setAttribute("d","M"+startX+","+startY+" Q"+((startX+end.x)/2)+","+((startY+end.y)/2-bend)+" "+end.x+","+end.y);
      document.querySelector("#aimSpot").setAttribute("transform","translate("+end.x+" "+end.y+")");
      return harborWater(landing.x,landing.y)?(inShoal(landing,spot)?"황금 어군":"바다"):"육지";
    },
    setPhase(next,range=2){
      phase=next;route=[];if(next==="wait"){meters=range;castTime=performance.now();flight=0;splashed=false;flightDuration=.73+range*.055;
        actor.updateMatrixWorld(true);tip.getWorldPosition(launch);
        target.set(actor.position.x+Math.sin(actor.rotation.y)*range,.035,actor.position.z+Math.cos(actor.rotation.y)*range);
        const impact=pixel(target);wetLanding=harborWater(impact.x,impact.y);hotLanding=wetLanding&&inShoal(impact,spot);
      }
      bob.visible=thread.visible=next==="wait"||next==="bite";
      if(!bob.visible){trail.removeAttribute("d");distance.hidden=true;for(const m of [...rings,...spray])m.visible=false}
      updateDoor();
    }
  };
}
