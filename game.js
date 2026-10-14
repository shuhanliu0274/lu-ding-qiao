/* 飞夺泸定桥：本地可运行的历史互动原型。
   史实节点：序章 0、攀桥 55、铁索 150、火线 370、冲锋 490、夺桥 570 秒。 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('world');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const src = {
    background: 'background.png', art: 'art.png',
    figures: [
      'character/长征主题射击游戏灵感 2.png',
      'character/长征主题射击游戏灵感 2 (1).jpeg',
      'character/长征主题射击游戏灵感 2.jpeg'
    ],
    rain: 'music/打雷下雨的声音_(Rain_and_Thunder_Sounds)_和平风暴_风暴噪音_雷霆声音.aiff',
    battle: 'music/枪炮声战场_纯音乐.aiff',
    charge: 'music/飞机声+枪炮声+冲锋号声_(Inst.)_纯音乐.aiff',
    bgm: 'music/飞夺泸定桥_刘娟.aiff'
  };
  const stage = [
    {from: 0, to: 55, title: '01 / 昼夜兼程', text: '1935年5月29日凌晨，红四团一昼夜奔袭240里', note: '山路、雨夜、未曾停下的脚步。'},
    {from: 55, to: 150, title: '02 / 接近桥头', text: '二十二名勇士，冒着弹雨，攀上铁索', note: '岸边火力掩护，突击开始。'},
    {from: 150, to: 370, title: '03 / 铁索之上', text: '木板被抽，脚下是咆哮的大渡河', note: '沿着铁索，一步一步向前。'},
    {from: 370, to: 490, title: '04 / 穿越火线', text: '冲过去！夺下泸定桥！', note: '火光逼近，铁索仍在晃动。'},
    {from: 490, to: 570, title: '05 / 最后冲锋', text: '冲锋号响起，向桥头前进', note: '按住空格或鼠标，掩护冲锋。'},
    {from: 570, to: 600, title: '06 / 夺桥成功', text: '泸定桥，夺下了。', note: '静默，铭记。'}
  ];
  const image = path => { const i = new Image(); i.src = path; return i; };
  const bg = image(src.background), art = image(src.art);
  const actors = src.figures.map(path => ({image: image(path), cut: null, box: null}));
  function eraseExterior(canvas, pixels) {
    const w = canvas.width, h = canvas.height, d = pixels.data;
    const seen = new Uint8Array(w * h), queue = new Uint32Array(w * h);
    let head = 0, tail = 0;
    function background(i) {
      const k = i * 4, r = d[k], g = d[k + 1], b = d[k + 2];
      return d[k + 3] < 40 || (Math.min(r, g, b) > 190 && Math.max(r, g, b) - Math.min(r, g, b) < 35);
    }
    function add(i) { if (!seen[i] && background(i)) { seen[i] = 1; queue[tail++] = i; } }
    for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
    while (head < tail) {
      const i = queue[head++], x = i % w, y = Math.floor(i / w);
      d[i * 4 + 3] = 0;
      if (x > 0) add(i - 1); if (x + 1 < w) add(i + 1);
      if (y > 0) add(i - w); if (y + 1 < h) add(i + w);
    }
  }
  async function firstLocalImage(bases) {
    for (const base of bases) for (const extension of ['png', 'jpg', 'jpeg', 'webp']) {
      try { const img = new Image(); img.src = base + '.' + extension; await img.decode(); return img; }
      catch (e) { /* 继续寻找同名的其他图片格式。 */ }
    }
    return null;
  }
  async function loadEntranceArt() {
    const [still, title] = await Promise.all([
      firstLocalImage(['enter', 'Enter', 'ENTER']),
      firstLocalImage(['UI', 'ui', 'Ui'])
    ]);
    if (still) {
      $('entryStill').src = still.src;
      $('stage').classList.add('hasStill'); $('entry').classList.add('hasStill');
      $('entryVideo').pause(); hide('entryVideo', true);
    }
    if (title) {
      const c = $('entryTitleArt'), g = c.getContext('2d');
      g.drawImage(title, title.width * .04, title.height * .22, title.width * .93, title.height * .58, 0, 0, c.width, c.height);
      $('stage').classList.add('hasTitle'); $('entry').classList.add('hasTitle');
    }
  }
  const motion = {finish: [], climb: [], shoot: [], run: [], hit: [], generic: []};
  let motionCount = 0, shotPose = 0;
  function motionType(name) {
    const s = name.toLowerCase();
    if (/胜利|终点|结束|完成|欢呼|举枪|凯旋|victory|celebrate|finish|success|ending/.test(s)) return 'finish';
    if (/受伤|受击|中弹|受创|hit|hurt|damage/.test(s)) return 'hit';
    if (/射击|开枪|开火|射|枪|shoot|fire|attack/.test(s)) return 'shoot';
    if (/攀|爬|索|climb|crawl|rope/.test(s)) return 'climb';
    if (/冲锋|奔跑|跑|冲|run|rush|sprint/.test(s)) return 'run';
    if (/待机|站立|静止|休息|idle|stand/.test(s)) return 'finish';
    return 'generic';
  }
  function runs(flags, minLength) {
    const result = []; let from = -1;
    for (let i = 0; i <= flags.length; i++) {
      if (i < flags.length && flags[i] && from < 0) from = i;
      if ((i === flags.length || !flags[i]) && from >= 0) {
        if (i - from >= minLength) result.push([from, i - from]);
        from = -1;
      }
    }
    return result;
  }
  function prepareMotionFrame(img) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', {willReadFrequently: true}); g.drawImage(img, 0, 0);
    const frame = g.getImageData(0, 0, c.width, c.height), data = frame.data;
    eraseExterior(c, frame);
    const cols = new Uint16Array(c.width), rows = new Uint16Array(c.height);
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const k = (y * c.width + x) * 4;
      if (data[k + 3] > 100) { cols[x]++; rows[y]++; }
    }
    g.putImageData(frame, 0, 0);
    const colRuns = runs(Array.from(cols, n => n > Math.max(1, c.height * .006)), Math.max(4, c.width * .08));
    const rowRuns = runs(Array.from(rows, n => n > Math.max(1, c.width * .006)), Math.max(4, c.height * .08));
    let tiles = [];
    if (colRuns.length * rowRuns.length > 1 && colRuns.length * rowRuns.length <= 48) {
      for (const [y, h] of rowRuns) for (const [x, w] of colRuns) tiles.push([x, y, w, h]);
    } else if (c.width > c.height * 1.7) {
      const n = Math.min(48, Math.round(c.width / c.height));
      for (let i = 0; i < n; i++) tiles.push([Math.floor(i * c.width / n), 0, Math.ceil(c.width / n), c.height]);
    } else if (c.height > c.width * 1.7) {
      const n = Math.min(48, Math.round(c.height / c.width));
      for (let i = 0; i < n; i++) tiles.push([0, Math.floor(i * c.height / n), c.width, Math.ceil(c.height / n)]);
    } else tiles = [[0, 0, c.width, c.height]];
    return tiles.map(([x, y, w, h]) => {
      let left = x + w, top = y + h, right = x, bottom = y;
      for (let yy = y; yy < Math.min(c.height, y + h); yy++) for (let xx = x; xx < Math.min(c.width, x + w); xx++) {
        if (data[(yy * c.width + xx) * 4 + 3] > 100) {
          left = Math.min(left, xx); top = Math.min(top, yy);
          right = Math.max(right, xx); bottom = Math.max(bottom, yy);
        }
      }
      return right > left && bottom > top ? {canvas: c, box: [left, top, right - left + 1, bottom - top + 1]} : null;
    }).filter(Boolean);
  }
  async function loadMotions() {
    try {
      const response = await fetch('/__frames.json?v=3', {cache: 'no-store'});
      if (!response.ok) throw Error('动作帧目录不可读');
      const paths = await response.json();
      if (!Array.isArray(paths)) throw Error('动作帧列表无效');
      paths.sort((a, b) => a.localeCompare(b, 'zh-CN', {numeric: true}));
      for (const path of paths) {
        try {
          const img = new Image();
          img.src = path.split('/').map(encodeURIComponent).join('/');
          await img.decode();
          const frames = prepareMotionFrame(img);
          motion[motionType(path)].push(...frames);
          motionCount += frames.length;
          await new Promise(resolve => setTimeout(resolve, 0));
        } catch (e) { /* 损坏的单帧不影响其余动作。 */ }
      }
      // 未命名序列的最后两帧保留给终点；有明确“胜利/站立”命名时优先使用命名分组。
      if (motion.finish.length < 2 && motion.generic.length > 2) motion.finish.push(...motion.generic.splice(-(2 - motion.finish.length)));
      if (motionCount) notice('已载入 ' + motionCount + ' 帧角色动作。');
      else notice('动作帧文件夹没有可用图片，继续使用原角色图。');
    } catch (e) { notice('动作帧目录未载入，继续使用原角色图。请从 start-game.bat 启动。'); }
  }
  let state = 'entry', paused = false, time = 0, last = 0, visual = 0;
  let section = 0, shownSection = -1, aim = {x: 540, y: 140};
  let pressed = false, mousePressed = false, cooldown = 0, shake = 0, hurt = 0;
  let bolts = [], motes = [], defenders = [0, 0, 0, 0], lastAmbient = 0;
  let filmVisited = false, endingBgmResumed = false;
  const notice = message => { $('notice').textContent = message; clearTimeout(notice.timer); notice.timer = setTimeout(() => $('notice').textContent = '', 6000); };
  const hide = (id, yes) => $(id).classList.toggle('hidden', yes);
  const ready = img => img.complete && img.naturalWidth > 0;

  // 人物素材是有棋盘格底的 JPEG / PNG；按明亮中性灰去底，不改变原素材文件。
  actors.forEach(actor => actor.image.addEventListener('load', () => {
    try {
      const c = document.createElement('canvas');
      c.width = actor.image.naturalWidth; c.height = actor.image.naturalHeight;
      const g = c.getContext('2d', {willReadFrequently: true});
      g.drawImage(actor.image, 0, 0);
      const frame = g.getImageData(0, 0, c.width, c.height), p = frame.data;
      eraseExterior(c, frame);
      let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        const k = (y * c.width + x) * 4;
        if (p[k + 3] > 128) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      g.putImageData(frame, 0, 0);
      actor.cut = c; actor.box = [minX, minY, maxX - minX + 1, maxY - minY + 1];
    } catch (e) { actor.cut = null; }
  }));

  const audio = {
    context: null, master: null, muted: false, volume: .55,
    buffers: {}, loading: {}, source: null, media: null, mediaURL: null, noise: null,
    bgmSource: null, bgmOffset: 0, bgmStarted: 0, bgmRequest: 0,
    layers: {}, layerOffsets: {}, layerStarted: {}, layerRequests: {},
    async unlock() {
      if (!this.context) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.context = new AC(); this.master = this.context.createGain();
        this.master.gain.value = this.volume; this.master.connect(this.context.destination);
        this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        const a = this.noise.getChannelData(0);
        for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
      }
      try { await this.context.resume(); } catch (e) { notice('浏览器未能启动音频，画面仍可播放。'); }
      this.updateVolume();
    },
    updateVolume() {
      if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
      if (this.media) this.media.volume = this.muted ? 0 : this.volume * .45;
      $('muteBtn').textContent = this.muted ? '声音 关' : '声音 开';
      $('transitionVideo').volume = this.muted ? 0 : this.volume;
    },
    // AIFF PCM 8/16/24/32-bit 解析，兼容缺少内建 AIFF 解码器的浏览器。
    decodeAIFF(data) {
      const v = new DataView(data);
      const word = (at, n) => String.fromCharCode(...new Uint8Array(data, at, n));
      if (word(0, 4) !== 'FORM') throw Error('不是 AIFF');
      let channels = 0, frames = 0, bits = 0, rate = 0, start = 0;
      for (let at = 12; at + 8 < data.byteLength;) {
        const id = word(at, 4), size = v.getUint32(at + 4, false), q = at + 8;
        if (id === 'COMM') {
          channels = v.getUint16(q, false); frames = v.getUint32(q + 2, false);
          bits = v.getUint16(q + 6, false);
          const exponent = v.getUint16(q + 8, false) & 32767;
          const mantissa = v.getUint32(q + 10, false) * 4294967296 + v.getUint32(q + 14, false);
          rate = mantissa * Math.pow(2, exponent - 16383 - 63);
          if (word(8, 4) === 'AIFC' && word(q + 18, 4) !== 'NONE') throw Error('压缩 AIFF');
        }
        if (id === 'SSND') start = q + 8 + v.getUint32(q, false);
        at = q + size + size % 2;
      }
      if (!channels || !start || !rate || ![8, 16, 24, 32].includes(bits)) throw Error('AIFF 格式');
      const width = bits / 8;
      frames = Math.min(frames, Math.floor((data.byteLength - start) / (channels * width)));
      const output = this.context.createBuffer(channels, frames, rate);
      for (let ch = 0; ch < channels; ch++) {
        const dest = output.getChannelData(ch);
        for (let i = 0; i < frames; i++) {
          const q = start + (i * channels + ch) * width;
          if (bits === 8) dest[i] = v.getInt8(q) / 128;
          if (bits === 16) dest[i] = v.getInt16(q, false) / 32768;
          if (bits === 24) {
            let value = v.getUint8(q) * 65536 + v.getUint8(q + 1) * 256 + v.getUint8(q + 2);
            if (value > 8388607) value -= 16777216;
            dest[i] = value / 8388608;
          }
          if (bits === 32) dest[i] = v.getInt32(q, false) / 2147483648;
        }
      }
      return output;
    },
    async load(key) {
      if (this.buffers[key]) return this.buffers[key];
      if (this.loading[key]) return this.loading[key];
      this.loading[key] = (async () => {
        try {
          const response = await fetch(src[key]);
          if (!response.ok) throw Error('素材不存在');
          const data = await response.arrayBuffer();
          try { return this.decodeAIFF(data); }
          catch (e) { return await this.context.decodeAudioData(data); }
        } catch (e) { notice('音频未能载入：' + key + '；继续使用合成音效。'); return null; }
      })();
      this.buffers[key] = await this.loading[key];
      return this.buffers[key];
    },
    stop() {
      if (this.source) { try { this.source.stop(); } catch (e) {} this.source = null; }
      if (this.media) this.media.pause();
    },
    pauseLayers() {
      for (const key of ['rain', 'battle', 'charge']) {
        this.layerRequests[key] = (this.layerRequests[key] || 0) + 1;
        const source = this.layers[key], buffer = this.buffers[key];
        if (source) {
          if (buffer) this.layerOffsets[key] = ((this.layerOffsets[key] || 0) + this.context.currentTime - (this.layerStarted[key] || 0)) % buffer.duration;
          try { source.stop(); } catch (e) {}
          delete this.layers[key];
        }
      }
      if (this.media) this.media.pause();
    },
    async startLayer(key) {
      if (!this.context || this.layers[key]) return;
      const request = (this.layerRequests[key] || 0) + 1;
      this.layerRequests[key] = request;
      const buffer = await this.load(key);
      if (!buffer || request !== this.layerRequests[key] || paused || state === 'end' || section === 5) return;
      const source = this.context.createBufferSource(), gain = this.context.createGain();
      source.buffer = buffer; source.loop = true;
      gain.gain.value = key === 'rain' ? .15 : key === 'battle' ? .19 : .22;
      source.connect(gain); gain.connect(this.master);
      source.start(0, (this.layerOffsets[key] || 0) % buffer.duration);
      this.layerStarted[key] = this.context.currentTime; this.layers[key] = source;
      if (this.media && key === 'battle') this.media.play().catch(() => {});
    },
    pauseBGM() {
      this.bgmRequest++;
      if (!this.bgmSource) return;
      const buffer = this.buffers.bgm;
      if (buffer) this.bgmOffset = (this.bgmOffset + this.context.currentTime - this.bgmStarted) % buffer.duration;
      try { this.bgmSource.stop(); } catch (e) {}
      this.bgmSource = null;
    },
    async startBGM() {
      if (!this.context || this.bgmSource) return;
      const request = ++this.bgmRequest;
      const buffer = await this.load('bgm');
      if (!buffer || request !== this.bgmRequest || state === 'entry' || state === 'end' || paused) return;
      const source = this.context.createBufferSource(), gain = this.context.createGain();
      source.buffer = buffer; source.loop = true; gain.gain.value = .32;
      source.connect(gain); gain.connect(this.master);
      source.start(0, this.bgmOffset % buffer.duration);
      this.bgmStarted = this.context.currentTime; this.bgmSource = source;
    },
    async play(key, offset = 0) {
      this.stop(); if (!key || !this.context) return;
      if (this.media && key !== 'rain') { this.media.play().catch(() => {}); return; }
      const token = key + ':' + section + ':' + state;
      const buffer = await this.load(key);
      if (!buffer || token !== key + ':' + section + ':' + state || paused || state === 'film' || state === 'end') return;
      const source = this.context.createBufferSource(), gain = this.context.createGain();
      source.buffer = buffer; source.loop = true;
      gain.gain.value = key === 'rain' ? .16 : key === 'charge' ? .24 : .19;
      source.connect(gain); gain.connect(this.master);
      source.start(0, Math.max(0, offset) % buffer.duration);
      this.source = source;
    },
    burst(volume, duration, high = 2500) {
      if (!this.context || !this.noise) return;
      const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain();
      source.buffer = this.noise; filter.type = 'lowpass'; filter.frequency.value = high;
      gain.gain.setValueAtTime(volume, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + duration);
      source.connect(filter); filter.connect(gain); gain.connect(this.master);
      source.start(); source.stop(this.context.currentTime + duration);
    },
    horn() {
      if (!this.context) return;
      [392, 392, 523, 659, 523, 659, 784, 784].forEach((pitch, i) => {
        const osc = this.context.createOscillator(), gain = this.context.createGain();
        const at = this.context.currentTime + i * .42;
        osc.type = 'sawtooth'; osc.frequency.value = pitch;
        gain.gain.setValueAtTime(.001, at);
        gain.gain.exponentialRampToValueAtTime(.05, at + .03);
        gain.gain.exponentialRampToValueAtTime(.001, at + .38);
        osc.connect(gain); gain.connect(this.master); osc.start(at); osc.stop(at + .4);
      });
    }
  };

  function start() {
    window.__gameStarted = true;
    audio.unlock();
    audio.pauseLayers(); audio.pauseBGM(); audio.bgmOffset = 0; audio.layerOffsets = {};
    $('entryVideo').pause(); $('gameBackground').pause(); $('endingVideo').pause(); hide('entryVideo', true); hide('entryStill', true); hide('entryTitleArt', true); hide('entryShade', true); hide('entry', true);
    hide('ending', true); hide('film', true); hide('pause', true);
    hide('intro', false); hide('hud', true);
    time = 0; section = 0; shownSection = -1; state = 'intro'; paused = false;
    filmVisited = false; endingBgmResumed = false; pressed = false; mousePressed = false;
    hide('introVideo', false); $('introVideo').play().catch(() => {});
    audio.startBGM(); audio.startLayer('rain');
  }
  function showFilm() {
    if (filmVisited) return;
    filmVisited = true; state = 'film'; time = 55;
    $('introVideo').pause(); hide('introVideo', true); hide('intro', true); hide('hud', true); hide('film', false);
    const movie = $('transitionVideo'); movie.currentTime = 0;
    movie.volume = audio.muted ? 0 : audio.volume;
    movie.play().catch(() => { notice('入场动画无法播放，已进入桥头。'); enterBridge(); });
  }
  function enterBridge() {
    if (state !== 'film') return;
    $('transitionVideo').pause(); hide('film', true); hide('hud', false);
    state = 'game'; time = 55; section = 1; shownSection = -1;
    $('gameBackground').play().catch(() => notice('动态背景未能播放，已使用静态桥景。'));
    audio.startLayer('battle'); updateHud();
  }
  function finish() {
    state = 'end'; audio.pauseLayers(); $('gameBackground').pause();
    hide('hud', true); hide('intro', true); hide('ending', false);
    $('endingVideo').currentTime = 0; $('endingVideo').play().catch(() => notice('结尾视频未能播放，历史文字仍可阅读。'));
  }
  function pause(toggle) {
    if (state !== 'game') return;
    paused = toggle;
    hide('pause', !paused);
    $('pauseBtn').textContent = paused ? '继续' : '暂停';
    if (paused) { audio.pauseLayers(); audio.pauseBGM(); }
    else if (section < 5) {
      audio.startBGM(); audio.startLayer('rain');
      audio.startLayer('battle'); if (section >= 4) audio.startLayer('charge');
    } else if (time >= 573) audio.startBGM();
    if (paused) $('gameBackground').pause();
    else $('gameBackground').play().catch(() => {});
  }
  function skip() {
    if (state === 'intro') { showFilm(); return; }
    if (state === 'film') { enterBridge(); return; }
    if (state !== 'game') return;
    pause(false); time = stage[section].to;
    if (time >= 600) finish(); else changeSection();
  }
  function changeSection() {
    section = stage.findIndex(item => time < item.to);
    if (section < 0) { finish(); return; }
    if (section === shownSection) return;
    shownSection = section; bolts = []; defenders = [0, 0, 0, 0];
    if (section === 5) { audio.pauseLayers(); audio.pauseBGM(); endingBgmResumed = false; }
    else if (section === 4) { audio.startLayer('charge'); audio.horn(); }
    updateHud();
  }
  function progress() {
    if (time < 55) return 0;
    if (time >= 570) return 1;
    const part = stage[section], hold = section === 4 ? 3 : 5;
    const local = Math.max(0, time - part.from - hold) / (part.to - part.from - hold);
    const starts = [0, .02, .14, .57, .75], spans = [0, .12, .43, .18, .25];
    return starts[section] + spans[section] * Math.min(1, local);
  }
  function bridgeY(x) { return 245 - x * .207 + Math.sin(visual * 1.3 + x * .014) * 1.1; }
  function player() { const x = 75 + progress() * 477; return {x, y: bridgeY(x)}; }
  function fire() {
    if (state !== 'game' || paused || section === 5 || cooldown > 0) return;
    cooldown = section === 4 ? .18 : .31; shotPose = .26;
    const p = player();
    const target = Math.max(0, Math.min(3, Math.round((aim.x - 470) / 35)));
    const tx = 478 + target * 33, ty = 177;
    bolts.push({x: p.x + 14, y: p.y - 31, tx, ty, ttl: .13});
    defenders[target] = 11; audio.burst(.22, .16, 3200);
    for (let i = 0; i < 5; i++) motes.push({x: tx, y: ty, dx: (Math.random() - .5) * 35, dy: -Math.random() * 22, ttl: .35});
  }
  function updateHud() {
    if (state !== 'game') return;
    const chapter = stage[section];
    $('chapter').textContent = chapter.title;
    const caption = $('caption'); caption.textContent = chapter.text;
    const detail = document.createElement('small'); detail.textContent = chapter.note; caption.appendChild(detail);
    $('fill').style.width = (time / 600 * 100) + '%';
    const stamp = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(Math.floor(n % 60)).padStart(2, '0');
    $('time').textContent = stamp(time) + ' / 10:00';
    $('freezeLabel').style.opacity = time - chapter.from < (section === 4 ? 3 : 5) ? 1 : 0;
    $('tip').textContent = section === 5 ? '静默 · 铭记' : '点击 / 空格 · 掩护射击　　P · 暂停　　N · 下一段';
  }

  function artPiece(sx, sy, sw, sh, x, y, w, h, opacity) {
    if (!ready(art)) return;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = opacity;
    ctx.drawImage(art, sx, sy, sw, sh, x, y, w, h); ctx.restore();
  }
  function actor(x, y, index, opacity = 1) {
    const sprite = actors[index];
    const desired = section === 5 ? 'finish' : hurt > .01 ? 'hit' : shotPose > .01 ? 'shoot' : section === 4 ? 'run' : 'climb';
    const frames = section === 5 ? motion.finish : index === 0 ? [] : (motion[desired].length ? motion[desired] : desired === 'shoot' ? [] : motion.generic.length ? motion.generic : motion.climb);
    const speed = desired === 'finish' ? .7 : desired === 'run' ? 9 : desired === 'shoot' ? 10 : desired === 'climb' ? 5 : 3;
    const current = frames.length ? frames[Math.floor(visual * speed) % frames.length] : null;
    ctx.save(); ctx.translate(x, y + Math.sin(visual * (desired === 'run' ? 11 : 4)) * (desired === 'run' ? 2 : .6));
    ctx.rotate(-.19); ctx.globalAlpha = opacity;
    const tall = section === 5 ? 101 : index === 0 ? 59 : 88, wide = section === 5 ? 89 : index === 0 ? 50 : 80;
    if (current) {
      ctx.shadowColor = '#07110ce0'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
      ctx.drawImage(current.canvas, ...current.box, -wide * .43, -tall, wide, tall);
    } else if (sprite.cut && sprite.box) {
      ctx.filter = section === 5 ? 'brightness(1) saturate(.95)' : index === 0 ? 'brightness(.56) saturate(.65)' : 'brightness(.94) saturate(.88) contrast(1.12)';
      ctx.shadowColor = '#07110ce0'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
      ctx.drawImage(sprite.cut, ...sprite.box, -wide * .43, -tall, wide, tall);
    } else {
      ctx.fillStyle = '#536150'; ctx.fillRect(-10, -40, 22, 25);
      ctx.fillStyle = '#a99b7d'; ctx.fillRect(-4, -49, 12, 10);
      ctx.fillStyle = '#333d34'; ctx.fillRect(-13, -51, 27, 5);
      ctx.fillStyle = '#252922'; ctx.fillRect(6, -32, 31, 3);
      ctx.fillStyle = '#394639'; ctx.fillRect(-9, -15, 9, 16); ctx.fillRect(4, -15, 9, 16);
    }
    ctx.restore();
  }
  function draw() {
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (shake > 0) ctx.translate(Math.sin(visual * 60) * shake * 2, Math.cos(visual * 47) * shake);
    const moving = $('gameBackground');
    if (state === 'game' && moving.readyState >= 2 && moving.videoWidth > 0) {
      const scale = Math.max(W / moving.videoWidth, H / moving.videoHeight);
      const cropW = W / scale, cropH = H / scale;
      ctx.drawImage(moving, (moving.videoWidth - cropW) / 2, (moving.videoHeight - cropH) / 2, cropW, cropH, 0, 0, W, H);
    }
    else if (ready(bg)) ctx.drawImage(bg, -progress() * 16, 0, W + 16, H);
    else { ctx.fillStyle = '#202d2b'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#354139'; ctx.fillRect(0, 232, W, 128); }
    // 远景由主桥景承担；P12 的烟、水慢移，铁索与火光位于前层。
    artPiece(45, 310, 1958, 230, -12 + Math.sin(visual * .2) * 7, 14, 675, 131, .23);
    artPiece(45, 594, 1958, 220, -20 - progress() * 20 + Math.sin(visual * .8) * 10, 252, 705, 109, .34);
    if (section === 3 || section === 4) artPiece(1710, 47, 294, 220, 414, 119, 105, 82, .35 + Math.sin(visual * 6) * .08);
    if (state === 'game' && section < 5) {
      const p = player();
      for (let i = 3; i >= 1; i--) if (p.x - i * 42 > 20) actor(p.x - i * 42, bridgeY(p.x - i * 42), 0, 1);
      actor(p.x, p.y, section === 4 ? 1 : 2);
      for (let i = 0; i < 4; i++) if (defenders[i] <= 0) {
        ctx.fillStyle = '#141b18'; ctx.fillRect(478 + i * 33, 165, 7, 16);
        ctx.fillStyle = '#aaa17f'; ctx.fillRect(478 + i * 33, 162, 8, 3);
      }
    }
    if (state === 'game' && section === 5) actor(548, bridgeY(548), 0, 1);
    for (const b of bolts) { ctx.strokeStyle = '#e9cb8d'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.tx, b.ty); ctx.stroke(); }
    for (const m of motes) { ctx.fillStyle = '#e8ae67'; ctx.fillRect(m.x, m.y, 2, 2); }
    if (section === 3 && state === 'game') { ctx.fillStyle = '#b75f2412'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = '#02090824'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  function frame(stamp) {
    const dt = last ? Math.min(.08, (stamp - last) / 1000) : 0; last = stamp;
    if (state === 'intro') {
      time += dt; visual += dt;
      if (time >= 55) showFilm();
      if (Math.floor(time * 2) !== Math.floor((time - dt) * 2)) audio.burst(.02, .13, 250);
    } else if (state === 'game' && !paused) {
      time += dt; visual += dt; cooldown = Math.max(0, cooldown - dt); shotPose = Math.max(0, shotPose - dt);
      shake = Math.max(0, shake - dt * 2); hurt = Math.max(0, hurt - dt);
      if (time >= 600) finish();
      else {
        changeSection();
        if (section === 5 && time >= 573 && !endingBgmResumed) { endingBgmResumed = true; audio.startBGM(); }
        if (section === 3 && time - lastAmbient > 4) { lastAmbient = time; shake = .5; hurt = .12; audio.burst(.13, .3, 320); }
        if ((pressed || mousePressed) && cooldown <= 0 && hurt <= 0) fire();
        for (let i = 0; i < defenders.length; i++) defenders[i] = Math.max(0, defenders[i] - dt);
        bolts.forEach(b => b.ttl -= dt); bolts = bolts.filter(b => b.ttl > 0);
        motes.forEach(m => { m.x += m.dx * dt; m.y += m.dy * dt; m.dy += 30 * dt; m.ttl -= dt; });
        motes = motes.filter(m => m.ttl > 0);
        updateHud();
      }
    }
    draw(); requestAnimationFrame(frame);
  }

  $('start').addEventListener('click', start);
  $('replay').addEventListener('click', start);
  $('introSkip').addEventListener('click', showFilm);
  $('filmSkip').addEventListener('click', enterBridge);
  $('transitionVideo').addEventListener('ended', enterBridge);
  $('transitionVideo').addEventListener('error', () => { if (state === 'film') enterBridge(); });
  $('pauseBtn').addEventListener('click', () => pause(!paused));
  $('resume').addEventListener('click', () => pause(false));
  $('next').addEventListener('click', skip);
  $('muteBtn').addEventListener('click', () => { audio.muted = !audio.muted; audio.updateVolume(); });
  $('volume').addEventListener('input', e => { audio.volume = Number(e.target.value); audio.updateVolume(); });
  $('fullBtn').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else $('stage').requestFullscreen().catch(() => notice('浏览器未允许全屏。')); });
  $('pickAudio').addEventListener('click', () => $('audioFile').click());
  $('audioFile').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    if (audio.mediaURL) URL.revokeObjectURL(audio.mediaURL);
    audio.mediaURL = URL.createObjectURL(file); audio.media = new Audio(audio.mediaURL);
    audio.media.loop = true; audio.updateVolume(); notice('已选择 ' + file.name + '，继续后播放。');
  });
  $('stage').addEventListener('pointermove', e => {
    const box = canvas.getBoundingClientRect();
    aim.x = (e.clientX - box.left) / box.width * W;
    aim.y = (e.clientY - box.top) / box.height * H;
  });
  $('stage').addEventListener('pointerdown', e => {
    if (e.target.closest('button,input,a')) return;
    mousePressed = true; fire();
  });
  window.addEventListener('pointerup', () => mousePressed = false);
  window.addEventListener('keydown', e => {
    if (e.target.matches('button,input,a')) return;
    if (e.code === 'Space') { e.preventDefault(); pressed = true; fire(); }
    if (e.repeat) return;
    if (e.code === 'KeyP' && state === 'game') pause(!paused);
    if (e.code === 'KeyN') skip();
    if (e.code === 'KeyM') $('muteBtn').click();
  });
  window.addEventListener('keyup', e => { if (e.code === 'Space') pressed = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'game') pause(true); });
  $('entryVideo').play().catch(() => {});
  loadEntranceArt();
  loadMotions();
  window.__gameReady = true;
  requestAnimationFrame(frame);
})();
