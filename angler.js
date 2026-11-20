function createAngler(T, scene) {
  const actor=new T.Group(), body=new T.Group(), head=new T.Group();
  scene.add(actor);actor.add(body);body.add(head);head.position.y=1.26;
  const sphere=new T.SphereGeometry(1,18,12), mats=new Map();
  function part(parent,geo,color,x,y,z){
    if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.82}));
    const mesh=new T.Mesh(geo,mats.get(color));mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  }
  function oval(parent,color,x,y,z,w,h,d){
    const m=part(parent,sphere,color,x,y,z);m.scale.set(w,h,d);return m;
  }
  function joint(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
  function link(parent,a,b,r1,r2,color){
    const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);
    const m=part(parent,new T.CylinderGeometry(r2,r1,v.length(),10),color,0,0,0);
    m.position.copy(p).lerp(q,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
    return m;
  }
  function lathe(parent,points,color,x,y,z){
    return part(parent,new T.LatheGeometry(points.map(([r,h])=>new T.Vector2(r,h)),36),color,x,y,z);
  }
  const skin=0xf6b185,hair=0x553a32,denim=0x344f65,linen=0xffe6b4,brass=0xe5b45f;
  const legs=[-.16,.16].map(x=>{
    const leg=joint(body,x,.37,0);
    oval(leg,denim,0,-.03,0,.149,.18,.15);
    oval(leg,0xd49d70,0,-.155,.012,.106,.12,.107);
    oval(leg,0x6d4639,0,-.25,.052,.16,.13,.215);
    oval(leg,0x4b4040,0,-.304,.067,.163,.058,.216);
    oval(leg,0xb58257,0,-.21,.128,.121,.047,.095);
    return leg;
  });
  oval(body,linen,0,.74,0,.36,.36,.26);
  oval(body,denim,0,.55,.018,.35,.265,.266);
  oval(body,0x40647a,0,.72,.185,.235,.209,.105);
  for(const x of [-.163,.163]){
    link(body,[x,.71,.267],[x*1.13,.976,.11],.048,.045,denim);
    oval(body,brass,x,.765,.282,.035,.036,.018);
  }
  oval(body,0x53758a,0,.64,.283,.127,.079,.024);
  oval(body,0xbc7a49,0,.70,-.262,.294,.28,.154);
  oval(body,0xd6a06a,0,.80,-.348,.287,.15,.10);
  oval(body,brass,0,.713,-.427,.038,.049,.018);
  oval(head,skin,0,0,.013,.405,.386,.35);
  oval(head,hair,0,.07,-.128,.407,.362,.302);
  for(const side of [-1,1]){
    oval(head,skin,side*.391,-.005,-.005,.073,.099,.076);
    oval(head,0xde936e,side*.423,-.005,.034,.029,.051,.032);
    oval(head,hair,side*.332,.06,.09,.086,.149,.088);
    const x=.145*side;
    oval(head,0x352e2d,x,.02,.332,.047,.062,.021);
    oval(head,0xfffbdf,x-.011,.043,.352,.012,.014,.007);
    oval(head,0xe99578,side*.249,-.064,.274,.054,.025,.015);
    const brow=oval(head,hair,x,.103,.313,.059,.016,.014);brow.rotation.z=side*.12;
  }
  oval(head,0xf4ac79,0,-.053,.35,.064,.052,.057);
  const smile=new T.CatmullRomCurve3([new T.Vector3(-.055,-.109,.341),new T.Vector3(0,-.13,.343),new T.Vector3(.055,-.109,.341)]);
  part(head,new T.TubeGeometry(smile,12,.009,6,false),0x9d5e4a,0,0,0);
  for(let j=0;j<5;j++){const x=(j-2)*.105;
    const fringe=oval(head,hair,x,.211-.028*(j%3),.259-Math.abs(x)*.35,.092,.103,.086);
    fringe.rotation.z=-.37+j*.11;
  }
  const hat=joint(head,0,.245,-.014);hat.rotation.x=-.135;hat.rotation.z=.055;
  const brim=lathe(hat,[[.02,0],[.39,-.015],[.53,-.025],[.615,.018],[.621,.041],[.55,.029],[.41,.041],[.02,.047]],0xe7b66e,0,0,0);
  brim.scale.z=.92;
  const crown=lathe(hat,[[.415,.01],[.424,.074],[.384,.274],[.345,.32],[.205,.338],[.02,.315]],0xe8ba77,0,0,0);
  crown.scale.z=.93;
  const band=lathe(hat,[[.425,.066],[.425,.086],[.409,.151],[.397,.156]],0x765345,0,0,0);band.scale.z=.94;
  for(const [r,h] of [[.482,.02],[.54,.025],[.585,.03],[.373,.277]]){
    const thread=part(hat,new T.TorusGeometry(r,.0055,4,48),0xc5965b,0,h,0);
    thread.rotation.x=Math.PI/2;thread.scale.y=.925;
  }
  const charm=oval(hat,0x78a48f,-.382,.19,.085,.045,.118,.022);charm.rotation.z=-.5;
  const arms=[-.335,.335].map((x,i)=>{
    const arm=joint(body,x,.853,.02);arm.rotation.z=i?.12:-.18;
    oval(arm,linen,0,-.02,0,.137,.139,.143);
    oval(arm,0xe1bb8c,0,-.108,.033,.114,.045,.11);
    link(arm,[0,-.108,.028],[0,-.199,.14],.087,.076,skin);
    oval(arm,skin,0,-.207,.159,.093,.097,.106);return arm;
  });
  const rod=joint(arms[1],0,-.206,.17);
  link(rod,[0,-.09,-.05],[.09,.19,.18],.047,.041,0x875944);
  link(rod,[.09,.19,.18],[.31,.84,.65],.035,.026,0xbd8847);
  link(rod,[.31,.84,.65],[.52,1.39,1.09],.025,.013,0xe1b567);
  for(const [x,y,z] of [[.105,.23,.21],[.292,.79,.612],[.5,1.35,1.06]]){
    const guide=part(rod,new T.TorusGeometry(.025,.008,5,9),0x64797b,x,y,z);guide.rotation.y=.7;
  }
  oval(rod,0x626a63,-.015,.026,.094,.076,.075,.046);
  oval(rod,brass,-.015,.026,.127,.048,.049,.018);
  const tip=joint(rod,.52,1.39,1.09);
  // Rigid pieces share a draw call while the joints remain independently animated.
  const painted=new T.MeshStandardMaterial({vertexColors:true,roughness:.82});
  for(const joint of [legs[0],legs[1],body,head,hat,arms[0],arms[1],rod]){
    const pieces=joint.children.filter(child=>child.isMesh);
    const positions=[],normals=[],colors=[],indices=[];
    for(const piece of pieces){
      piece.updateMatrix();
      const geometry=piece.geometry.clone().applyMatrix4(piece.matrix);
      const {position,normal}=geometry.attributes,offset=positions.length/3,color=piece.material.color;
      positions.push(...position.array);normals.push(...normal.array);
      for(let i=0;i<position.count;i++)colors.push(color.r,color.g,color.b);
      const index=geometry.index;
      for(let i=0;i<(index?index.count:position.count);i++)indices.push(offset+(index?index.getX(i):i));
      joint.remove(piece);
    }
    const merged=new T.BufferGeometry();
    for(const [name,values] of [["position",positions],["normal",normals],["color",colors]]){
      merged.setAttribute(name,new T.Float32BufferAttribute(values,3));
    }
    merged.setIndex(indices);joint.add(new T.Mesh(merged,painted));
  }
  const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=64;
  const sc=shadowCanvas.getContext("2d"),grad=sc.createRadialGradient(32,32,5,32,32,30);
  grad.addColorStop(0,"rgba(63,43,47,.52)");grad.addColorStop(1,"rgba(63,43,47,0)");sc.fillStyle=grad;sc.fillRect(0,0,64,64);
  const shadow=new T.Mesh(new T.PlaneGeometry(1.4,.91),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.set(.065,0,.035);actor.add(shadow);
  actor.rotation.y=1.08;
  function pose(walking,phase,t,flight){
    const stride=walking?Math.sin(t*12):0;
    legs[0].rotation.x=stride*.42;legs[1].rotation.x=-stride*.42;
    body.position.y=walking?Math.abs(stride)*.041:Math.sin(t*2.15)*.011;
    head.rotation.z=walking?stride*.035:Math.sin(t*1.45)*.014;
    arms[0].rotation.x=-stride*.28;
    arms[1].rotation.x=phase==="charge"?-.72:phase==="wait"&&flight<.55?-.7+Math.sin(Math.min(1,flight/.55)*Math.PI/2)*.88:.08;
    rod.rotation.x=phase==="bite"?Math.sin(t*10)*.06:0;
  }
  return {actor,tip,pose};
}
