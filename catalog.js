const GRADES=["일반","고급","희귀","초희귀","전설","스페셜"];
const RODS=["대나무 낚싯대","버드나무 낚싯대","산호 낚싯대","달빛 낚싯대","해왕의 낚싯대","별바다 낚싯대"];
const CATCHES=[
  ["멸치",0,12],["정어리",0,16],["망둑어",0,18],["고등어",0,24],["붕어",0,22],["전갱이",0,26],
  ["갈치",1,46],["가자미",1,51],["오징어",1,55],["잉어",1,48],["광어",1,60],
  ["참돔",2,92],["연어",2,105],["복어",2,115],["문어",2,120],
  ["황새치",3,205],["개복치",3,245],["철갑상어",3,260],["참다랑어",4,410],["산갈치",4,490],
  ["심해의 연봉협상왕 고등어",5,1440],["은하계 무패 갈치장군",5,1850],["우주최강 퇴근문어",5,2300]
];
const THINGS=[["빈 깡통",0],["구멍 난 장화",0],["빛바랜 유리병",8],["진주 조개",64],["금빛 나침반",125]];
const GEAR={"반짝이 루어":{cost:75,desc:"높은 등급의 물고기가 물 확률이 올라가요."},"조개 방울":{cost:90,desc:"찌를 문 물고기가 더 오래 기다려요."},"달조각 부적":{cost:0,desc:"건져서 얻는 장비예요. 어획물 판매 가격이 올라가요."}};
const newGame=()=>({money:0,rod:1,bucket:1,bag:[],gear:{},seen:{},caught:0,seconds:0,visits:0,pos:[3.05,1.65],equipped:""});
const capacity=s=>4+s.bucket*2;
const itemValue=n=>CATCHES.find(v=>v[0]===n)?.[2]??THINGS.find(v=>v[0]===n)?.[1]??0;
const sellValue=(s,n)=>Math.round(itemValue(n)*(1+(s.equipped==="달조각 부적"?.12*(s.gear[s.equipped]||0):0)));
const upgradeCost=(level,kind)=>Math.round((kind==="rod"?60:kind==="bucket"?45:40)*Math.pow(1.8,level-1));
function catchOne(s,power){
  const roll=Math.random();
  if(roll<.047){const name=Object.keys(GEAR)[Math.floor(Math.random()*3)];return {name,kind:"장비"}}
  if(roll<.20){const pick=THINGS[Math.floor(Math.random()*THINGS.length)];return {name:pick[0],kind:pick[1]?"발견물":"쓰레기"}}
  const luck=(s.equipped==="반짝이 루어"?(s.gear[s.equipped]||0)*.055:0)+power*.16;
  const weights=[1,.54+luck,.28+luck*.65,.14+luck*.4,.085+luck*.2,.018+luck*.06].slice(0,s.rod);
  let r=Math.random()*weights.reduce((a,b)=>a+b,0),grade=0;while(grade<weights.length-1&&r>=weights[grade])r-=weights[grade++];
  const pool=CATCHES.filter(a=>a[1]===grade);return {kind:"물고기",name:pool[Math.floor(Math.random()*pool.length)][0],grade};
}
const ICONS={
 float:'<path d="m13 2-1 3" stroke="#fce9bb"/><g transform="rotate(32 12 12)"><path d="M12 3v5" stroke="#f9d98a"/><ellipse cx="12" cy="12" rx="4.8" ry="6.7" fill="#fff3cd" stroke="none"/><path d="M7.2 12a4.8 6.7 0 0 0 9.6 0" fill="#e97a57" stroke="none"/><path d="M12 18v3" stroke="#ffe4ac"/></g><path d="M2 21q3-2 6 0t6 0 7 0" stroke="#a7d7c4"/>',
 wave:'<path d="M2 15q3-3 6 0t6 0 7 0M2 19q3-3 6 0t6 0 7 0M4 10q3 0 5-4t6-3q-2 4 2 6"/>',
 book:'<path d="M3 4q5-1 9 2 4-3 9-2v15q-5-1-9 2-4-3-9-2zM12 6v15"/>',
 shop:'<path d="m3 10 2-6h14l2 6q-2 4-5 0-2 4-4 0-2 4-4 0-3 4-5 0ZM5 13v7h14v-7M9 20v-5h5v5"/>',
 user:'<circle cx="12" cy="8" r="3.5"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
 settings:'<path d="m10 2 4 0 .8 2.7 2.2 1 2.5-.7 2 3.5-1.9 2v3l1.9 2-2 3.5-2.5-.7-2.2 1L14 22h-4l-.8-2.7-2.2-1-2.5.7-2-3.5 1.9-2v-3l-1.9-2 2-3.5 2.5.7 2.2-1z"/><circle cx="12" cy="12" r="3"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
 sun:'<circle cx="12" cy="12" r="4" fill="#ffd076"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
 coin:'<circle cx="12" cy="12" r="9" fill="#f3c45a" stroke="#b38940"/><circle cx="12" cy="12" r="6.3" stroke="#ffe2a0"/><path d="m12 8 2.2 4-2.2 4-2.2-4z" fill="#cc943d" stroke="none"/>',
 bucket:'<path d="M5 9q0-7 7-7t7 7" stroke="#527b73"/><path d="m3 9 3 12h12l3-12" fill="#7cae99" stroke="#4f7568"/><ellipse cx="12" cy="9" rx="9" ry="2.3" fill="#b8d4b8" stroke="#4f7568"/><path d="m8 13 1 4" stroke="#cce2cb"/>',
 rod:'<path d="m3 21 3-4" stroke-width="3.5"/><path d="M5 18Q14-1 20 4l-1 10q0 4-3 3-2 0-2-3"/><circle cx="7" cy="16" r="2"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
 device:'<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
 mute:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9l6 6m0-6-6 6"/>',sound:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8q4 4 0 8m3-11q7 7 0 14"/>',
 fish:'<path d="M3 12q7-10 15 0-8 10-15 0Zm14 0 5-4v8z"/><circle cx="8" cy="11" r="1"/>'
};
function icon(n){return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[n]||'')+'</svg>'}
