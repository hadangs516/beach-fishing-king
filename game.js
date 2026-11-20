(() => {
  "use strict";
  const $=s=>document.querySelector(s), panel=$("#panel"), body=$("#panelBody");
  const api="https://script.google.com/macros/s/AKfycbxhI2RdwlwT3x5ssO3HAovSANxmKE5Mb_zJmn74uFy93vWj0Zjac9ZKgYx6lpuHWm6IYA/exec";
  const prefix="소라빛해변.1.", id=()=>crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(prefix+k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(prefix+k,JSON.stringify(v))}catch{storageFailed=true}};
  let storageFailed=false, auth=read("계정",null), prefs=read("설정",{device:"자동",sound:false}), saveKey=()=>auth?"회원."+auth.name:"게스트";
  let local=read(saveKey(),null),s={...newGame(),...local?.state},rev=local?.rev||0,dirty=!!local?.dirty;
  let world,phase="idle",power=0,phaseTime=0,waitTime=0,view="",mode="login",status=auth?"연결 확인 중":"이 기기에 저장",ready=false,busy=false,syncing=false,pending=local?.pending||null,modalError="",pageVisit=id(),timeFraction=0,clock=0;
  let inShop=false;
  let toastTimer, discovery=null, bookGrade=0, castMeters=2, fullTried=false;
  prefs.music=Number.isFinite(prefs.music)?prefs.music:38;
  prefs.effects=Number.isFinite(prefs.effects)?prefs.effects:(prefs.sound===true?65:50);
  const audio=beachAudio(prefs);
  const fullElement=()=>document.fullscreenElement||document.webkitFullscreenElement;
  function fullscreen(manual=false){
    if(fullElement()||(!manual&&(device()!=="모바일"||fullTried)))return;
    const root=document.documentElement,enter=root.requestFullscreen||root.webkitRequestFullscreen;
    if(!enter){if(manual)notify("이 브라우저에서는 홈 화면에 추가해 전체 화면으로 열 수 있어요.");return}
    if(!manual&&navigator.userActivation&&!navigator.userActivation.isActive)return;
    fullTried=true;
    try{Promise.resolve(enter.call(root)).catch(()=>{if(manual)notify("브라우저에서 전체 화면 전환을 허용해 주세요.")})}catch{if(manual)notify("이 브라우저에서는 화면 확장이 제한돼요.")}
  }
  function activate(){audio.start();fullscreen()}
  for(const event of ["pointerup","click","keydown"])document.addEventListener(event,activate,{capture:true,passive:true});
  const safe=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function autoDevice(){try{const ua=navigator.userAgent||"";if(/android|iphone|ipad|ipod|mobile/i.test(ua)||(navigator.maxTouchPoints>1&&/Macintosh/i.test(ua)))return "모바일";if(navigator.userAgentData?.mobile===true)return "모바일";if(/windows nt|macintosh|x11|cros/i.test(ua)&&matchMedia("(pointer:fine)").matches)return "PC";return "모바일"}catch{return "모바일"}}
  const device=()=>prefs.device==="자동"?autoDevice():prefs.device;
  function deviceUI(){document.body.classList.toggle("mobile",device()==="모바일");$("#deviceText").textContent=device()+"로 접속했어요"}
  function persist(modified=false){if(modified)dirty=true;if(world)s.pos=world.position();write(saveKey(),{state:s,rev,dirty,pending})}
  function hud(){
    $("#money").textContent=s.money.toLocaleString("ko");$("#capacity").textContent=s.bag.length+" / "+capacity(s);
    $("#playerName").textContent=auth?.name||"게스트";
  }
  function notify(t,ms=3000){clearTimeout(toastTimer);$("#notice").hidden=!t;$("#notice").textContent=t;if(t&&ms)toastTimer=setTimeout(()=>$("#notice").hidden=true,ms)}
  const chime=freq=>audio.chime(freq);
  function state(next){
    phase=next;phaseTime=0;world?.setPhase(next,castMeters);
    $("#meter").hidden=next!=="charge";
    document.body.classList.toggle("charging",next==="charge");
    document.body.classList.toggle("biting",next==="bite");
    $("#cast b").textContent=({idle:"낚싯줄 던지기",charge:"놓아서 던지기",wait:"줄 회수",bite:"낚아채기!"})[next];
    $("#hint").textContent=({idle:"꾹 눌렀다가 원하는 힘에서 놓으세요",charge:"게이지가 오르내려요. 놓으면 던져요",wait:"찌가 흔들릴 때까지 기다리세요",bite:"지금 눌러 낚아채세요"})[next];
  }
  function landCatch(){
    const c=catchOne(s,power);state("idle");let msg=c.name,first=false;
    if(c.kind==="장비"){
      if(s.gear[c.name]){s.money+=20;msg+=" · 중복 장비 보상 20코인"}
      else{s.gear[c.name]=1;msg+=" 획득! 인벤토리에서 착용하세요"}
    }else if(s.bag.length>=capacity(s)){msg="물고기통이 가득 차서 놓아줬어요"}
    else{s.bag.push(c.name);if(c.kind==="물고기"){
      first=!s.seen[c.name];s.seen[c.name]=(s.seen[c.name]||0)+1;s.caught++;msg=GRADES[c.grade]+" · "+c.name+" 낚았어요!";
    }else msg+=" · "+c.kind+"을 건졌어요"}
    chime(750);hud();persist(true);scheduleSave();
    if(first){discovery=c;open("discovery")}else notify(msg,3300);
  }
  function press(){if(panel.open||!world)return;if(phase==="bite"){landCatch();return}if(phase==="wait"){if(!world.landed())return;state("idle");notify("낚싯줄을 거뒀어요");return}if(phase!=="idle")return;
    if(s.bag.length>=capacity(s)){notify("물고기통이 가득 찼어요. 어획물을 판매해 주세요.");return}$("#snack").hidden=true;notify("");power=0;state("charge");drawMeter();chime(385)}
  function release(){
    if(phase!=="charge")return;
    const distance=castRange(power,Math.random(),Math.random());
    castMeters=distance.meters;power=distance.percent/100;
    waitTime=.73+castMeters*.055+1.4+Math.random()*2.3;state("wait");
    notify(distance.percent+"% · "+castMeters.toFixed(1)+" m"+(distance.bonus?" · 순풍 보너스!":""),1500);audio.castSound();
  }
  function drawMeter(){
    const range=castRange(power);world?.preview(range.meters);
    $("#powerText").textContent=range.percent+"%";$("#meterDistance").textContent=range.meters.toFixed(1)+" m";
    const f=range.percent/100,x=25+250*f,y=64-144*f*(1-f);
    $("#arcNeedle").setAttribute("transform","translate("+x+" "+y+") rotate("+Math.atan2(144*f-72,125)*180/Math.PI+")");
    $("#arcShade").setAttribute("stroke-dasharray","0 "+range.percent+" "+(100-range.percent)+" 101");
    $("#meter").setAttribute("aria-valuenow",range.percent);
  }
  function frame(dt){if(document.hidden)return;const now=performance.now()/1000,active=clock?Math.min(1,now-clock):0;clock=now;
    if(!panel.open){timeFraction+=active;if(timeFraction>=1){const n=Math.floor(timeFraction);s.seconds+=n;timeFraction-=n;dirty=true}phaseTime+=active;
      if(phase==="charge"){const t=(phaseTime/.87)%2;power=1-Math.abs(1-t);drawMeter()}else if(phase==="wait"&&world.landed()&&phaseTime>=waitTime){state("bite");chime(960);notify("입질! 지금 낚아채세요",0)}else if(phase==="bite"&&phaseTime>3.6+(s.equipped==="조개 방울"?(s.gear[s.equipped]||0)*.75:0)){state("idle");notify("물고기가 달아났어요")}}
  }
  const artIndex={bucket:0,book:1,rod:2,settings:3,music:4,effects:5,device:6,wave:6,user:7,lure:8,bell:9,charm:10,coin:11,shop:11,fish:1,help:6,pack:0};
  function art(sym){const n=artIndex[sym]??6;return '<i aria-hidden="true" class="painted" style="--ix:'+(n%4)+';--iy:'+Math.floor(n/4)+'"></i>'}
  const gearArt=name=>({"반짝이 루어":"lure","조개 방울":"bell","달조각 부적":"charm"})[name]||"rod";
  const row=(sym,title,sub,btn="")=>'<div class="row">'+art(sym)+'<span><strong>'+safe(title)+'</strong><small>'+safe(sub)+'</small></span>'+btn+'</div>';
  const button=(text,action,disabled=false)=>'<button data-do="'+safe(action)+'" '+(disabled?"disabled":"")+'>'+safe(text)+'</button>';
  const primary=(text,action)=>'<button class="action" data-do="'+action+'">'+safe(text)+'</button>';
  const selected=(text,action,on)=>'<button class="choice '+(on?"selected":"")+'" data-do="'+safe(action)+'">'+safe(text)+'</button>';
  let discoveryPress=null,discoveryKeyHeld=false;
  function open(v){if(["merchant","shop","trade"].includes(v)&&!inShop)return;if(v==="beach"){if(panel.open)panel.close();return}if(!panel.open){state("idle");notify("");world?.lock(true);panel.showModal()}view=v;modalError="";$("#snack").hidden=true;render();panel.scrollTop=0;
    if(v==="discovery"){discoveryPress=null;$("#panelTitle").focus({preventScroll:true})}}
  function enterShop(){if(panel.open||!world?.nearDoor()||phase!=="idle")return;inShop=true;open("merchant");chime(620)}
  const inventoryTabs=()=>'<nav class="kit-tabs" aria-label="인벤토리">'+[["bag","물고기통","bucket"],["book","도감","book"],["gear","내 장비","rod"]].map(([v,t,sym])=>'<button class="'+(v===view?"selected":"")+'" data-do="open:'+v+'">'+art(sym)+t+'</button>').join("")+'</nav>';
  const volumeControl=(key,title)=>'<label class="volume">'+art(key)+'<b>'+title+'</b><output id="vol-'+key+'">'+prefs[key]+'%</output><input type="range" min="0" max="100" value="'+prefs[key]+'" data-volume="'+key+'" aria-label="'+title+' 음량"></label>';
  const totalSale=()=>s.bag.reduce((a,n)=>a+sellValue(s,n),0);
  function stockSlots(){
    return '<div class="catch-grid">'+Array.from({length:capacity(s)},(_,i)=>{
      const n=s.bag[i];return n?'<div class="catch-slot">'+(CATCHES.some(f=>f[0]===n)?fishArt(n):art("charm"))+'<b>'+safe(n)+'</b></div>':'<div class="catch-slot vacant" aria-label="빈칸"><span>✧</span></div>';
    }).join("")+'</div>';
  }
  function counterHead(){return '<div class="counter-view" role="img" aria-label="낚시점 계산대에서 반기는 소라 아저씨"></div>'}
  function speech(line){return '<div class="speech"><b>소라 아저씨</b><p>'+safe(line)+'</p></div>'}
  function shopChoice(sym,label,action){return '<button class="shop-choice" data-do="'+action+'">'+art(sym)+'<span>'+label+'</span><b>›</b></button>'}
  function render(){const titles={discovery:"NEW!",merchant:"소라 낚시점",trade:"어획물 매입",gear:"내 장비",reset:"진행 상황 초기화",bag:"인벤토리",book:"물고기 도감",shop:"낚시 도구",settings:"설정",device:"조작 기기",account:"진행 상황 저장",help:"낚시하는 법"};$("#panelTitle").textContent=titles[view]||"해변";let html="";panel.classList.toggle("discovery",view==="discovery");panel.classList.toggle("counter",inShop);panel.dataset.view=view;
    const badges={bag:"bucket",book:"book",gear:"rod",settings:"settings",account:"user",device:"device",help:"book",reset:"settings",merchant:"shop",shop:"rod",trade:"coin"};
    $("#panelBadge").innerHTML=view==="discovery"?"":art(badges[view]);
    if(view==="discovery"&&discovery){
      html='<div class="trophy-art">'+fishArt(discovery.name)+'</div>'+
        '<div class="trophy-caption"><h3>'+safe(discovery.name)+'</h3>'+
        '<span class="discovery-grade">'+GRADES[discovery.grade]+' · 도감 등록</span></div>'+
        '<div class="trophy-actions">'+button("도감 보기","discoverBook")+button("확인","close")+'</div>';
    }
    if(view==="merchant"){
      html=counterHead()+speech(s.bag.length?"돌아왔구먼! 오늘은 어떤 녀석들이 물었나?":"어서 오게! 오늘은 물빛이 참 좋아. 뭐가 필요한가?")+
        '<div class="counter-options">'+shopChoice("coin","잡은 것 팔기","open:trade")+shopChoice("rod","도구 구매·강화","open:shop")+shopChoice("device","해변으로 나가기","close")+'</div>';
    }
    if(view==="trade"){
      html=counterHead()+speech(s.bag.length?"통을 보여주게. 전부 합해서 "+totalSale().toLocaleString()+"코인에 사겠네.":modalError||"통이 비어 있구먼. 한 마리만 낚아 와도 매입하네.")+
        '<div class="counter-stock">'+(s.bag.length?stockSlots()+primary("모두 판매 · "+totalSale().toLocaleString()+"코인","sell"):"")+button("대화로 돌아가기","open:merchant")+'</div>';
    }
    if(view==="bag"){
      html=inventoryTabs()+'<div class="kit-summary">'+art("bucket")+'<div><strong>오늘의 어획물</strong><small>'+ (s.bag.length?"소라 낚시점에서 "+totalSale().toLocaleString()+"코인에 판매할 수 있어요.":"낚은 물고기를 한 마리씩 담아요.")+'</small></div><b>'+s.bag.length+' / '+capacity(s)+'</b></div>'+stockSlots();
    }
    if(view==="gear"){
      html=inventoryTabs()+row("rod",RODS[s.rod-1],s.rod+"단계 · 사용 중")+row("bucket","물고기통",capacity(s)+"칸 · 사용 중");
      for(const [name,item] of Object.entries(GEAR)){if(s.gear[name])html+=row(gearArt(name),name+" · "+s.gear[name]+"단계",item.desc,button(s.equipped===name?"해제":"착용","equip:"+name))}
    }
    if(view==="book"){
      const cards=CATCHES.filter(f=>f[1]===bookGrade).map(([n,g,price])=>{
        const known=!!s.seen[n];return '<div class="specimen">'+fishArt(n,!known)+'<b>'+safe(known?n:"미발견")+'</b><small>'+(known?s.seen[n]+"마리 · "+price+"코인":GRADES[g])+'</small></div>';
      }).join("");
      html=inventoryTabs()+'<p>발견 '+Object.keys(s.seen).length+' / '+CATCHES.length+'종</p><div class="choices">'+GRADES.map((g,i)=>selected(g,"grade:"+i,i===bookGrade)).join("")+'</div><p>'+(bookGrade===5?"모든 낚싯대에서 매번 2% 확률로 등장해요.":(bookGrade+1)+"단계 낚싯대부터 만날 수 있어요.")+'</p><div class="collection">'+cards+'</div>';
    }
    if(view==="shop"){html=counterHead()+speech('낚싯대를 보여주게. 자네 손에 꼭 맞게 손봐 주지.')+'<div class="counter-stock"><div class="purse">'+art('coin')+'<b>'+s.money.toLocaleString()+' 코인</b></div>';for(const kind of ["rod","bucket"]){const lv=s[kind],price=upgradeCost(lv,kind),isRod=kind==="rod";html+=row(isRod?"rod":"bucket",isRod?RODS[lv-1]:"물고기통 "+lv+"단계",lv>=6?"최고 단계":isRod?(lv===5?"다음 단계에서 전설 어종 확률 증가":"다음 단계에서 "+GRADES[lv]+" 물고기 해금"):"다음 단계 용량 "+(capacity(s)+2)+"칸",lv<6?button(price+"코인 강화","up:"+kind,s.money<price):"")}
      for(const [name,item] of Object.entries(GEAR)){const lv=s.gear[name]||0,price=lv?upgradeCost(lv,"gear"):item.cost;html+=row(gearArt(name),name+(lv?" · "+lv+"단계":""),item.desc,lv?'<small>보유 중</small>':item.cost?button(price+"코인 구매","buy:"+name,s.money<price):'<small>낚시 전용</small>');if(lv&&lv<5)html+='<div class="row"><span>장비 강화</span>'+button(price+"코인","gear:"+name,s.money<price)+'</div>'}html+=button("대화로 돌아가기","open:merchant")+'</div>'}
    if(view==="settings"){html='<div class="sound-board">'+volumeControl("music","배경음악")+volumeControl("effects","효과음")+'</div>'+row("device","조작 기기",prefs.device+" · "+device(),button("바꾸기","open:device"))+row("device","전체 화면",fullElement()?"사용 중":"화면 확장",button("전체 화면","fullscreen"))+row("help","조작 방법","이동과 낚시",button("보기","open:help"))+row("user",auth?.name||"게스트",status,button("계정","open:account"))+row("bucket","진행 상황 초기화","현재 플레이 기록을 처음부터 시작해요.",button("초기화","open:reset"))}
    if(view==="reset"){html='<p><b>'+safe(auth?.name||"게스트")+'</b>의 코인, 장비, 어획물, 도감, 플레이 시간을 초기화합니다. 계정과 접속 이력은 유지됩니다.</p>'+primary("취소","open:settings")+primary("진행 상황 초기화하기","reset")}
    if(view==="device"){html='<p>조작에 사용할 기기를 선택하세요.</p><div class="choices">'+["자동","PC","모바일"].map(v=>selected(v,"device:"+v,prefs.device===v)).join("")+'</div><p>자동 감지 결과 · '+autoDevice()+'</p>'}
    if(view==="help"){html=row("wave","원하는 곳으로 이동",device()==="PC"?"방향키나 WASD로 걸어요. 바닥을 클릭해도 이동해요.":"왼쪽 조이스틱을 밀거나 바닥을 눌러 이동해요.")+row("rod","길게 눌러 던지기","어디서든 바라보는 방향으로 던져요. 힘 게이지를 보고 놓으세요. 순풍이 불면 조금 더 멀리 가고 최대 거리는 20m예요.")+row("fish","입질에 맞춰 낚아채기","찌가 흔들리면 버튼을 한 번 눌러요. PC에서는 스페이스바도 사용할 수 있어요.")+row("bucket","판매와 강화","파란 지붕 소라 낚시점의 문으로 걸어가세요. 상인에게 팔거나 장비를 강화할 수 있어요. 건진 장비는 인벤토리에서 착용하세요.")}
    if(view==="account"){if(auth){html=row("user",auth.name,status)+row("fish","누적 어획량",s.caught+"마리")+row("device","플레이 기록",Math.floor(s.seconds/60)+"분 · 접속 "+s.visits+"회")+primary("지금 저장","sync")+primary("로그아웃","logout");if(status.includes("충돌"))html+=primary("시트의 진행 상황 불러오기","reload")}
      else{html='<div class="choices">'+selected("로그인","mode:login",mode==="login")+selected("회원가입","mode:register",mode==="register")+'</div><p>'+(mode==="login"?"로그인하면 시트에 저장했던 게임을 이어서 플레이해요.":"현재 게스트의 어획물과 장비를 새 계정에 저장해요.")+'</p><form id="loginForm"><label class="field">아이디<input name="name" required minlength="2" maxlength="13" pattern="[가-힣]{2,13}" placeholder="한글 2~13자" autocomplete="username"></label><label class="field">게임용 PIN<input type="password" name="pin" required inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="숫자 4자리" autocomplete="'+(mode==="login"?"current-password":"new-password")+'"></label><button class="action" '+(busy?"disabled":"")+'>'+(busy?"연결 중…":mode==="login"?"로그인":"회원가입하고 저장")+'</button></form>'}}
    body.innerHTML=html+'<p id="feedback" role="status" style="margin-top:10px">'+safe(modalError||(storageFailed?"브라우저 저장 공간을 사용할 수 없어요.":""))+'</p>'}
  function change(){hud();persist(true);scheduleSave();render();chime(570)}
  async function action(a){const [key,arg]=a.split(":");if(key==="open")return open(arg);
    if(key==="close"){panel.close();return}
    if(key==="discoverBook"){bookGrade=discovery.grade;open("book");return}
    if(key==="grade"){bookGrade=Number(arg);render();return}
    if(key==="fullscreen"){fullscreen(true);panel.close();return}
    if(key==="reset"){
      if(busy||syncing){modalError="저장 처리 중이에요. 잠시 뒤 다시 눌러 주세요.";render();return}
      if(auth&&(!ready||pending)){await resume(false);if(ready&&pending)await sync();
        if(!ready||pending){modalError="시트 연결을 확인한 뒤 초기화해 주세요.";render();return}}
      clearTimeout(saveTimer);const visits=s.visits;s={...newGame(),visits};discovery=null;timeFraction=0;world?.restore(s.pos);
      hud();persist(true);if(auth)await sync();open("settings");
      modalError=auth&&dirty?"기기에서 초기화했어요. 시트 저장 대기 중입니다.":"진행 상황을 초기화했어요.";render();return;
    }if(key==="mode"){mode=arg;modalError="";render();return}
    if(["sell","up","buy","gear"].includes(key)&&!inShop)return;
    if(key==="sell"){if(!s.bag.length||view!=="trade")return;const n=s.bag.reduce((a,v)=>a+sellValue(s,v),0);s.money+=n;s.bag=[];modalError=n+"코인을 받았어요";return change()}
    if(key==="up"&&["rod","bucket"].includes(arg)){const price=upgradeCost(s[arg],arg);if(s[arg]>=6||s.money<price)return;s.money-=price;s[arg]++;modalError="강화했어요";return change()}
    if(key==="buy"&&GEAR[arg]?.cost&&!s.gear[arg]&&s.money>=GEAR[arg].cost){s.money-=GEAR[arg].cost;s.gear[arg]=1;return change()}
    if(key==="gear"&&s.gear[arg]&&s.gear[arg]<5){const n=upgradeCost(s.gear[arg],"gear");if(s.money<n)return;s.money-=n;s.gear[arg]++;return change()}
    if(key==="equip"&&s.gear[arg]){s.equipped=s.equipped===arg?"":arg;return change()}
    if(key==="device"){prefs.device=arg;write("설정",prefs);deviceUI();fullTried=false;fullscreen();panel.close();notify(arg+" 조작으로 설정했어요");return}
    if(key==="sync"){await resume(false);if(ready)await sync();if(panel.open&&view==="account")render()}
    if(key==="reload"){await resume(true);if(panel.open)render()}
    if(key==="logout"&&!busy&&!syncing){persist();auth=null;write("계정",null);const guest=read(saveKey(),null);s={...newGame(),...guest?.state};s.visits++;rev=0;pending=null;dirty=false;ready=false;world?.restore(s.pos);hud();status="이 기기에 저장";render()}}
  async function request(command,args){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),16500);try{const res=await fetch(api,{method:"POST",body:JSON.stringify({command,...args}),signal:abort.signal,redirect:"follow",credentials:"omit"});const data=await res.json();if(!data.ok)throw Object.assign(new Error(data.message||"저장에 실패했어요"),{code:data.code});return data}catch(e){if(e.code)throw e;throw new Error("저장 서버에 연결할 수 없어요. 기기에 진행 상황을 보관했어요.")}finally{clearTimeout(timer)}}
  async function authenticate(e){e.preventDefault();if(busy||auth)return;const f=new FormData(e.target),name=String(f.get("name")).normalize("NFC"),pin=String(f.get("pin"));if(!/^[가-힣]{2,13}$/.test(name)||!/^\d{4}$/.test(pin))return;busy=true;const submit=e.target.querySelector("button");submit.disabled=true;submit.textContent="연결 중…";persist();
    try{const r=await request(mode==="login"?"로그인":"가입",{name,pin,state:s,device:device(),visit:pageVisit});const old=read("회원."+name,null);auth={name,token:r.token};write("계정",auth);s={...newGame(),...r.state};rev=r.rev;dirty=false;pending=null;ready=true;status="시트에 저장됨";
      if(old?.dirty&&mode==="login"){s={...newGame(),...old.state,visits:r.state.visits};dirty=true;rev=old.rev;pending=old.pending||null;if(rev!==r.rev&&!pending){ready=false;status="저장 충돌 · 시트 기록 확인 필요"}}
      world?.restore(s.pos);persist();hud();if(ready&&dirty)scheduleSave();modalError=mode==="register"?"회원가입했어요":"로그인했어요";render()}catch(err){modalError=err.message;$("#feedback").textContent=modalError;submit.disabled=false;submit.textContent=mode==="login"?"로그인":"회원가입하고 저장"}finally{busy=false}}
  async function resume(reload){if(!auth||busy||syncing)return;busy=true;const who=auth;try{const r=await request("접속",{...who,visit:pageVisit,device:device()});if(auth!==who)return;if(reload||(!dirty&&!pending)){s={...newGame(),...r.state};rev=r.rev;dirty=false;pending=null;world?.restore(s.pos)}s.visits=r.state.visits;
      if(rev!==r.rev&&!pending){ready=false;status="저장 충돌 · 시트 기록 확인 필요"}else{ready=true;status=dirty?"저장 대기":"시트에 저장됨"}persist();hud()}catch(e){ready=false;status=e.message}finally{busy=false}}
  let saveTimer;function scheduleSave(){if(!auth)return;clearTimeout(saveTimer);saveTimer=setTimeout(sync,1200)}
  async function sync(){if(!auth||!ready||busy||syncing||(!dirty&&!pending))return;syncing=true;const who=auth;persist();if(!pending){pending={state:JSON.parse(JSON.stringify(s)),rev,writeId:id()};persist()}
    try{const r=await request("저장",{...who,...pending});if(who!==auth)return;dirty=JSON.stringify(s)!==JSON.stringify(pending.state);pending=null;rev=r.rev;status="시트에 저장됨";persist()}catch(e){status=e.code==="충돌"?"저장 충돌 · 시트 기록 확인 필요":e.message;if(e.code==="충돌"){ready=false;pending=null}persist()}finally{syncing=false;if(panel.open&&view==="account")render()}}
  document.querySelectorAll("[data-icon]").forEach(el=>el.innerHTML=["pack","settings"].includes(el.dataset.icon)?art(el.dataset.icon):icon(el.dataset.icon));deviceUI();hud();
  try{world=beachWorld($("#world"),frame,enterShop,()=>audio.castSound(true));world.restore(s.pos)}catch(err){console.error(err);$("#hint").textContent="브라우저에서 WebGL을 켜고 다시 열어 주세요";$("#cast").disabled=true;notify("3D 화면을 열 수 없어요. 브라우저의 그래픽 가속 설정을 확인해 주세요.",0)}
  // A fish can be hooked on pointerdown or keydown. Its release belongs to the beach.
  document.addEventListener("pointerdown",e=>{
    if(panel.open&&view==="discovery")discoveryPress={id:e.pointerId,button:e.target.closest("button")};
  },true);
  document.addEventListener("pointercancel",()=>{discoveryPress=null},true);
  document.addEventListener("click",e=>{
    if(!panel.open||view!=="discovery")return;
    const pointerClick=e.detail>0||!!e.pointerType;
    const fresh=discoveryPress&&discoveryPress.button===e.target.closest("button")&&
      (e.pointerId===undefined||e.pointerId<0||e.pointerId===discoveryPress.id);
    if((pointerClick&&!fresh)||(!pointerClick&&discoveryKeyHeld)){e.preventDefault();e.stopImmediatePropagation()}
    discoveryPress=null;
  },true);
  document.addEventListener("keyup",e=>{
    if(e.key===" "&&discoveryKeyHeld){discoveryKeyHeld=false;e.preventDefault();e.stopImmediatePropagation()}
  },true);
  document.addEventListener("click",e=>{const b=e.target.closest("[data-open],[data-do]");if(!b)return;if(b.dataset.open)open(b.dataset.open);else action(b.dataset.do)});
  document.addEventListener("submit",e=>{if(e.target.id==="loginForm")authenticate(e)});$("#closePanel").onclick=()=>panel.close();panel.onclick=e=>{if(view==="discovery")return;if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientY<r.top||e.clientX>r.right||e.clientY>r.bottom)panel.close()}};panel.onclose=()=>{if(inShop){world?.leaveShop();inShop=false;persist()}view="";world?.lock(false)};$("#interact").onclick=enterShop;
  body.addEventListener("input",e=>{const key=e.target.dataset.volume;if(key!=="music"&&key!=="effects")return;
    prefs[key]=Number(e.target.value);audio.start();audio.volumes();write("설정",prefs);$("#vol-"+key).textContent=prefs[key]+"%"});
  body.addEventListener("change",e=>{if(e.target.dataset.volume==="effects")chime(660)});
  fullscreen();
  $("#dismiss").onclick=()=>$("#snack").hidden=true;setTimeout(()=>$("#snack").hidden=true,8500);
  const cast=$("#cast");cast.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();cast.setPointerCapture(e.pointerId);press()};cast.onpointerup=release;cast.onpointercancel=()=>{if(phase==="charge")state("idle")};cast.oncontextmenu=e=>e.preventDefault();cast.onclick=e=>{if(e.detail===0&&phase==="idle"){press();if(phase==="charge"){power=.55;release()}}};
  window.addEventListener("keydown",e=>{if(panel.open||!world||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(k==="e"){if(!e.repeat)enterShop();return}if(k===" "){e.preventDefault();if(!e.repeat){discoveryKeyHeld=phase==="bite";press();if(view!=="discovery")discoveryKeyHeld=false}}else if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)){e.preventDefault();world.keys.add(k)}});
  window.addEventListener("keyup",e=>{world?.keys.delete(e.key.toLowerCase());if(e.key===" "&&!panel.open){e.preventDefault();release()}});
  const stick=$("#stick"),knob=stick.querySelector("span");let stickId=null;function slide(e){if(!world||stickId!==e.pointerId)return;const b=stick.getBoundingClientRect(),dx=(e.clientX-b.x-b.width/2)/(b.width*.38),dy=(e.clientY-b.y-b.height/2)/(b.height*.38),l=Math.max(1,Math.hypot(dx,dy));world.joy.x=dx/l;world.joy.y=dy/l;knob.style.transform="translate("+dx/l*55+"%,"+dy/l*55+"%)"}
  function reset(){discoveryKeyHeld=false;discoveryPress=null;stickId=null;if(world){world.joy.x=world.joy.y=0;world.keys.clear()}knob.style.transform="";if(phase==="charge")state("idle")}
  stick.onpointerdown=e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);slide(e)};stick.onpointermove=slide;stick.onlostpointercapture=reset;window.addEventListener("blur",reset);
  document.addEventListener("visibilitychange",()=>{clock=0;if(document.hidden){reset();persist();sync()}});window.addEventListener("pagehide",()=>persist());
  if(auth)resume(false).then(sync);else{s.visits++;persist(true)}
  window.addEventListener("online",()=>{if(auth)resume(false).then(sync)});setInterval(()=>{if(document.hidden)return;persist();if(auth&&!ready&&!status.includes("충돌"))resume(false).then(sync);else sync()},15000);
})();
