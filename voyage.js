const SEA_MARKS = [
  {x:590,y:528,name:"종소리 부표",find:"표류한 편지",line:"유리 등갓이 깨진 날, 선장은 별빛을 담은 병을 동쪽에 띄웠다."},
  {x:966,y:638,name:"별유리 부표",find:"별유리 렌즈",line:"병 안에 푸른 렌즈가 들어 있었다. 소라 아저씨에게 가져가자."}
];
const canSail = s => s.caught >= 3 && s.rod >= 2;
function routeChart(s,pos){
  const x=v=>18+v*.227,y=v=>4+v*.126;
  const coast=HARBOR.shore.map(([a,b])=>x(a)+","+y(b)).join(" ");
  const points=[[352,135,"소라항"],...SEA_MARKS.map(m=>[m.x,m.y,m.name])];
  const dots=points.map(([a,b,name],i)=>'<circle cx="'+x(a)+'" cy="'+y(b)+'" r="4" fill="'+(i<=(s.voyage||0)?"#dfab58":"#fbebc3")+'"/><text x="'+x(a)+'" y="'+(y(b)+15)+'" text-anchor="middle">'+name+'</text>').join("");
  const boat=pos?'<circle class="chart-boat" cx="'+x(HARBOR.spawn[0]+(pos[0]-3.05)*24)+'" cy="'+y(HARBOR.spawn[1]+(pos[1]-1.65)*16)+'" r="3.5"/>':"";
  return '<svg class="sea-chart" role="img" aria-label="소라항에서 종소리 부표를 거쳐 별유리 부표로 가는 해도" viewBox="0 0 320 116"><defs><pattern id="chartGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#b3d0bc" opacity=".18"/></pattern></defs><rect width="320" height="116" fill="#235b60"/><rect width="320" height="116" fill="url(#chartGrid)"/><polygon points="0,0 0,51 '+coast+' 262,52 280,37 320,22 320,0" fill="#b9b693" stroke="#e0c99b"/><path d="M98 21 Q103 57 152 71 T237 84" fill="none" stroke="#f4c56a" stroke-width="1.8" stroke-dasharray="3 4"/>'+dots+boat+'<path d="m297 62 3 12-3-2-3 2z" fill="#efd39b"/><text x="297" y="58" text-anchor="middle">북</text></svg>';
}
function voyageEntry(s,aboard){
  if(s.voyage===3)return ["다시 켜진 별등대","별유리를 끼운 뒤, 배들은 밤마다 푸른 불빛을 따라 돌아온다.","자유 항해 · 황금 어군 탐색"];
  if(!canSail(s))return ["선장의 빈자리","소라 아저씨의 배가 오래도록 부두에 묶여 있다. 세 마리를 낚고 낚싯대를 한 번 손보면 첫 항해를 맡길 생각이란다.","어획 "+Math.min(s.caught,3)+"/3마리 · 낚싯대 "+Math.min(s.rod,2)+"/2단계"];
  if(s.voyage===2)return ["등대에 돌아온 빛","건져 올린 별유리가 손바닥에서 따뜻하게 빛난다. 소라 낚시점에 돌아가 꺼진 등불을 되살리자.","소라 아저씨에게 렌즈 전달 · 120코인"];
  const mark=SEA_MARKS[s.voyage||0];
  return [s.voyage?"병에 담긴 별":"첫 물길",s.voyage?SEA_MARKS[0].line:"옛 선장이 남긴 마지막 편지는 등대 앞바다의 종소리 부표에 매여 있다. 소라 아저씨가 작은 배의 열쇠를 내민다.",aboard?mark.name+"에 접근해 조사하기":"소라 낚시점에서 배를 타고 출항"];
}
function inShoal(p,spot){
  return !!spot&&((p.x-spot.x)/spot.rx)**2+((p.y-spot.y)/spot.ry)**2<=1;
}
function createSkiff(T){
  const boat=new T.Group(), wood=0xb56735, trim=0xf6ce86;
  function mesh(geo,color){
    const m=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.84,side:T.DoubleSide}));boat.add(m);return m;
  }
  const outline=[[0,2.15],[.56,1.57],[.84,.68],[.85,-.63],[.64,-1.56],[-.64,-1.56],[-.85,-.63],[-.84,.68],[-.56,1.57]];
  const verts=[],idx=[];
  for(const [size,y] of [[.64,-.38],[.96,-.06],[1,.18]])for(const [x,z] of outline)verts.push(x*size,y,z*size);
  for(let r=0;r<2;r++)for(let i=0;i<outline.length;i++){
    const a=r*outline.length+i,b=r*outline.length+(i+1)%outline.length;
    idx.push(a,b,a+9,b,b+9,a+9);
  }
  const hull=new T.BufferGeometry();hull.setAttribute("position",new T.Float32BufferAttribute(verts,3));hull.setIndex(idx);hull.computeVertexNormals();mesh(hull,0x227b75);
  const deck=new T.Shape();outline.forEach(([x,z],i)=>i?deck.lineTo(x,-z):deck.moveTo(x,-z));deck.closePath();
  const floor=mesh(new T.ShapeGeometry(deck),wood);floor.rotation.x=-Math.PI/2;floor.position.y=.055;
  for(let i=0;i<outline.length;i++){
    const [x,z]=outline[i],[x2,z2]=outline[(i+1)%outline.length];
    const rail=mesh(new T.BoxGeometry(.1,.11,Math.hypot(x2-x,z2-z)+.045),trim);
    rail.position.set((x+x2)/2,.19,(z+z2)/2);rail.rotation.y=Math.atan2(x2-x,z2-z);
  }
  for(const z of [-.96,.98]){const seat=mesh(new T.BoxGeometry(1.27,.12,.23),trim);seat.position.set(0,.20,z)}
  const ring=mesh(new T.TorusGeometry(.24,.072,8,20),0xd96641);ring.rotation.x=-Math.PI/2;ring.position.set(.43,.30,-.98);
  return boat;
}
