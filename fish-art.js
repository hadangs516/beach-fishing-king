// Illustrated field-guide plates. Silhouette, fins and markings are chosen by species.
const speciesForms = {
  ribbon:"갈치 산갈치 대왕산갈치 은하계무패갈치장군",
  eel:"미꾸라지 곰치 벼락배송번개장어",
  flat:"가자미 광어 쥐치",
  round:"복어 개복치 조석을결재하는복부장 왕관쓴둥근달복어",
  squid:"오징어 갑오징어 대왕오징어",
  octo:"문어 우주최강퇴근문어",
  ray:"가오리 쥐가오리 파도타는망토가오리",
  horse:"해마 잎해룡 별빛야근거절한해마법사",
  shark:"귀상어 청새리상어 톱상어 고래상어 백상아리",
  bill:"황새치 돛새치 학공치",
  deep:"아귀 심해아귀 투명머리물고기",
  whisker:"메기 망둑어 노래미 철갑상어",
  reef:"흰동가리 돌돔 나비고기 쏠배감펭 쥐돔 독가시치 나폴레옹피시",
  sleek:"멸치 정어리 고등어 전갱이 청어 전어 빙어 송사리 피라미 밴댕이 양미리 꽁치 삼치 참다랑어 방어 바라쿠다 만새기 심해의연봉협상왕고등어"
};
const fishFamilies=new Map(Object.entries(speciesForms).flatMap(([form,names])=>names.split(" ").map(name=>[name,form])));
const pigments=[
  ["#355f73","#74b8bf","#eee4ba"],["#75653f","#ccad60","#ffe6a4"],["#346b91","#70bdd8","#efeacb"],
  ["#a35349","#ee9869","#ffe6ae"],["#4f7875","#95bc97","#f9e2a7"],["#705e8d","#ab95c7","#ffe6da"],
  ["#52647a","#94a3b2","#fff2c9"],["#9a642a","#eaaa47","#fff4b7"]
];
let plateNumber=0;
function fishArt(name, silhouette=false){
  const key=name.replaceAll(" ",""),form=fishFamilies.get(key)||"bream";
  let seed=0;for(const char of name)seed=(Math.imul(seed,31)+char.charCodeAt(0))>>>0;
  const idx=CATCHES.findIndex(f=>f[0]===name),special=CATCHES[idx]?.[1]===5;
  const pal=name.includes("흰동가리")?["#b85420","#ff9a31","#ffe7a3"]:
    /고등어|참다랑어|고래상어|정어리|멸치/.test(name)?pigments[2]:
    /황금|왕관|돛새치/.test(name)?pigments[7]:/참돔|문어|쏠배감펭/.test(name)?pigments[3]:pigments[seed%pigments.length];
  const [dark,color,pale]=pal,uid="plate"+(++plateNumber),fill="url(#"+uid+")";
  const path=(d,paint=fill,extra="")=>'<path d="'+d+'" fill="'+paint+'" '+extra+'/>';
  const line=(d,c=dark,w=1.7)=>'<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"/>';
  const dot=(x,y,r,c)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" stroke="none"/>';
  let detail="",body="",fins="",face="",eye=[43,55],shape="";
  const depth=(form==="sleek"?13:form==="reef"?29:form==="flat"?19:22)+(seed%6);
  const head=31+seed%6,tail=131+(seed%9),top=56-depth,bottom=58+depth;
  if(["bream","whisker","reef","sleek","flat","bill","shark","deep","round"].includes(form)){
    if(form==="round"){shape="M42 56C38 35 54 23 78 25Q117 24 122 53L136 58 122 66Q110 91 77 88T42 65L35 61Z";eye=[52,48]}
    else if(form==="flat"){shape="M25 62Q62 30 105 37L140 58Q113 79 79 78Q47 79 25 68Z";eye=[42,55];detail+=dot(49,51,3.5,"#423f3b")}
    else if(form==="deep"){shape="M25 72Q22 35 62 29Q93 24 115 48L140 56 136 64 113 64Q80 91 46 83Z";eye=[47,49];fins+=line("M48 35Q29 4 19 29",dark,2.5)+dot(18,30,5,"#ffe981");face+=path("M25 70Q40 73 57 63Q48 81 28 77Z","#583e42")+path("m33 72 3 5 2-5m5-1 3 4 2-6","#fff2da")}
    else {shape="M"+head+" 56Q46 "+(top+1)+" 80 "+top+"Q104 "+top+" "+tail+" 54L148 57 144 65 "+tail+" 64Q102 "+(bottom+2)+" 73 "+bottom+"Q44 "+bottom+" "+head+" 64L25 61Z"}
    const ty=form==="round"?60:59;
    fins+=path("M129 "+ty+"Q147 53 162 "+(37-seed%5)+"L157 58 165 "+(77+seed%5)+"Q147 72 133 64Z",color);
    fins+=path(form==="shark"?"M79 42 95 12 102 48Z":form==="bill"&&name==="돛새치"?"M60 42Q82 4 109 14L126 49Z":"M62 "+(top+4)+"Q71 "+(top-5)+" 80 "+(top-10)+"L84 "+(top-4)+" 90 "+(top-9)+" 93 "+(top-3)+" 107 "+(top+5)+"Z",dark);
    fins+=path("M78 "+(bottom-5)+"L101 "+(bottom+10)+" 103 "+(bottom-4)+"Z",color);
    if(form==="bill")fins+=path("M41 51 4 57 42 61Z",dark);
    if(name==="톱상어")fins+=path("m41 54-32 0 4 3-3 3 6-1 2 3 3-3 5 1 4-2 11 2",color);
    if(name==="귀상어")fins+=path("M31 52 16 45 11 50 23 63 38 65Z",color);
    const stripe=/흰동가리|나비고기|돌돔/.test(name),n=4+seed%5;
    for(let i=0;i<n;i++){const x=53+i*10+(seed%5),y=top+6+(i%3)*2;
      if(stripe||seed%3===0)detail+=line("M"+x+" "+(y-10)+"q-5 12 4 "+(14+seed%12),stripe?"#fff1ce":dark,stripe?6:2.4);
      else if(seed%3===1)detail+=dot(x,y+4,1.9+(i%2),pale)+dot(x+3,y+11,1.5,dark);
      else detail+=line("M"+x+" "+y+"q4 4 7 -1",dark,1.4)}
    if(form==="round")for(let i=0;i<7;i++)detail+=path("m"+(58+i*8)+" "+(47+i%2*7)+" 1-4 3 4",dark);
    detail='<g clip-path="url(#c'+uid+')" opacity=".83">'+detail+'</g>';
    body=path(shape);face+=path("M64 61Q76 62 84 70Q71 72 65 67Z",color)+line("M58 51Q64 60 56 68")+line("M31 64q6 1 10-2");
    if(form==="whisker")face+=line("M34 64q-14 6-16 14M35 67q-11 7-11 12");
    if(name==="쏠배감펭")for(let j=0;j<6;j++)fins+=path("m"+(62+j*8)+" 41 -4 -21 10 19",color);
  }else if(form==="eel"||form==="ribbon"){
    shape="M19 57Q33 36 61 49C91 66 116 77 145 45Q157 31 170 38Q155 41 149 55C118 101 79 79 53 67Q31 75 20 64Z";eye=[34,55];body=path(shape);fins=path("M40 48Q42 36 47 29L52 45 57 34 63 50Z",form==="ribbon"?"#ed845d":dark);detail=line("M49 57C89 77 119 87 153 48",pale,2);
  }else if(form==="squid"||form==="octo"){
    const squid=form==="squid";shape=squid?"M55 66Q51 52 74 41L127 26Q126 53 102 66Q72 88 55 66Z":"M52 58Q46 27 78 23C112 16 131 45 118 65Q100 80 70 72Z";
    eye=squid?[66,59]:[67,54];body=path(shape);if(squid)fins=path("M89 47 121 22 115 46 132 54 99 62Z",color);
    for(let j=0;j<(squid?7:8);j++){const x=squid?60+j*3:58+j*7;fins+=line("M"+x+" 64Q"+(x-4)+" "+(84+j%3*4)+" "+(x-18)+" "+(78+j%3*6)+"T"+(x-29)+" "+(70+j%4*5),dark,6)+line("M"+x+" 64Q"+(x-4)+" "+(84+j%3*4)+" "+(x-18)+" "+(78+j%3*6)+"T"+(x-29)+" "+(70+j%4*5),color,3.7)}
    detail=dot(87,41,3,pale)+dot(96,44,2,pale)+dot(100,37,1.4,pale);
  }else if(form==="ray"){
    shape="M29 56Q59 49 90 16Q94 43 119 57Q95 71 90 95Q62 70 29 63Z";eye=[54,55];body=path(shape);fins=line("M111 57Q138 76 166 47",dark,3);detail=line("M48 61Q78 60 92 55",pale,2);
  }else{
    shape="M47 40 58 32Q65 15 82 20Q105 24 103 45Q116 60 97 74Q84 82 99 87Q111 86 108 77C131 95 92 110 80 88Q71 76 83 64Q88 56 75 47L64 41 49 48Z";eye=[70,31];body=path(shape);fins=path("M87 25 92 13 95 25 104 20 101 32 113 31 104 43 115 48 103 57Z",color);detail=line("M87 45Q98 57 86 70",pale,3);
  }
  if(name==="산갈치"){
    fins+=line("M44 48Q36 24 40 12M49 46Q47 20 53 17","#c65f56",2.4);
    detail+=line("M60 55Q96 79 125 67","#de8470",1.5);
  }else if(name==="쥐치"){
    fins+=path("M52 48 48 20 61 42Z",dark);
    face+=path("M53 61 72 58 63 72Z",color);
  }else if(name==="쥐가오리"){
    fins+=path("M47 53Q25 40 22 47L34 60 18 65Q18 75 49 66Z",color);
    detail+=path("M61 50 83 32 77 47Z",pale)+path("M60 69 82 83 74 68Z",pale);
  }
  face+=dot(...eye,5.2,"#fff6db")+dot(eye[0]-1,eye[1]+.2,3.35,"#263c44")+dot(eye[0]-1.8,eye[1]-1.1,1.15,"white");
  if(special){
    const ornaments=[
      path("m75 28-5-13 10 5 7-10 4 11 12-5-6 15Z","#ffd76a"),
      path("m68 42 9-18 19 1-3 5-10 2-7 12Z","#e7755d"),
      path("M87 28Q98 8 114 21L106 30Z","#7c66ae")+dot(105,17,2,"#ffe7a0"),
      path("m69 38 5-18 8 7 7-8 4 16Z","#e5aa53")];
    face+=ornaments[idx%4]+path("m130 21 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z","#ffe390");
  }
  return '<svg class="fish-plate'+(silhouette?' undiscovered':'')+'" viewBox="0 0 180 112" aria-hidden="true"><defs><linearGradient id="'+uid+'" x2=".25" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="'+dark+'"/><stop offset=".46" stop-color="'+color+'"/><stop offset="1" stop-color="'+pale+'"/></linearGradient><clipPath id="c'+uid+'">'+path(shape,"white")+'</clipPath></defs><g stroke="'+dark+'" stroke-width="1.8" stroke-linejoin="round">'+fins+body+detail+face+'</g></svg>';
}
