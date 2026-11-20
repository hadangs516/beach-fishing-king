// Corresponding walking surfaces in the two painted camera views. Each pair is
// the landward and seaward end of a cross-section, ordered farthest to nearest.
const BEACH_VIEWS = {
  wide: {
    width:1536, height:1024, image:"assets/cove-wide.webp", unit:64, depth:34,
    spawn:[705,648],
    bands:[
      [[928,378],[1068,378]], [[827,424],[1106,424]], [[652,467],[999,467]],
      [[405,515],[954,515]], [[420,568],[895,568]], [[340,628],[819,628]],
      [[245,672],[793,672]], [[116,709],[706,709]], [[125,733],[677,745]],
      [[160,741],[642,779]], [[182,747],[623,801]]
    ],
    pier:[[55,727],[664,837],[526,911],[54,811]], pierJoin:[.23,.90],
    coast:[[1536,293],[1287,301],[1095,315],[1033,334],[918,347],[1052,364],
      [1156,383],[1190,399],[1119,422],[1152,435],[1023,466],[1041,490],
      [970,515],[899,548],[967,564],[845,614],[847,655],[789,679],[718,708],
      [710,733],[657,768],[675,790],[645,816],[657,850],[698,873],[789,913],
      [888,947],[931,977],[1011,1024]],
    seaBottom:[1536,1024],
    pierMask:[[0,665],[110,658],[145,707],[218,688],[250,683],[258,738],[375,758],
      [382,719],[415,720],[420,774],[654,812],[663,781],[705,787],[709,939],
      [553,978],[536,1024],[476,1024],[460,931],[368,919],[346,991],[301,988],[283,884],[0,835]]
  },
  tall: {
    width:1024, height:1536, image:"assets/cove-tall.webp", unit:94, depth:52,
    spawn:[440,949],
    bands:[
      [[692,585],[809,585]], [[540,622],[789,622]], [[426,667],[793,667]],
      [[241,708],[723,708]], [[204,760],[662,760]], [[88,815],[681,815]],
      [[40,900],[590,900]], [[38,994],[511,994]], [[127,1076],[398,1076]],
      [[154,1126],[357,1126]], [[177,1155],[330,1160]]
    ],
    pier:[[48,1149],[587,1244],[477,1322],[47,1255]], pierJoin:[.27,.48],
    coast:[[1024,390],[934,394],[887,408],[1009,423],[1011,454],[784,476],
      [716,495],[730,519],[818,542],[898,565],[862,586],[834,606],[787,629],
      [815,646],[831,667],[775,687],[751,710],[699,737],[675,767],[715,788],
      [695,815],[640,850],[649,864],[611,894],[571,916],[519,947],[509,968],
      [546,993],[506,1021],[463,1045],[426,1060],[367,1095],[393,1120],
      [355,1140],[317,1186],[281,1219],[253,1260],[226,1309],[216,1350],
      [204,1400],[190,1420],[229,1466],[336,1501],[356,1536]],
    seaBottom:[1024,1536],
    pierMask:[[0,1055],[147,1061],[154,1144],[222,1158],[222,1123],[271,1123],
      [279,1173],[562,1226],[566,1176],[619,1170],[630,1350],[493,1400],
      [483,1460],[409,1472],[405,1371],[160,1316],[132,1406],[72,1400],[0,1312]]
  }
};
function beachTriangles(view) {
  const triangles=[];
  function quad(a,b,c,d){triangles.push([a,b,c],[a,c,d])}
  const [start,end,farEnd,farStart]=view.pier;
  const along=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  const seams=[0,...view.pierJoin,1];
  const shore=seams.map(t=>along(start,end,t)),outer=seams.map(t=>along(farStart,farEnd,t));
  for(let i=1;i<seams.length;i++)quad(shore[i-1],shore[i],outer[i],outer[i-1]);
  view.pierTriangleCount=triangles.length;
  const bands=[...view.bands,[shore[1],shore[2]]];
  for(let i=1;i<bands.length;i++){
    const [a,b]=bands[i-1], [d,c]=bands[i];
    quad(a,b,c,d);
  }
  return triangles;
}
for(const view of Object.values(BEACH_VIEWS))view.triangles=beachTriangles(view);
function beachTriangleAt(point,view) {
  for(let i=0;i<view.triangles.length;i++){
    const [a,b,c]=view.triangles[i];
    const bx=b[0]-a[0],by=b[1]-a[1],cx=c[0]-a[0],cy=c[1]-a[1];
    const px=point.x-a[0],py=point.y-a[1],det=bx*cy-by*cx;
    const u=(px*cy-py*cx)/det,v=(bx*py-by*px)/det;
    if(u>=-.00001&&v>=-.00001&&u+v<=1.00001)return {i,u,v};
  }
  return null;
}
function otherBeachView(point,from,to) {
  if(from===to)return point;
  const hit=beachTriangleAt(point,from);
  if(!hit)return {x:to.spawn[0],y:to.spawn[1]};
  const [a,b,c]=to.triangles[hit.i];
  return {x:a[0]+hit.u*(b[0]-a[0])+hit.v*(c[0]-a[0]),y:a[1]+hit.u*(b[1]-a[1])+hit.v*(c[1]-a[1])};
}
