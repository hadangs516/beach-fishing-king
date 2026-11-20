// Original 64-bar seaside theme: ukulele, upright bass, mallet and reed.
function beachAudio(settings) {
  let context, music, effects, echo, clock, nextBeat=0, step=0;
  const beat=60/91, midi=n=>440*Math.pow(2,(n-69)/12);
  const chords=[
    [62,66,69,73],[59,62,66,69],[55,59,62,66],[57,61,64,67],
    [64,67,71,74],[66,69,73,76],[55,59,62,64],[57,62,64,69]
  ];
  const sections=[
    [0,1,2,3,0,5,4,3],[0,1,6,7,5,1,2,3],
    [2,3,5,1,4,6,7,3],[0,5,2,3,4,1,7,0],
    [1,5,4,3,2,0,4,7],[2,4,1,5,6,2,3,3],
    [0,1,6,7,0,5,4,3],[2,3,1,4,6,7,3,0]
  ];
  const phrases=[
    [0,-1,2,1,-1,0,2,-1],[-1,1,2,-1,3,-1,1,-1],[2,-1,1,0,-1,-1,1,2],[3,-1,-1,2,1,-1,0,-1],
    [1,-1,-1,2,-1,3,2,-1],[-1,0,1,2,-1,-1,1,-1],[2,-1,3,-1,2,0,-1,1],[1,-1,0,-1,-1,-1,-1,-1]
  ];
  function level(bus,v){if(bus)bus.gain.setTargetAtTime(Math.pow(v/100,1.7),context.currentTime,.045)}
  function volumes(){level(music,settings.music);level(effects,settings.effects)}
  function voice(note,at,duration,kind,volume,pan=0,bus=music){
    const osc=context.createOscillator(),env=context.createGain(),filter=context.createBiquadFilter();
    const reed=kind==="reed",pluck=kind==="pluck",bass=kind==="bass";
    osc.type=reed||bass?"triangle":pluck?"sawtooth":"sine";
    osc.frequency.value=midi(note);filter.type="lowpass";filter.frequency.setValueAtTime(pluck?2700:bass?420:3100,at);
    if(pluck)filter.frequency.exponentialRampToValueAtTime(480,at+duration);
    env.gain.setValueAtTime(.0001,at);env.gain.exponentialRampToValueAtTime(volume,at+(reed?.055:.012));
    env.gain.exponentialRampToValueAtTime(.0001,at+duration);
    const stereo=context.createStereoPanner?.();osc.connect(filter);filter.connect(env);
    if(stereo){stereo.pan.value=pan;env.connect(stereo);stereo.connect(bus)}else env.connect(bus);
    if(bus===music&&!bass)env.connect(echo);osc.start(at);osc.stop(at+duration+.025);
    osc.onended=()=>{osc.disconnect();filter.disconnect();env.disconnect();stereo?.disconnect()};
  }
  function playStep(i,t){
    const bar=Math.floor(i/8),part=Math.floor(bar/8)%8,measure=bar%8,pulse=i%8;
    const chord=chords[sections[part][measure]],lighter=part===4||part===5;
    if(pulse===0||pulse===4)voice(chord[pulse===0?0:2]-24,t,beat*(pulse===0?1.5:.9),"bass",.22,-.08);
    if((lighter?[2,6]:[0,3,6]).includes(pulse)){
      chord.slice(lighter?1:0).forEach((n,j)=>voice(n,t+j*.021,beat*(pulse===6?.66:1.1),"pluck",.044,-.38));
    }
    const motif=phrases[(measure+(part===1?2:part===3?4:part))%8],degree=motif[pulse];
    if(degree>=0){
      const register=lighter||part===2?0:12,eighths=motif[pulse+1]===-1?1.5:.82;
      voice(chord[degree]+register,t+.025,beat*eighths,lighter?"reed":"bell",lighter?.12:.16,.21);
    }
    if((part===2||part===6)&&pulse===7&&measure%2===1)
      voice(chord[(measure+1)%4]+12,t+.035,beat*.55,"bell",.075,.48);
  }
  function schedule(){
    if(!context||context.state!=="running"||document.hidden)return;
    if(nextBeat<context.currentTime-.15)nextBeat=context.currentTime+.05;
    while(nextBeat<context.currentTime+.22){
      if(settings.music>0)playStep(step,nextBeat+(step%2?beat*.045:0));
      nextBeat+=beat*.5;step=(step+1)%512;
    }
  }
  function start(){
    if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      context=new Audio();music=context.createGain();effects=context.createGain();
      music.connect(context.destination);effects.connect(context.destination);
      echo=context.createDelay(.8);echo.delayTime.value=beat*.5;
      const feedback=context.createGain();feedback.gain.value=.12;echo.connect(feedback);feedback.connect(music);
      volumes();nextBeat=context.currentTime+.08;clock=setInterval(schedule,85);
    }
    if(!document.hidden&&context.state==="suspended")context.resume().catch(()=>{});
  }
  document.addEventListener("visibilitychange",()=>{if(!context)return;if(document.hidden)context.suspend().catch(()=>{});else start()});
  function castSound(splash=false){
    if(!context||settings.effects===0)return;
    const seconds=splash?.29:.34,at=context.currentTime,buffer=context.createBuffer(1,Math.ceil(seconds*context.sampleRate),context.sampleRate);
    const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),env=context.createGain();
    source.buffer=buffer;filter.type="bandpass";filter.Q.value=splash?.8:2.2;
    filter.frequency.setValueAtTime(splash?3200:620,at);filter.frequency.exponentialRampToValueAtTime(splash?560:2400,at+seconds*.75);
    env.gain.setValueAtTime(.001,at);env.gain.exponentialRampToValueAtTime(splash?.53:.32,at+(splash?.012:.095));env.gain.exponentialRampToValueAtTime(.001,at+seconds);
    source.connect(filter);filter.connect(env);env.connect(effects);source.start(at);
    source.onended=()=>{source.disconnect();filter.disconnect();env.disconnect()};
  }
  return {start,volumes,castSound,chime(hz){if(!context||settings.effects===0)return;const n=69+12*Math.log2(hz/440);
    voice(n,context.currentTime+.01,.19,"bell",.18,0,effects);
    voice(n+4,context.currentTime+.09,.19,"bell",.11,.1,effects)}};
}
