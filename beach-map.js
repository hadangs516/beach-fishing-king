/* Coordinates refer to the 1280 × 720 harbour illustration, before camera zoom. */
const HARBOR = {
  spawn:[440,213], door:[352,134], exit:[356,157], unit:24, depth:16,
  shore:[[0,326],[49,306],[79,296],[139,282],[207,262],[286,269],[351,249],[414,254],[482,240],[549,218],[624,220],[680,207],[727,215],[767,208],[835,217],[897,228],[956,254]],
  piers:[
    [[76,298],[104,293],[213,459],[181,475]],
    [[757,215],[783,214],[962,245],[974,264],[896,247],[751,228]]
  ],
  // Connected sand, promenade, lighthouse trail and both breakwaters.
  land:[
    [[73,286],[98,279],[114,297],[100,309],[82,307]],
    [[0,300],[60,236],[142,207],[180,188],[247,179],[269,157],[350,152],[398,144],[487,133],[520,125],[774,120],[820,140],[890,150],[948,182],[959,244],[897,220],[780,205],[679,204],[550,215],[478,237],[411,251],[348,246],[284,264],[211,257],[141,278],[71,294],[0,321]],
    [[232,125],[259,118],[294,143],[342,133],[424,116],[456,112],[485,128],[492,137],[400,151],[348,160],[271,170]],
    [[488,124],[498,117],[641,116],[660,123],[771,117],[827,130],[915,142],[944,162],[935,176],[888,160],[815,146],[769,135],[550,139]],
    [[913,155],[939,154],[975,182],[986,212],[1009,244],[1047,267],[1050,277],[1029,274],[991,251],[970,217],[956,191]],
    [[966,227],[985,236],[999,256],[1034,271],[1065,278],[1111,309],[1184,323],[1189,343],[1154,354],[1127,347],[1154,335],[1097,318],[1043,294],[1021,279],[988,267],[959,247]],
    [[343,133],[360,131],[372,152],[340,158]]
  ],
  obstacles:[
    [[175,206],[205,197],[228,220],[246,230],[227,246],[194,239]],
    [[250,184],[280,180],[305,206],[315,215],[292,224],[265,208]],
    [[344,166],[370,157],[386,171],[367,181]],
    [[406,145],[453,139],[459,152],[409,159]],
    [[733,143],[769,143],[766,159],[736,159]]
  ]
};
function harborInside(x,y,polygon){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function harborGround(x,y){
  if(HARBOR.piers.some(poly=>harborInside(x,y,poly)))return "pier";
  if(HARBOR.obstacles.some(poly=>harborInside(x,y,poly)))return "";
  if(HARBOR.land.some(poly=>harborInside(x,y,poly)))return "land";
  return "";
}
function harborRoute(from,to){
  const clear=(a,b)=>{
    const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);
    for(let i=1;i<=steps;i++)if(!harborGround(a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps))return false;
    return true;
  };
  if(clear(from,to))return [to];
  const size=8, id=p=>Math.round(p.y/size)*256+Math.round(p.x/size);
  const cells=new Map(),open=[],closed=new Set();
  const root={x:from.x,y:from.y,g:0,f:0,parent:null};
  open.push(root);cells.set(id(root),root);
  while(open.length&&closed.size<5000){
    let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;
    const cur=open.splice(best,1)[0];if(closed.has(id(cur)))continue;closed.add(id(cur));
    if(Math.hypot(cur.x-to.x,cur.y-to.y)<size*3&&clear(cur,to)){
      const route=[to];for(let p=cur;p.parent;p=p.parent)route.unshift({x:p.x,y:p.y});return route;
    }
    for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const p={x:cur.x+dx*size,y:cur.y+dy*size},key=id(p),g=cur.g+Math.hypot(dx,dy)*size;
      if(closed.has(key)||(cells.get(key)?.g??Infinity)<=g||!clear(cur,p))continue;
      Object.assign(p,{g,f:g+Math.hypot(p.x-to.x,p.y-to.y),parent:cur});cells.set(key,p);open.push(p);
    }
  }
  return [];
}
