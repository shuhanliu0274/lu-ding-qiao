// 飞夺泸定桥：所有位图先加载、抠图并缓存，循环中只读 sprites。
(() => {
  'use strict';
  document.body.innerHTML = `<main id="app"><div id="stage">
    <video id="entryVideo" src="enter2 (1).mp4" autoplay muted loop playsinline></video>
    <video id="introVideo" src="游戏入场动画.mp4" preload="auto" playsinline></video>
    <video id="bgVideo" src="background.mp4" muted loop playsinline preload="auto"></video>
    <video id="endVideo" src="Video Project.mp4" muted loop playsinline preload="auto"></video>
    <canvas id="gameCanvas" width="1280" height="720"></canvas>
    <div id="shade"></div><section id="panel"><small id="eyebrow"></small><h1 id="headline"></h1><p id="bodyText"></p><button id="action"></button></section>
    <div id="caption"></div><div id="hud"><span id="chapter"></span><div id="rail"><i id="railFill"></i></div><span id="hint">点击 / 空格开火 · N快进</span></div>
    <div id="loader">正在整理历史影像与美术资源…</div>
  </div></main>`;
  const css = document.createElement('style');
  css.textContent = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#080b0b;color:#eee7d1;font-family:"Microsoft YaHei","SimHei",sans-serif;overflow:hidden}#app{width:100vw;height:100vh;display:grid;place-items:center}#stage{position:relative;width:min(100vw,177.777vh);height:min(100vh,56.25vw);overflow:hidden;background:#050706;box-shadow:0 0 70px #000}#stage video,#gameCanvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}#stage video{display:none}#entryVideo{display:block}#gameCanvas{display:none}#shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,5,5,.93) 0%,rgba(3,5,5,.72) 34%,rgba(3,5,5,.17) 73%),linear-gradient(0deg,rgba(0,0,0,.42),transparent 42%);pointer-events:none}#panel{position:absolute;top:29%;left:8%;width:48%;text-align:left;z-index:3}#eyebrow{display:block;letter-spacing:.32em;color:#d5c7ab;font-size:clamp(12px,1.1vw,22px)}#headline{font-family:"SimSun",serif;font-weight:500;font-size:clamp(42px,5vw,108px);letter-spacing:.1em;margin:.52em 0 .3em;text-shadow:0 3px 12px #000}#bodyText{font-size:clamp(15px,1.43vw,29px);line-height:2;letter-spacing:.09em;max-width:92%;white-space:pre-line;color:#e4dccd;text-shadow:0 2px 8px #000}#action{background:#243027;border:1px solid #a6a18c;color:#fff;font:bold clamp(22px,2vw,42px) "SimHei",sans-serif;padding:.27em 1.1em;cursor:pointer;box-shadow:0 3px 15px #000;text-shadow:2px 2px #8e3028,-1px -1px #fff;margin-top:1.15em}#action:hover{background:#344b3a}#caption{position:absolute;left:12%;right:12%;bottom:12%;text-align:center;font:clamp(18px,2.1vw,40px) "SimSun",serif;letter-spacing:.12em;text-shadow:0 3px 12px #000,0 0 18px #000;opacity:0;transition:opacity .8s;pointer-events:none}#hud{display:none;position:absolute;left:5%;right:5%;bottom:4%;align-items:center;gap:1.4vw;font-size:clamp(12px,1vw,20px);text-shadow:0 2px 7px #000}#rail{height:12px;border-top:3px double #b1aaa0;border-bottom:3px double #666b69;flex:1;position:relative}#railFill{position:absolute;left:0;top:1px;height:4px;background:#bd5f49;width:0%;box-shadow:0 0 7px #cf704a}#loader{position:absolute;bottom:4%;right:4%;font-size:14px;z-index:8;letter-spacing:.12em}#stage[data-scene="intro"] #entryVideo,#stage[data-scene="film"] #entryVideo,#stage[data-scene="game"] #entryVideo,#stage[data-scene="end"] #entryVideo{display:none}#stage[data-scene="intro"] #introVideo,#stage[data-scene="film"] #introVideo{display:block}#stage[data-scene="game"] #bgVideo,#stage[data-scene="end"] #endVideo{display:block}#stage[data-scene="game"] #gameCanvas{display:block}#stage[data-scene="game"] #panel,#stage[data-scene="film"] #panel{display:none}#stage[data-scene="game"] #hud{display:flex}#stage[data-scene="game"] #shade{background:linear-gradient(0deg,rgba(0,0,0,.42),transparent 35%)}#stage[data-scene="film"] #shade{background:linear-gradient(90deg,rgba(0,0,0,.6),transparent 70%)}#stage[data-scene="end"] #shade{background:linear-gradient(90deg,rgba(0,0,0,.96),rgba(0,0,0,.78) 40%,rgba(0,0,0,.05) 75%)}#stage[data-scene="end"] #panel{top:24%;width:50%}`;
  css.textContent += '#stage{background:#172124 url("background.png") center/cover no-repeat}#stage[data-scene="entry"] #entryVideo{display:none}#stage.entryVideoReady[data-scene="entry"] #entryVideo{display:block}#stage[data-scene="entry"] #shade{display:none}#stage[data-scene="entry"] #panel{inset:0;width:100%;pointer-events:none}#stage[data-scene="entry"] #eyebrow,#stage[data-scene="entry"] #headline,#stage[data-scene="entry"] #bodyText{display:none}#stage[data-scene="entry"] #action{position:absolute;left:43%;top:85%;width:14%;height:10%;margin:0;opacity:1;pointer-events:auto;background:rgba(26,52,32,.83)}#stage[data-scene="entry"] #action:focus-visible{outline:3px solid #fff}#stage[data-scene="intro"]{background:#000}#stage[data-scene="intro"] video,#stage[data-scene="intro"] #gameCanvas{display:none}#stage[data-scene="intro"] #shade{background:#000}#stage[data-scene="intro"] #panel{top:31%;left:13%;width:74%}#stage[data-scene="intro"] #headline{display:none}#stage[data-scene="intro"] #bodyText{font:clamp(23px,2.5vw,50px)/1.8 "SimSun",serif;color:#fff;max-width:100%}#stage[data-scene="intro"] #action{font-size:clamp(16px,1.3vw,26px)}#stage[data-scene="film"] #panel{display:block;inset:0;width:100%;pointer-events:none}#stage[data-scene="film"] #eyebrow,#stage[data-scene="film"] #headline,#stage[data-scene="film"] #bodyText{display:none}#stage[data-scene="film"] #action{position:absolute;right:4%;bottom:4%;left:auto;top:auto;margin:0;pointer-events:auto;font-size:18px;opacity:.78}#loader{left:50%;right:auto;bottom:18%;transform:translateX(-50%);background:rgba(0,0,0,.75);padding:12px 18px;font-size:18px;white-space:nowrap}';
  css.textContent += '#stage[data-scene="intro"] #introVideo,#stage[data-scene="intro"] #entryVideo,#stage[data-scene="intro"] #bgVideo,#stage[data-scene="intro"] #endVideo{display:none}';
  css.textContent += '#rail{height:21px;border:0;background:radial-gradient(ellipse 12px 8px at 13px 10px,transparent 42%,#84908d 49%,#242b2d 68%,transparent 73%) 0 0/26px 21px repeat-x;filter:drop-shadow(0 2px 3px #000)}#rail::after{content:"";position:absolute;left:0;right:0;top:8px;height:4px;background:repeating-linear-gradient(90deg,#303839 0 9px,#8b9895 10px 17px,#303839 20px 26px);z-index:-1}#railFill{top:0;height:21px;max-width:100%;background:radial-gradient(ellipse 12px 8px at 13px 10px,transparent 42%,#cc9b70 49%,#713e32 68%,transparent 73%) 0 0/26px 21px repeat-x;box-shadow:none}#stage[data-scene="entry"] #action{opacity:0;background:transparent;border:0;box-shadow:none;color:transparent;text-shadow:none}#stage[data-scene="entry"] #action:focus-visible{opacity:0;outline:2px solid #fff}#stage.entryVideoError[data-scene="entry"] #action{opacity:1;background:#243027;color:#fff;border:1px solid #a6a18c;text-shadow:2px 2px #8e3028}';
  document.head.appendChild(css);

  const stage = document.getElementById('stage');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const SOLDIER_HEIGHT = canvas.height * 0.22;
  const sprites = Object.create(null);
  const vids = {entry:document.getElementById('entryVideo'),intro:document.getElementById('introVideo'),bg:document.getElementById('bgVideo'),end:document.getElementById('endVideo')};
  vids.entry.addEventListener('loadeddata',()=>stage.classList.add('entryVideoReady'));
  vids.entry.addEventListener('error',()=>stage.classList.add('entryVideoError'));
  vids.entry.addEventListener('click',()=>{if(scene==='entry'&&ready)start();});
  if(vids.entry.readyState>=2)stage.classList.add('entryVideoReady');
  const el = id => document.getElementById(id);
  let scene='entry', ready=false, elapsed=0, last=0, muzzleTime=0, shake=0, captionUntil=0, pausedForCaption=0;
  let actionFrames=[],shootFrames=[],finishFrames=[],enemyFrames=[];
  let downUntil=[0,0,0,0], shots=0, currentChapter=-1, endingAt=0;
  const audioPaths={
    bgm:['music/bgm.aiff'],
    rain:['music/rain.aiff'],
    fight:['music/fight.aiff'],
    shootgun:['music/shootgun.aiff'],
    shootshoot:['music/shootshoot.aiff']
  };
  const tracks=Object.create(null);let audioStarted=false,audioLoaded=false;
  function play(a){if(!a)return;try{const result=a.play();if(result&&result.catch)result.catch(e=>console.warn('音频播放失败:',a.src,e));}catch(e){console.warn('音频播放失败:',a.src,e);}}
  function silence(){for(const a of Object.values(tracks))if(a)a.pause();}
  let fadeGeneration=0;
  function fadeAudio(a,target,ms){const generation=fadeGeneration;return new Promise(resolve=>{if(!a){resolve();return;}const from=a.volume,begin=performance.now();function tick(now){if(generation!==fadeGeneration){resolve();return;}const p=Math.min(1,(now-begin)/ms);a.volume=Math.max(0,Math.min(1,from+(target-from)*p));if(p<1)requestAnimationFrame(tick);else{if(target===0)a.pause();resolve();}}requestAnimationFrame(tick);});}
  function startAudio(){fadeGeneration++;audioStarted=true;for(const [key,volume] of Object.entries({bgm:.4,rain:.25,fight:.55,shootgun:.34,shootshoot:.34}))if(tracks[key])tracks[key].volume=volume;play(tracks.bgm);play(tracks.rain);}
  function waitAudio(a){return new Promise(resolve=>{let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);a.removeEventListener('canplaythrough',yes);a.removeEventListener('error',no);resolve(ok);};const yes=()=>finish(true),no=()=>finish(false);const timer=setTimeout(()=>finish(false),12000);a.addEventListener('canplaythrough',yes,{once:true});a.addEventListener('error',no,{once:true});a.preload='auto';a.load();if(a.readyState>=4)finish(true);});}
  // 把现有未压缩 AIFF 包装为浏览器可播放的 WAV。只转换文件格式，不合成音效。
  function aiffToWav(buffer){
    const b=new Uint8Array(buffer),v=new DataView(buffer);const tag=(p,n)=>String.fromCharCode(...b.subarray(p,p+n));
    if(tag(0,4)!=='FORM'||!['AIFF','AIFC'].includes(tag(8,4)))throw Error('不是 AIFF PCM 文件');
    let channels=0,bits=0,rate=0,sound=null,little=false;
    for(let p=12;p+8<=b.length;){const name=tag(p,4),size=v.getUint32(p+4,false),q=p+8;if(q+size>b.length)break;
      if(name==='COMM'){channels=v.getUint16(q,false);bits=v.getUint16(q+6,false);const exponent=((b[q+8]&127)<<8)|b[q+9];let mantissa=0;for(let i=0;i<8;i++)mantissa=mantissa*256+b[q+10+i];rate=Math.round(mantissa*Math.pow(2,exponent-16383-63));if(tag(8,4)==='AIFC'){const codec=tag(q+18,4);if(codec==='sowt')little=true;else if(codec!=='NONE'&&codec!=='twos')throw Error('暂不支持压缩 AIFF: '+codec);}}
      if(name==='SSND'){const offset=v.getUint32(q,false);sound=b.subarray(q+8+offset,q+size);}
      p=q+size+(size&1);
    }
    if(!sound||!channels||!rate||![8,16,24,32].includes(bits))throw Error('AIFF 缺少 PCM 数据');
    const bytes=bits/8,len=sound.length-sound.length%bytes,out=new Uint8Array(44+len),dv=new DataView(out.buffer);
    const write=(p,s)=>{for(let i=0;i<s.length;i++)out[p+i]=s.charCodeAt(i);};write(0,'RIFF');dv.setUint32(4,36+len,true);write(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,channels,true);dv.setUint32(24,rate,true);dv.setUint32(28,rate*channels*bytes,true);dv.setUint16(32,channels*bytes,true);dv.setUint16(34,bits,true);write(36,'data');dv.setUint32(40,len,true);
    for(let i=0;i<len;i+=bytes)for(let j=0;j<bytes;j++)out[44+i+j]=sound[i+(little||bytes===1?j:bytes-1-j)];
    return new Blob([out],{type:'audio/wav'});
  }
  async function loadAudio(key,paths){for(const path of paths){
    const a=new Audio();a.src=encodeURI(path);if(await waitAudio(a)){tracks[key]=a;break;}
    if(/\.aiff?$/i.test(path)){try{const response=await fetch(encodeURI(path));if(!response.ok)continue;const blob=aiffToWav(await response.arrayBuffer());const converted=new Audio();converted.src=URL.createObjectURL(blob);if(await waitAudio(converted)){tracks[key]=converted;break;}URL.revokeObjectURL(converted.src);}catch(e){console.warn('音频转换失败:',path,e);}}
  }
    if(!tracks[key]){console.warn('音频加载失败:',key,paths);return;}
    tracks[key].loop=key==='bgm'||key==='rain';tracks[key].volume={bgm:.4,rain:.25,fight:.55,shootgun:.34,shootshoot:.34}[key];
  }
  const audioReady=Promise.all(Object.entries(audioPaths).map(([key,paths])=>loadAudio(key,paths))).then(()=>{audioLoaded=true;});
  function showPanel(eyebrow,headline,body,button){el('eyebrow').textContent=eyebrow;el('headline').textContent=headline;el('bodyText').textContent=body;el('action').textContent=button;el('action').style.display=button?'inline-block':'none';}
  function setScene(next){scene=next;stage.dataset.scene=next;for(const [key,v] of Object.entries(vids)){if((next==='entry'&&key==='entry')||(next==='film'&&key==='intro')||(next==='game'&&key==='bg')||(next==='end'&&key==='end'))play(v);else v.pause();}}
  function notice(s,seconds=5){el('caption').textContent=s;el('caption').style.opacity='1';captionUntil=performance.now()+seconds*1000;}

  // 图片均由 new Image() 加载；onload 完成后才进入 Promise.all 的后续处理。
  const assetVersion=Date.now();
  function loadImage(url){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{console.warn('图片加载失败:',url);resolve(null);};img.src=encodeURI(url)+(url.includes('?')?'&':'?')+'asset='+assetVersion;});}
  function borderBackground(r,g,b,a){return a===0||(r>240&&g>240&&b>240)||(r>208&&g>208&&b>208&&Math.max(r,g,b)-Math.min(r,g,b)<13);}
  function processImage(img,url){
    if(!img)return null;
    if(/^(background|art|enter|UI)\./i.test(url))return img;
    if(/(^|\/)flag\.png$/i.test(url))return img; // 用户已重新抠好的旗帜，直接用原生透明像素。
    // 新抠好的动作 PNG 保留原生透明通道，避免跨域像素读取污染 Canvas。
    if(/^(character|dongzuozhen)\//i.test(url)&&/\.png$/i.test(url))return img;
    if(!/\.(jpe?g|png)$/i.test(url))return img;
    const source=document.createElement('canvas');const scale=Math.min(1,640/Math.max(img.naturalWidth,img.naturalHeight));source.width=Math.max(1,Math.round(img.naturalWidth*scale));source.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const c=source.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=false;c.drawImage(img,0,0,source.width,source.height);
    const w=source.width,h=source.height;let p;
    try{p=c.getImageData(0,0,w,h);}catch(error){console.warn('无法读取图片像素，直接使用已加载素材:',url,error);return img;}
    const d=p.data;
    let hasAlpha=false;for(let i=3;i<d.length;i+=4){if(d[i]<250){hasAlpha=true;break;}}
    // PNG 真透明素材直接使用原图；JPG 和假透明棋盘底素材只清除与边缘相连的浅色背景。
    if(hasAlpha&&/\.png$/i.test(url))return img;
    const seen=new Uint8Array(w*h),q=new Int32Array(w*h);let head=0,tail=0;
    function visit(x,y){if(x<0||x>=w||y<0||y>=h)return;const n=y*w+x;if(seen[n])return;seen[n]=1;const i=n*4;if(borderBackground(d[i],d[i+1],d[i+2],d[i+3]))q[tail++]=n;}
    for(let x=0;x<w;x++){visit(x,0);visit(x,h-1);}for(let y=0;y<h;y++){visit(0,y);visit(w-1,y);}
    while(head<tail){const n=q[head++],i=n*4;d[i+3]=0;const x=n%w,y=(n-x)/w;visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
    // 明确的纯白色键控，并只在加载时执行一次。
    for(let i=0;i<d.length;i+=4){if(d[i]>240&&d[i+1]>240&&d[i+2]>240&&d[i+3]!==0){
      // 保留旗帜白色布面等被不透明轮廓包围的历史图案。
      if(!/flag|旗|muzzle|开火/i.test(url))d[i+3]=0;
    }}
    c.putImageData(p,0,0);
    // 裁去抠图后的透明边，稳定所有动作帧的可见高度。
    let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>20){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}
    if(x1<0)return null;
    const out=document.createElement('canvas');out.width=x1-x0+1;out.height=y1-y0+1;out.getContext('2d').drawImage(source,x0,y0,out.width,out.height,0,0,out.width,out.height);return out;
  }
  async function loadAll(){
    const files={background:'background.png',flag:'flag.png',muzzle:'gun.png',heroIdle:'character/1.png',heroAim:'character/2.png',motion1:'dongzuozhen/1.png',motion2:'dongzuozhen/2.png',motion3:'dongzuozhen/3.png',motion4:'dongzuozhen/4.png',motion5:'dongzuozhen/5.png',motion6:'dongzuozhen/6.png',finishStand:'dongzuozhen/胜利.png',finishCheer:'dongzuozhen/2胜利.png'};
    // 必须等待全部图片的 onload/onerror，再启动 requestAnimationFrame。
    const loaded=await Promise.all(Object.entries(files).map(async ([key,url])=>[key,processImage(await loadImage(url),url)]));
    for(const [key,img] of loaded)if(img)sprites[key]=img;
    if(!sprites.flag){const flag=document.createElement('canvas');flag.width=120;flag.height=190;const f=flag.getContext('2d');f.fillStyle='#58452d';f.fillRect(12,6,7,180);f.fillStyle='#a92724';f.beginPath();f.moveTo(19,18);f.lineTo(112,34);f.lineTo(104,111);f.lineTo(19,102);f.closePath();f.fill();f.fillStyle='#e3d6b2';f.font='bold 18px SimHei';f.fillText('红军',36,67);sprites.flag=flag;console.warn('旗帜图片未加载，暂用不透明备用旗帜。');}
    finishFrames=['finishStand','finishCheer'].filter(k=>sprites[k]);
    const newMotion=['motion1','motion2','motion3','motion4','motion5','motion6'].filter(k=>sprites[k]);
    if(newMotion.length)actionFrames=newMotion;
    if(!actionFrames.length)actionFrames=['heroIdle','heroAim'].filter(k=>sprites[k]);
    shootFrames=['heroAim'].filter(k=>sprites[k]);
    if(!shootFrames.length)shootFrames=actionFrames.slice(0,1);
    enemyFrames=['heroIdle'].filter(k=>sprites[k]);
    await audioReady;
    ready=true;el('loader').remove();
    showPanel('互动历史短片 / 1935','飞夺泸定桥','铁索之上 · 大渡河畔\n约两分钟 · 自动攀索 · 点击或空格开火','开始');
    el('action').onclick=start;
    stage.dataset.scene='entry';
    requestAnimationFrame(loop);
  }
  // 全部人物、敌人和旗帜统一经过此函数；targetHeight 由固定常量派生。
  function drawSprite(img,x,y,targetHeight){if(!img)return;const ratio=img.width/img.height;const h=targetHeight;const w=h*ratio;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,x,y,w,h);}
  // 历史节点 1：黑屏、脚步与雨声，字幕停留约十秒。
  function start(){if(!ready)return;startAudio();setScene('intro');el('caption').style.opacity='0';showPanel('序章 / 1935年5月29日凌晨','','红四团一昼夜奔袭240里。\n前方，是横跨大渡河的泸定桥。','继续');el('action').onclick=film;setTimeout(()=>{if(scene==='intro')film();},7500);}
  function film(){if(scene!=='intro')return;setScene('film');showPanel('','','','进入桥头');el('action').onclick=beginGame;try{vids.intro.currentTime=0;}catch{}play(vids.intro);el('caption').style.opacity='0';vids.intro.onended=beginGame;vids.intro.onerror=beginGame;setTimeout(()=>{if(scene==='film')beginGame();},12000);}
  function beginGame(){if(scene==='game'||scene==='end')return;setScene('game');elapsed=0;currentChapter=-1;try{vids.bg.currentTime=0;}catch{}chapter(0);}
  // 历史节点 1：凌晨奔袭；节点 2：二十二勇士接近桥头。
  const chapters=[
    // 历史节点 2：二十二勇士接近桥头。
    {at:0,label:'接近桥头',text:'二十二名勇士，冒着弹雨，攀上铁索'},
    // 历史节点 3：攀索推进，木板被抽。
    {at:14,label:'攀索推进',text:'木板被抽，脚下是咆哮的大渡河'},
    // 历史节点 4：火势与铁索摇晃。
    {at:34,label:'火势与摇晃',text:'冲过去！夺下泸定桥！'},
    // 历史节点 5：冲锋号与最后冲锋。
    {at:55,label:'最后冲锋',text:'冲锋号响起，向对岸桥头推进'},
    // 历史节点 6：夺桥成功，静默三秒。
    {at:96,label:'夺桥成功',text:'红旗插上桥头堡。铁索上的勇士完成了突击。'}
  ];
  function chapter(i){if(currentChapter===i)return;currentChapter=i;el('chapter').textContent=chapters[i].label;notice(chapters[i].text,i===4?7:5);pausedForCaption=i===4?0:2;if(i===2)shake=1.1;if(i===3){if(tracks.fight){tracks.fight.currentTime=0;play(tracks.fight);}}if(i===4){endingAt=Infinity;Promise.all(Object.values(tracks).map(a=>fadeAudio(a,0,900))).then(()=>{endingAt=performance.now();});}}
  function fire(){if(scene!=='game'||currentChapter===4)return;muzzleTime=.13;shots++;const i=(shots-1)%downUntil.length;downUntil[i]=elapsed+5;shake=Math.max(shake,.09);const gun=tracks[shots%2?'shootgun':'shootshoot'];if(gun&&(gun.paused||gun.ended)){try{gun.currentTime=0;play(gun);}catch(e){console.warn('射击音效播放失败:',e);}}}
  // 按背景桥面的透视斜率定位脚底：左岸约 y=502，右岸桥头约 y=230。
  function bridgeY(x){return 502-x*.28;}
  function drawBackground(){
    if(vids.bg.readyState>=2)ctx.drawImage(vids.bg,0,0,canvas.width,canvas.height);
    else if(sprites.background)ctx.drawImage(sprites.background,0,0,canvas.width,canvas.height);
    else{ctx.fillStyle='#172326';ctx.fillRect(0,0,1280,720);}
    const haze=ctx.createLinearGradient(0,0,0,720);haze.addColorStop(0,'rgba(2,6,8,.12)');haze.addColorStop(1,'rgba(2,8,10,.23)');ctx.fillStyle=haze;ctx.fillRect(0,0,1280,720);
  }
  function drawActor(){
    const progress=Math.min(1,elapsed/96),x=140+progress*730,y=bridgeY(x)-SOLDIER_HEIGHT+20;
    const group=currentChapter===4?finishFrames:(muzzleTime>0&&shootFrames.length?shootFrames:actionFrames);
    const frameClock=currentChapter===4?performance.now()/1000:elapsed;
    const key=group.length?group[Math.floor(frameClock*(currentChapter===4?1.4:currentChapter===3?3:2.2))%group.length]:null;
    if(key)drawSprite(sprites[key],x,y,SOLDIER_HEIGHT);
    if(currentChapter===4&&sprites.flag)drawSprite(sprites.flag,995,bridgeY(995)-SOLDIER_HEIGHT*.8,SOLDIER_HEIGHT*1.1);
    if(muzzleTime>0){
      // 开火资源朝左，翻转后只显示枪口火光，不画射线或弹道。
      const mx=x+SOLDIER_HEIGHT*.53,my=y+SOLDIER_HEIGHT*.42;
      ctx.save();ctx.translate(mx,my);ctx.scale(-1,1);
      if(sprites.muzzle)drawSprite(sprites.muzzle,-SOLDIER_HEIGHT*.65,-SOLDIER_HEIGHT*.14,SOLDIER_HEIGHT*.28);
      else{ctx.fillStyle='#ffbf45';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(-30,0);ctx.lineTo(0,9);ctx.fill();}
      ctx.restore();
    }
    // 对岸守军仅为低饱和剪影；中弹后短暂倒伏，无计分与失败惩罚。
    for(let i=0;i<4;i++){const ex=940+i*74,ey=bridgeY(ex)-SOLDIER_HEIGHT*.56;ctx.save();ctx.globalAlpha=.34;ctx.filter='grayscale(1) brightness(.35)';if(downUntil[i]>elapsed){ctx.translate(ex,ey+SOLDIER_HEIGHT*.55);ctx.rotate(1.15);if(enemyFrames.length)drawSprite(sprites[enemyFrames[0]],0,-SOLDIER_HEIGHT*.55,SOLDIER_HEIGHT*.55);}else if(enemyFrames.length)drawSprite(sprites[enemyFrames[0]],ex,ey,SOLDIER_HEIGHT*.55);ctx.restore();}
  }
  function draw(){ctx.clearRect(0,0,1280,720);ctx.save();if(shake>0){ctx.translate(Math.sin(elapsed*77)*shake*4,Math.cos(elapsed*61)*shake*3);}drawBackground();drawActor();ctx.restore();el('railFill').style.width=(Math.min(1,elapsed/96)*100)+'%';}
  function loop(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(scene==='game'){
      if(pausedForCaption>0)pausedForCaption=Math.max(0,pausedForCaption-dt);else if(currentChapter<4)elapsed=Math.min(96,elapsed+dt*(currentChapter===3?1.8:1));
      muzzleTime=Math.max(0,muzzleTime-dt);shake=Math.max(0,shake-dt*1.5);
      const next=chapters.findLastIndex(c=>elapsed>=c.at);if(next>currentChapter)chapter(next);
      draw();if(currentChapter===4&&performance.now()-endingAt>=3000)end();
    }if(captionUntil&&t>captionUntil){el('caption').style.opacity='0';captionUntil=0;}requestAnimationFrame(loop);}
  function end(){setScene('end');showPanel('1935 · 四川泸定','飞夺泸定桥','1935年5月29日，红军夺取泸定桥，打开了继续北上的通道。\n\n这段历史，记录着长征途中坚定的意志与牺牲精神。','重新观看');el('action').onclick=()=>{silence();setScene('entry');showPanel('互动历史短片 / 1935','飞夺泸定桥','铁索之上 · 大渡河畔\n约两分钟 · 自动攀索 · 点击或空格开火','开始');el('action').onclick=start;};if(tracks.bgm){tracks.bgm.volume=0;play(tracks.bgm);fadeAudio(tracks.bgm,.4,1200);}}
  window.addEventListener('pointerdown',e=>{if(scene==='game'&&!e.target.closest('button'))fire();});
  window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();fire();}if(e.code==='Enter'&&scene==='film')beginGame();if(e.code==='KeyN'){e.preventDefault();if(scene==='intro')film();else if(scene==='film')beginGame();else if(scene==='game'&&currentChapter<4){const next=chapters.find(c=>c.at>elapsed+.5);elapsed=next?next.at:96;pausedForCaption=0;}}});
  showPanel('互动历史短片 / 1935','飞夺泸定桥','正在加载资源…','');
  loadAll().catch(err=>{el('loader').textContent='资源加载失败：'+err.message;});
})();
