/* Moony Journey — a dependency-free, original Canvas adventure. */
'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const SAVE_KEY = 'moony-journey-save-v3';
  const SOUND_KEY = 'moony-journey-sound';
  const MUSIC_KEY = 'moony-journey-music';
  const MUSIC_FILE = 'assets/audio/outer-space-loop.mp3';
  const AUDIO_SETTINGS_KEY = 'moony-journey-audio-settings-v1';
  const AUDIO_PRESETS = Object.freeze({quiet:{label:'Quiet',master:.45,music:.25,effects:.5,voice:.55},balanced:{label:'Balanced',master:.8,music:.4,effects:.65,voice:.75},cinematic:{label:'Cinematic',master:.85,music:.6,effects:.7,voice:.8}});
  const STATES = Object.freeze({MENU:'MAIN_MENU', STORY:'STORY', PLAY:'PLAYING', QUESTION:'QUESTION', PAUSE:'PAUSED', EFFECT:'EFFECT', COMPLETE:'ROUND_COMPLETE', OVER:'GAME_OVER', VICTORY:'VICTORY', REPAIR:'REPAIR', HELP:'HELP', ERROR:'ERROR', AUDIO:'AUDIO_SETTINGS', TRAVEL:'TRAVEL'});
  const ROUND_NAMES = ['The launch', 'Asteroid ambush', 'Spaceship emergency', 'Alien attack', 'The final mission'];
  const ROUND_PLACES = ['EARTH SPACE CENTER', 'THE ASTEROID BELT', 'ON BOARD THE STARLING', 'DEEP SPACE · DRONE PATROL', 'LUNAR ORBIT'];
  const SPRITES = {
    earth:'backgrounds/earth.svg', moon:'backgrounds/moon.svg', nova:'characters/nova.svg', pix:'characters/pix.svg', glitch:'characters/glitch.svg', control:'characters/control.svg',
    rocket:'spaceship/rocket.svg', ship:'spaceship/cruiser.svg', drone:'enemies/drone.svg', armored:'enemies/armored.svg', boss:'enemies/boss.svg', asteroid:'enemies/asteroid.svg', flame:'effects/flame.svg', heart:'ui/heart.svg'
  };
  const target = (id, label, x, y, hp, kind, extra = {}) => ({id,label,x,y,hp,kind,...extra});
  const TARGETS = [
    [target('fuel','Fuel cells',24,61,2,'fuel'),target('navigation','Flight computer',66,39,1,'navigation'),target('engine','Engine ignition',53,75,2,'engine'),target('radio','Radio uplink',79,65,1,'radio'),target('launch','Launch clearance',35,34,1,'launch')],
    [target('rock1','Scout rock',49,32,1,'asteroid'),target('rock2','Twin cluster',71,30,2,'cluster'),target('rock3','Iron giant',83,57,2,'large'),target('rock4','Shielded rock',57,67,1,'shielded'),target('rock5','Fast fragment',34,53,1,'asteroid'),target('rock6','Last boulder',72,77,1,'large')],
    [target('oxygen','Oxygen regulator',21,44,2,'repair'),target('power','Power relay',43,71,1,'repair'),target('guidance','Navigation console',65,40,1,'repair'),target('stabilizer','Engine stabilizer',82,70,2,'repair')],
    [target('scout1','Scout drone',47,35,1,'drone',{wave:1}),target('guard1','Patrol drone',70,48,2,'drone',{wave:1}),target('armor1','Armored drone',84,72,3,'armored',{wave:1}),target('scout2','Scout drone',48,73,1,'drone',{wave:2}),target('guard2','Patrol drone',69,34,2,'drone',{wave:2}),target('armor2','Armored drone',83,53,3,'armored',{wave:2})],
    [target('shield','Shield emitters',61,36,3,'boss',{stage:1}),target('weapons','Weapon array',80,63,3,'boss',{stage:2}),target('core','Portal energy core',65,54,3,'boss',{stage:3})]
  ];
  const LANDING = [target('thrusters','Landing thrusters',23,66,1,'thrusters'),target('stability','Altitude stabilizer',39,36,1,'stability'),target('alignment','Beacon alignment',76,36,2,'alignment'),target('gear','Landing gear',64,67,1,'gear'),target('descent','Final descent',81,76,2,'descent')];
  const INTRO = [
    [['control','Mission Control','Welcome to Earth Space Center. Tonight, the Moon’s navigation beacon has gone silent. Without its light, visiting ships could lose their way.'],['control','Mission Control','Our pilot is Captain Nova: a curious young astronaut who never leaves a friend behind. Nova, your ship is the Starling.'],['nova','Captain Nova','My first flight to the Moon! Brave face: ready. Emergency snack: packed. Who’s my copilot?'],['pix','PIX','PIX, at your service. I’m the Starling’s AI: navigator, repair guide, and proud owner of exactly three excellent jokes.'],['control','Mission Control','Fly to the Moon, discover what happened, and bring the beacon back online. We’ll stay on the radio and guide you through each leg.'],['nova','Captain Nova','Then nobody has to find their way home in the dark. Let’s bring back the moonlight.'],['pix','PIX','First, our launch checks. Tap a glowing system. Some need one answer; fuel and engines need two, one after the other.'] ],
    [['pix','PIX','That is definitely more rocks than the brochure promised. Something has pulled these asteroids into our route.'],['nova','Captain Nova','Then we make a safe path.'],['pix','PIX','Tap a rock to lock on. Your answers power our laser; blue energy shells need the shield. No speed test here. Take your time choosing a target.']],
    [['nova','Captain Nova','What was that purple flash? The cabin lights just turned into a disco.'],['pix','PIX','An energy pulse! Oxygen, power, navigation, and stabilizers are offline. I would prefer oxygen to disco.'],['pix','PIX','Tap a damaged system. Complete its one or two safety checks in order, then connect the three highlighted contacts. Repairs change the cabin around you.']],
    [['glitch','Commander Glitch','Attention, tiny Earth ship! Turn around. The Moon is temporarily closed for… extremely important alien business.'],['nova','Captain Nova','Is that business why our beacon stopped working?'],['glitch','Commander Glitch','My portal needs a LITTLE energy. Ignore the army of drones. They’re decorative!'],['pix','PIX','Hostile decorations incoming. Tap a drone to aim, then answer to fire. Armored drones take three hits. Clear both patrol waves.']],
    [['pix','PIX','There! Glitch has plugged the stolen beacon into his portal ship. That explains the rocks and the pulse.'],['glitch','Commander Glitch','Behold my grand invention: the Intergalactic Shortcut! Next stop, the universe’s best sandwich shop!'],['nova','Captain Nova','You’re putting every ship nearby in danger. We’re shutting it down.'],['pix','PIX','First disrupt his shield, then disable his weapons. After that, target the portal core. Three precise hits for each stage.']]
  ];
  const LANDING_STORY = [['glitch','Commander Glitch','Fine! I’m going home. Apparently portal science requires reading the instructions.'],['pix','PIX','He’s retreating! The beacon is free, but we must land to switch it back on.'],['nova','Captain Nova','Let’s bring the moonlight home.'],['pix','PIX','Activate the five landing systems. Thrusters slow us, stabilizers steady us, and guidance lines up the beacon. Your hearts carry over from the boss fight.']];
  const ENDING = [['nova','Captain Nova','One small step for me. One very large repair bill for Commander Glitch.'],['pix','PIX','Beacon restored! Earth-to-Moon navigation is online. Look at that beautiful blue planet.'],['control','Mission Control','We see the light, Nova. Every ship has a safe route again. Welcome to the Moon!'],['glitch','Commander Glitch','For the record, I could have landed that well. Also… does Earth deliver sandwiches?']];

  // Quiet, playable flight legs connect the existing challenges. No quiz or reflex timer.
  const FLIGHT_LEGS = [
    {title:'Leaving home',place:'EARTH DEPARTURE',brief:[['nova','Captain Nova','We’re really up here. Earth looks so small… and there’s our whole home.'],['pix','PIX','Take a look, Captain. Before we chase the Moon, let’s tell Earth we made it.']],
      radio:[['control','Mission Control','Starling, we have you on radar. You’re clear of the atmosphere. Set a course through the blue navigation markers.'],['nova','Captain Nova','Copy, Earth. We’ll follow your route and check the path ahead.']],
      course:[['nova','Captain Nova','Course set. First turn in space: smooth as moon pudding.'],['pix','PIX','An imaginary dessert, but an accurate description. Now use the scanner to check our route.']],
      scan:[['pix','PIX','That’s odd. A whole cluster of asteroids has drifted into the flight lane. Something is pulling them together.'],['control','Mission Control','Stay calm, Nova. Bring the defense laser online and clear a safe path. We’re right here.']]},
    {title:'A ripple in the dark',place:'CLEAR OF THE ASTEROIDS',brief:[['nova','Captain Nova','Last rock behind us. I could use one very quiet minute.'],['pix','PIX','Quiet minute requested. A strange energy ripple would like to interrupt. Let’s ask Earth what they see.']],
      radio:[['control','Mission Control','We see that ripple too. Move away from the main lane before it reaches you. Then scan its source.'],['nova','Captain Nova','Changing course. PIX, save that signal. This isn’t an ordinary asteroid field.']],
      course:[['pix','PIX','We’ve moved the Starling off the busy route. No other ships nearby.'],['nova','Captain Nova','Good. Let’s find out what’s making that purple glow.']],
      scan:[['pix','PIX','The signal is coming from the Moon. Wait—the pulse is changing direction!'],['control','Mission Control','Brace, Nova! If your systems go offline, switch to the engineering deck. We’ll help you bring them back.']]},
    {title:'A breath of fresh air',place:'STARLING · SYSTEMS RESTORED',brief:[['nova','Captain Nova','Lights on. Air flowing. That’s a much better sound.'],['pix','PIX','You repaired us, Captain. Take a breath, then let Earth know we’re flying again.']],
      radio:[['control','Mission Control','Beautiful work, Nova. Your ship’s readings are healthy again. Follow the signal, but keep your distance until you identify it.'],['nova','Captain Nova','Understood. We’re investigators first. No charging into mysterious purple things.']],
      course:[['pix','PIX','Following the signal. It has a repeating pattern—almost like someone giving orders.'],['nova','Captain Nova','Then maybe we can find out who’s talking. Let’s listen with the scanner.']],
      scan:[['pix','PIX','Alien drones, just ahead. And their commander is using our beacon to power something enormous.'],['control','Mission Control','Protect the Starling. Target the drones one at a time and keep your escape lane clear.']]},
    {title:'Across the quiet sea',place:'LUNAR TRANSFER',brief:[['nova','Captain Nova','The drones are gone. Look, PIX—the Moon is getting bigger.'],['pix','PIX','And Earth is getting farther away. A good time to hear a familiar voice.']],
      radio:[['control','Mission Control','We’re still with you, Captain. The drone message confirms it: Commander Glitch has connected our beacon to a portal machine.'],['nova','Captain Nova','So that’s why space has been acting strange. We’ll shut it down safely.']],
      course:[['nova','Captain Nova','Lunar approach set. I can see craters from here.'],['pix','PIX','I’ve saved a picture. First, let’s scan the portal ship for a safe way to disconnect it.']],
      scan:[['pix','PIX','Shield emitters, weapon pods, and a central energy core. Disabling them in that order will close the portal without hurting anyone.'],['control','Mission Control','A careful plan. Bring our beacon home, Nova.']]},
    {title:'Permission to land',place:'LUNAR ORBIT · PORTAL CLOSED',brief:[['nova','Captain Nova','The portal is closed. Glitch is retreating, and the Moon is quiet again.'],['pix','PIX','One job left: land beside the beacon and turn its light back on. Let’s request a landing route.']],
      radio:[['control','Mission Control','Starling, you are cleared for Tranquility Base. Follow the approach markers, then scan the landing area.'],['nova','Captain Nova','Permission to land received. I’ve been waiting my whole life to say that.']],
      course:[['pix','PIX','Approach aligned. Nice flying, Captain.'],['nova','Captain Nova','Next stop: actual Moon footprints. Let’s make sure the landing zone is clear.']],
      scan:[['pix','PIX','Landing zone clear. Beacon located. We’ll use the thrusters, stabilizers, guidance, landing gear, and final descent controls.'],['control','Mission Control','Take it one system at a time. We’ll see your light from Earth.']]}
  ];

  class AudioManager {
    constructor() {
      this.enabled=true;this.context=null;this.master=null;this.effectsGain=null;this.speechGain=null;this.musicPreviewGain=null;this.effects=new Set();this.speech=new Set();this.musicPreviewNodes=new Set();this.ambient=null;this.ambienceScene=null;this.lastSpeechAt=-Infinity;this.lastError='';
      this.effectsEnabled=true;this.voiceEnabled=true;this.masterVolume=.8;this.musicVolume=.4;this.effectsVolume=.65;this.voiceVolume=.75;
      this.musicEnabled=true;this.musicGain=null;this.musicNodes=new Set();this.musicRunning=false;this.musicActive=false;this.musicDucked=false;
      this.musicBuffer=null;this.musicLoad=null;this.musicError='';this.musicDuration=0;this.musicOffset=0;this.musicStartedAt=0;this.musicSource=null;this.musicPreviewToken=0;
      try { this.enabled=localStorage.getItem(SOUND_KEY)!=='off'; } catch {}
      try { this.musicEnabled=localStorage.getItem(MUSIC_KEY)!=='off'; } catch {}
      try {
        const settings=JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY));
        if(settings&&typeof settings==='object'&&!Array.isArray(settings)){
          for(const channel of ['master','music','effects','voice'])if(Number.isFinite(settings[`${channel}Volume`]))this[`${channel}Volume`]=Math.min(1,Math.max(0,settings[`${channel}Volume`]));
          if(typeof settings.effectsEnabled==='boolean')this.effectsEnabled=settings.effectsEnabled;
          if(typeof settings.voiceEnabled==='boolean')this.voiceEnabled=settings.voiceEnabled;
        }
      } catch {}
    }
    unlock() {
      try {
        if(!this.context){
          const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){this.lastError='Audio is not supported in this browser.';return false;}
          this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);
          this.musicGain=this.context.createGain();this.musicGain.gain.value=0;this.musicGain.connect(this.master);
          this.effectsGain=this.context.createGain();this.effectsGain.gain.value=0;this.effectsGain.connect(this.master);
          this.speechGain=this.context.createGain();this.speechGain.gain.value=0;this.speechGain.connect(this.master);
          this.musicPreviewGain=this.context.createGain();this.musicPreviewGain.gain.value=0;this.musicPreviewGain.connect(this.master);
          this.applyGains();
        }
        if(this.context.state==='suspended')this.context.resume().then(()=>{this.lastError='';}).catch(error=>{this.lastError=error.message||'Audio could not start. Try a sound preview.';});
        if(this.context.state==='running')this.lastError='';
        this.loadMusic();
        return this.context.state!=='closed';
      } catch(error) {this.lastError=error.message||'Audio could not start.';return false;}
    }
    tone(frequency, duration, type = 'sine', delay = 0, end = frequency, volume = .06, channel = 'effects') {
      if (!['effects','speech'].includes(channel) || !this.enabled || this.masterVolume===0 || !this.context || !this.master || (channel==='speech'&&(!this.voiceEnabled||this.voiceVolume===0)) || (channel==='effects'&&(!this.effectsEnabled||this.effectsVolume===0))) return;
      const ctx = this.context, now = ctx.currentTime + delay, oscillator = ctx.createOscillator(), gain = ctx.createGain();
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(15,end), now + duration);
      gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(volume,now+.012); gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      const nodes=channel==='speech'?this.speech:this.effects;nodes.add(oscillator);
      oscillator.onended=()=>{nodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.connect(gain);gain.connect(channel==='speech'?this.speechGain:this.effectsGain);oscillator.start(now);oscillator.stop(now+duration+.02);
    }
    play(name) {
      const notes = {
        click:[[540,.055,'sine',0,740,.05]], correct:[[523,.12,'sine'],[659,.12,'sine',.08],[784,.2,'sine',.16]],
        wrong:[[220,.18,'triangle',0,147,.055],[165,.15,'sine',.12,131,.04]], warning:[[440,.1,'triangle',0,440,.045],[349,.14,'triangle',.18,349,.04]],
        laser:[[1350,.22,'triangle',0,150,.075],[580,.11,'sine',.025,100,.045]], explosion:[[110,.36,'triangle',0,28,.09],[65,.4,'sine',.04,22,.07]],
        shield:[[220,.4,'sine',0,880,.06],[440,.35,'triangle',.06,1100,.025]],
        repair:[[440,.08,'triangle',0,440,.045],[660,.1,'triangle',.12,660,.04],[880,.18,'sine',.24,880,.055]],
        launch:[[55,1.25,'triangle',0,170,.085],[82,1.1,'sine',.1,230,.055],[150,.7,'triangle',.4,340,.025]],
        alien:[[400,.2,'triangle',0,150,.06],[520,.16,'sine',.13,220,.035]],
        defeat:[[220,.6,'triangle',0,70,.055],[659,.3,'sine',.4],[880,.45,'sine',.65]],
        landing:[[240,.8,'triangle',0,65,.07],[95,.35,'sine',.45,45,.07],[523,.3,'sine',.75]],
        transmission:[[760,.055,'sine',0,920,.027],[1020,.07,'sine',.08,760,.023]],
        victory:[[523,.2,'sine'],[659,.2,'sine',.18],[784,.2,'sine',.36],[1047,.6,'sine',.55],[523,.7,'triangle',.55,523,.025]]
      };
      (notes[name] || notes.click).forEach(args => this.tone(...args));
    }
    speak(who,glyph,index=0) {
      if(!this.enabled||this.masterVolume===0||!this.voiceEnabled||this.voiceVolume===0||!this.context||typeof glyph!=='string'||!/[a-z0-9]/i.test(glyph)||this.context.currentTime-this.lastSpeechAt<.065)return;
      const voices={nova:[330,'triangle',.04],pix:[880,'sine',.035],glitch:[185,'triangle',.045],control:[440,'triangle',.032]};
      const [base,wave,volume]=voices[who]||voices.control;
      const frequency=base*Math.pow(2,((glyph.charCodeAt(0)+index)%7-3)/12);
      this.lastSpeechAt=this.context.currentTime;
      this.tone(frequency,.055+(index%3)*.008,wave,0,frequency*(who==='glitch' ? .8 : 1.06),volume,'speech');
    }
    stopSpeech() {
      this.stopNodes(this.speech);this.lastSpeechAt=-Infinity;
    }
    stopNodes(nodes) {
      if(nodes===this.musicPreviewNodes)this.musicPreviewToken++;
      for(const node of nodes){try{node.stop();}catch{}}
      nodes.clear();
    }
    setAmbience(scene) {
      this.ambienceScene=scene;
      const desired=this.enabled&&this.masterVolume>0&&this.effectsEnabled&&this.effectsVolume>0&&this.context&&scene?scene:null;
      if(this.ambient?.scene===desired)return;
      if(this.ambient){for(const node of this.ambient.nodes){try{node.stop();}catch{}node.disconnect();}this.ambient.gain.disconnect();this.ambient=null;}
      if(!desired)return;
      const ctx=this.context,gain=ctx.createGain(),profiles={launch:[52,78],asteroids:[65,98],cabin:[58,87],combat:[73,110],lunar:[48,72]};
      const frequencies=profiles[desired]||profiles.asteroids,nodes=[];
      gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(.009,ctx.currentTime+.5);gain.connect(this.effectsGain);
      for(const frequency of frequencies){const node=ctx.createOscillator();node.type='sine';node.frequency.value=frequency;node.connect(gain);node.start();nodes.push(node);}
      this.ambient={scene:desired,nodes,gain};
    }
    loadMusic(retry=false) {
      if(!this.context)return Promise.resolve(null);
      if(this.musicBuffer)return Promise.resolve(this.musicBuffer);
      if(this.musicLoad&&!(retry&&this.musicError))return this.musicLoad;
      const ctx=this.context;this.musicError='';
      this.musicLoad=(async()=>{
        const response=await fetch(MUSIC_FILE,{cache:'force-cache'});
        if(!response.ok)throw new Error(`Background music could not load (HTTP ${response.status}).`);
        const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
        if(!Number.isFinite(buffer.duration)||buffer.duration<=0)throw new Error('The background music file could not be decoded.');
        if(this.context!==ctx||ctx.state==='closed')return null;
        this.musicBuffer=buffer;this.musicDuration=buffer.duration;this.musicOffset%=buffer.duration;this.musicError='';
        this.updateMusic(this.musicActive,this.musicDucked);
        return buffer;
      })().catch(error=>{if(this.context===ctx)this.musicError=error.message||'The background music file is unavailable.';return null;});
      return this.musicLoad;
    }
    updateMusic(active,ducked=false) {
      const wasDucked=this.musicDucked;this.musicActive=!!active;this.musicDucked=!!ducked;
      if(!active||!this.enabled||this.masterVolume===0||!this.musicEnabled||this.musicVolume===0||!this.context||this.context.state!=='running') {this.stopMusic(true);return;}
      if(!this.musicBuffer){this.loadMusic();return;}
      const ctx=this.context,now=ctx.currentTime,level=this.musicLevel(ducked);
      if(!this.musicRunning){
        const source=ctx.createBufferSource();source.buffer=this.musicBuffer;source.loop=true;source.connect(this.musicGain);
        this.musicSource=source;this.musicNodes.add(source);this.musicStartedAt=now;this.musicRunning=true;
        source.onended=()=>{this.musicNodes.delete(source);source.disconnect();if(this.musicSource===source){this.musicOffset=(this.musicOffset+ctx.currentTime-this.musicStartedAt)%this.musicDuration;this.musicSource=null;this.musicRunning=false;}};
        this.musicGain.gain.cancelScheduledValues(now);this.musicGain.gain.setValueAtTime(0,now);this.setGain(this.musicGain,level);
        source.start(now,this.musicOffset);
      }else if(wasDucked!==!!ducked)this.setGain(this.musicGain,level);
    }
    stopMusic(keepActive=false) {
      if(!keepActive)this.musicActive=false;
      if(!this.musicRunning&&!this.musicNodes.size)return;
      if(this.musicRunning&&this.musicDuration)this.musicOffset=(this.musicOffset+Math.max(0,this.context.currentTime-this.musicStartedAt))%this.musicDuration;
      this.musicRunning=false;this.musicSource=null;this.musicStartedAt=0;
      if(this.musicGain){this.musicGain.gain.cancelScheduledValues(this.context.currentTime);this.musicGain.gain.setValueAtTime(0,this.context.currentTime);}
      this.stopNodes(this.musicNodes);
    }
    toggleMusic() {
      this.musicEnabled=!this.musicEnabled;
      try {localStorage.setItem(MUSIC_KEY,this.musicEnabled?'on':'off');} catch {}
      this.unlock();
      this.applyGains();
      if(!this.musicEnabled){this.stopMusic(true);this.stopNodes(this.musicPreviewNodes);}else this.updateMusic(this.musicActive,this.musicDucked);
      return this.musicEnabled;
    }
    toggle() {
      this.enabled=!this.enabled;
      try {localStorage.setItem(SOUND_KEY,this.enabled?'on':'off');} catch {}
      this.unlock();
      this.applyGains();
      if(!this.enabled){this.stopSpeech();this.stopNodes(this.effects);this.stopMusic(true);this.stopNodes(this.musicPreviewNodes);}
      this.setAmbience(this.ambienceScene);
      if(this.enabled){this.updateMusic(this.musicActive,this.musicDucked);this.play('click');}
      return this.enabled;
    }
    persistSettings() {
      try {localStorage.setItem(AUDIO_SETTINGS_KEY,JSON.stringify({masterVolume:this.masterVolume,musicVolume:this.musicVolume,effectsVolume:this.effectsVolume,voiceVolume:this.voiceVolume,effectsEnabled:this.effectsEnabled,voiceEnabled:this.voiceEnabled}));} catch {}
    }
    volume(channel) {return ['master','music','effects','voice'].includes(channel)?this[`${channel}Volume`]:0;}
    volumeGain(value) {return Math.pow(Math.min(1,Math.max(0,value)),1.6);}
    musicLevel(ducked=this.musicDucked) {return (ducked ? .20 : .55)*this.volumeGain(this.musicVolume);}
    setGain(node,level) {
      if(!node||!this.context)return;
      const gain=node.gain,now=this.context.currentTime,target=Math.min(1,Math.max(0,level));
      // Hold the current value before a short ramp; zero and mute are immediate.
      if(target===0){gain.cancelScheduledValues(now);gain.setValueAtTime(0,now);return;}
      if(typeof gain.cancelAndHoldAtTime==='function')gain.cancelAndHoldAtTime(now);
      else{const current=gain.value;gain.cancelScheduledValues(now);gain.setValueAtTime(current,now);}
      gain.linearRampToValueAtTime(target,now+.035);
    }
    applyGains() {
      if(!this.context)return;
      this.setGain(this.master,this.enabled ? .85*this.volumeGain(this.masterVolume) : 0);
      this.setGain(this.effectsGain,this.effectsEnabled ? this.volumeGain(this.effectsVolume) : 0);
      this.setGain(this.speechGain,this.voiceEnabled ? this.volumeGain(this.voiceVolume) : 0);
      this.setGain(this.musicPreviewGain,this.musicEnabled ? .55*this.volumeGain(this.musicVolume) : 0);
      if(this.musicRunning)this.setGain(this.musicGain,this.musicEnabled ? this.musicLevel() : 0);
    }
    setVolume(channel,value) {
      if(!['master','music','effects','voice'].includes(channel)||!Number.isFinite(value))return false;
      this[`${channel}Volume`]=Math.min(1,Math.max(0,value));this.persistSettings();this.applyGains();
      if(channel==='master'){
        if(this.masterVolume===0){this.stopSpeech();this.stopNodes(this.effects);this.stopMusic(true);this.stopNodes(this.musicPreviewNodes);}
        this.setAmbience(this.ambienceScene);this.updateMusic(this.musicActive,this.musicDucked);
      }
      if(channel==='music'){if(this.musicVolume===0){this.stopMusic(true);this.stopNodes(this.musicPreviewNodes);}else this.updateMusic(this.musicActive,this.musicDucked);}
      if(channel==='effects'){if(this.effectsVolume===0)this.stopNodes(this.effects);this.setAmbience(this.ambienceScene);}
      if(channel==='voice'&&this.voiceVolume===0)this.stopSpeech();
      return this[`${channel}Volume`];
    }
    toggleEffects() {
      this.effectsEnabled=!this.effectsEnabled;this.persistSettings();this.unlock();this.applyGains();
      if(!this.effectsEnabled)this.stopNodes(this.effects);
      this.setAmbience(this.ambienceScene);if(this.effectsEnabled)this.play('click');
      return this.effectsEnabled;
    }
    toggleVoice() {
      this.voiceEnabled=!this.voiceEnabled;this.persistSettings();this.unlock();this.applyGains();
      if(!this.voiceEnabled)this.stopSpeech();
      return this.voiceEnabled;
    }
    preview(channel) {
      if(!['music','effects','voice'].includes(channel)||!this.unlock()||!this.enabled||this.masterVolume===0||this.volume(channel)===0)return false;
      if(channel==='music'){
        if(!this.musicEnabled)return false;
        this.stopNodes(this.musicPreviewNodes);const token=this.musicPreviewToken;
        const begin=buffer=>{
          if(!buffer||token!==this.musicPreviewToken||!this.enabled||this.masterVolume===0||!this.musicEnabled||this.musicVolume===0||!this.context||this.context.state==='closed')return;
          const ctx=this.context,source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.musicPreviewGain);
          this.musicPreviewNodes.add(source);source.onended=()=>{this.musicPreviewNodes.delete(source);source.disconnect();};
          source.start(ctx.currentTime,this.musicOffset%buffer.duration);source.stop(ctx.currentTime+4);
        };
        if(this.musicBuffer)begin(this.musicBuffer);else this.loadMusic(true).then(begin);
      }else if(channel==='effects'){
        if(!this.effectsEnabled)return false;this.play('repair');
      }else{
        if(!this.voiceEnabled)return false;this.stopSpeech();
        [880,1047,932].forEach((frequency,index)=>this.tone(frequency,.065,'sine',index*.12,frequency*1.06,.04,'speech'));
      }
      return true;
    }
    resetSettings() {
      this.enabled=true;this.musicEnabled=true;this.effectsEnabled=true;this.voiceEnabled=true;
      this.masterVolume=.8;this.musicVolume=.4;this.effectsVolume=.65;this.voiceVolume=.75;
      try {localStorage.setItem(SOUND_KEY,'on');localStorage.setItem(MUSIC_KEY,'on');} catch {}
      this.persistSettings();this.unlock();this.applyGains();this.setAmbience(this.ambienceScene);this.updateMusic(this.musicActive,this.musicDucked);
    }
    status() {return {supported:!!(window.AudioContext||window.webkitAudioContext),unlocked:!!this.context&&this.context.state!=='closed',running:this.context?.state==='running',muted:!this.enabled||this.masterVolume===0,error:this.lastError,musicReady:!!this.musicBuffer,musicLoading:!!this.musicLoad&&!this.musicBuffer&&!this.musicError,musicError:this.musicError,musicDuration:this.musicDuration};}
  }

  class QuestionBank {
    constructor() { this.items=[]; }
    async load() {
      const response = await fetch('questions.json',{cache:'no-cache'});
      if (!response.ok) throw new Error(`questions.json returned HTTP ${response.status}.`);
      const data = await response.json(), ids = new Set();
      if (!data || !Array.isArray(data.questions) || !data.questions.length) throw new Error('questions.json must contain a non-empty questions array.');
      for (const q of data.questions) {
        const id = String(q?.id);
        if (!q || !['number','string'].includes(typeof q.id) || !id.trim() || (typeof q.id === 'number' && !Number.isFinite(q.id)) || ids.has(id) || typeof q.question !== 'string' || !q.question.trim() || !Array.isArray(q.answers) || q.answers.length!==4 || q.answers.some(a=>typeof a!=='string'||!a.trim()) || new Set(q.answers.map(a=>a.trim().toLowerCase())).size!==4 || !Number.isInteger(q.correctAnswer) || q.correctAnswer<0 || q.correctAnswer>3) throw new Error(`Invalid or duplicate question ${id}. Each question needs a unique ID, text, four distinct answers, and a correctAnswer index from 0 to 3.`);
        ids.add(id);
      }
      this.items=data.questions;
    }
    pick(used) { const seen=new Set(used), available=this.items.filter(q=>!seen.has(String(q.id))); return available.length ? available[Math.floor(Math.random()*available.length)] : null; }
  }

  class SaveManager {
    constructor() { this.warning=''; this.available=true; }
    write(data) { if (!data) return; try { localStorage.setItem(SAVE_KEY,JSON.stringify(data));this.available=true;this.warning=''; } catch { this.available=false; this.warning='Browser storage is unavailable. Keep this tab open to finish your mission.'; } }
    read() {
      try {
        const raw=localStorage.getItem(SAVE_KEY); if (!raw) return null;
        const d=JSON.parse(raw);
        if (d.version!==3 || !Number.isInteger(d.round) || d.round<0 || d.round>4 || !['main','landing'].includes(d.phase) || (d.phase==='landing'&&d.round!==4) || !Number.isInteger(d.hearts)||d.hearts<0||d.hearts>3 || !Array.isArray(d.used)||d.used.some(id=>typeof id!=='string')||new Set(d.used).size!==d.used.length || !['intro','play','complete','failed','victory','ending','travel'].includes(d.checkpoint) || typeof d.progress!=='object'||!d.progress||Array.isArray(d.progress) || !['correct','mistakes','elapsed'].every(k=>Number.isFinite(d[k])&&d[k]>=0) || !Number.isInteger(d.correct)||!Number.isInteger(d.mistakes) || d.correct+d.mistakes>d.used.length || (['victory','ending'].includes(d.checkpoint)&&(d.round!==4||d.phase!=='landing'))) throw new Error('Invalid save');
        if (d.objectiveVersion!==undefined&&d.objectiveVersion!==2) throw new Error('Unknown objective version');
        const legacyObjectives=d.objectiveVersion===undefined;
        const defs=d.phase==='landing'?LANDING:TARGETS[d.round];
        const validIds=new Set(defs.map(t=>t.id));
        if (Object.keys(d.progress).some(k=>!validIds.has(k))) throw new Error('Unknown objective');
        for (const t of defs) {
          const p=d.progress[t.id];
          // Earlier saves used two checks for these now shorter tasks.
          const shortened=legacyObjectives&&d.phase==='main'&&((d.round===0&&['navigation','radio','launch'].includes(t.id))||(d.round===2&&['power','guidance'].includes(t.id)));
          if (shortened&&p?.hits===2) p.hits=1;
          if (p && (!Number.isInteger(p.hits)||p.hits<0||p.hits>t.hp||typeof p.fixed!=='boolean'||(p.fixed&&p.hits<t.hp))) throw new Error('Invalid objective');
        }
        if (d.hearts===0) d.checkpoint='failed';
        if (d.checkpoint==='failed' && d.hearts!==0) throw new Error('Invalid health');
        const allDone=defs.every(t=>{const p=d.progress[t.id];return p&&p.hits===t.hp&&(t.kind!=='repair'||p.fixed);});
        if (['complete','ending','victory','travel'].includes(d.checkpoint)&&!allDone) throw new Error('Incomplete objectives');
        if(d.checkpoint==='travel'&&(!d.travel||d.phase!=='main'||d.travel.leg!==d.round||!Number.isInteger(d.travel.step)||d.travel.step<0||d.travel.step>3))throw new Error('Invalid flight checkpoint');
        if(d.interludes!==undefined&&(!Array.isArray(d.interludes)||d.interludes.some(id=>typeof id!=='string')||new Set(d.interludes).size!==d.interludes.length))throw new Error('Invalid story progress');
        d.interludes=d.interludes||[];
        if (d.checkpoint==='play'&&allDone) d.checkpoint='complete';
        d.objectiveVersion=2;
        if(this.available)this.warning='';return d;
      } catch { this.warning='An old or damaged save was found. Start a new journey to safely recover.'; return null; }
    }
  }

  class Renderer {
    constructor(game) {
      this.game=game; this.canvas=$('scene'); this.ctx=this.canvas.getContext('2d'); this.images={}; this.time=0; this.particles=[];
      this.stars=Array.from({length:125},(_,i)=>({x:(i*173.37)%960,y:(i*97.31)%540,size:i%12===0?3:i%3===0?2:1,depth:.2+(i%6)*.17}));
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.resize(); new ResizeObserver(()=>this.resize()).observe($('game-shell'));
    }
    async load() { await Promise.all(Object.entries(SPRITES).map(([key,path])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{this.images[key]=im;resolve();};im.onerror=()=>reject(new Error(`Missing artwork: assets/${path}`));im.src=`assets/${path}`;}))); }
    resize() {
      const rect=$('game-shell').getBoundingClientRect(), scale=Math.min(rect.width/960,rect.height/540), w=Math.max(1,Math.round(960*scale)),h=Math.max(1,Math.round(540*scale));
      const dpr=Math.min(window.devicePixelRatio||1,2); this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
      this.canvas.style.width=`${w}px`;this.canvas.style.height=`${h}px`;this.canvas.style.left=`${(rect.width-w)/2}px`;this.canvas.style.top=`${(rect.height-h)/2}px`;
      const layer=$('scene-targets'); Object.assign(layer.style,{left:`${(rect.width-w)/2}px`,top:`${(rect.height-h)/2}px`,width:`${w}px`,height:`${h}px`,right:'auto',bottom:'auto'});
      this.ctx.imageSmoothingEnabled=false;
    }
    sprite(name,x,y,w,h,alpha=1) { const im=this.images[name];if (!im)return;this.ctx.globalAlpha=alpha;this.ctx.drawImage(im,Math.round(x),Math.round(y),w,h);this.ctx.globalAlpha=1; }
    rect(x,y,w,h,color) { this.ctx.fillStyle=color;this.ctx.fillRect(Math.round(x),Math.round(y),w,h); }
    text(message,x,y,size=12,color='#a9c2de',align='left') { const c=this.ctx;c.font=`600 ${size}px monospace`;c.fillStyle=color;c.textAlign=align;c.fillText(message,x,y);c.textAlign='left'; }
    burst(x,y,color='#ffb65b',count=32) { if(this.reduced)count=8;for(let i=0;i<count;i++){const a=i*2.399,s=35+(i%7)*22;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.5+(i%4)*.2,max:1.1,color,size:2+i%4});} }
    draw(dt,animate=true) {
      const c=this.ctx,g=this.game,d=g.data; if(animate)this.time+=this.reduced?dt*.2:dt;
      const t=this.time;c.setTransform(this.canvas.width/960,0,0,this.canvas.height/540,0,0);c.imageSmoothingEnabled=false;
      const gradient=c.createLinearGradient(0,0,960,540);gradient.addColorStop(0,'#080f26');gradient.addColorStop(.55,'#171536');gradient.addColorStop(1,'#0a1730');c.fillStyle=gradient;c.fillRect(0,0,960,540);
      const menu=g.state===STATES.MENU||!d;const r=menu?-1:d.round;
      for(let i=0;i<5;i++){c.fillStyle=`rgba(${i%2?'61,43,120':'27,75,113'},.055)`;c.fillRect(370+i*80,80+i*27,180,210);}
      for(const s of this.stars){let x=(s.x-t*(menu?1:6)*s.depth+1920)%960;this.rect(x,s.y,s.size,s.size,s.size===3?'#bce8ff':'#7589b2');if(s.size===3){this.rect(x-3,s.y+1,9,1,'#46577a');this.rect(x+1,s.y-3,1,9,'#46577a');}}
      if(menu) this.menu(t);
      else if(g.travel)this.flight(t);
      else if(g.state===STATES.VICTORY||d.checkpoint==='ending'||d.checkpoint==='victory')this.lunar(t,true);
      else if(r===0)this.launch(t);
      else if(r===1)this.asteroids(t);
      else if(r===2)this.interior(t);
      else if(r===3)this.combat(t);
      else if(d.phase==='landing')this.lunar(t,false);
      else this.boss(t);
      if(g.effect)this.drawEffect(g.effect);
      for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];if(animate){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;p.life-=dt;}if(p.life<=0){this.particles.splice(i,1);continue;}c.globalAlpha=clamp(p.life/.5,0,1);this.rect(p.x,p.y,p.size,p.size,p.color);c.globalAlpha=1;}
      if(menu){c.fillStyle='rgba(5,10,25,.18)';c.fillRect(0,0,960,540);}
    }
    menu(t) {
      this.sprite('moon',720,55,157,157,.85);this.sprite('earth',530,300,340,340);this.rect(540,470,300,70,'#0d1c38');
      const y=230+Math.sin(t)*8;this.sprite('ship',588,y,240,120);this.tailFlame(573,y+59,54,31);this.sprite('pix',842,285+Math.sin(t+2)*5,39,39);
      this.text('EARTH',747,497,10,'#98b8cb');this.text('DESTINATION: THE MOON',720,45,10,'#81a8c6');
      const c=this.ctx;c.strokeStyle='#43657e';c.setLineDash([4,7]);c.beginPath();c.moveTo(800,305);c.quadraticCurveTo(895,260,840,210);c.stroke();c.setLineDash([]);
    }
    flight(t) {
      const g=this.game,f=g.travel,leg=FLIGHT_LEGS[f.leg],c=this.ctx;
      this.sprite('earth',f.leg===0?-70:45,f.leg===0?235:135,f.leg===0?290:80,f.leg===0?290:80,.85);
      this.sprite('moon',f.leg>=3?672:795,f.leg>=3?223:150,f.leg>=3?235:78,f.leg>=3?235:78,.9);
      let x=f.x,y=f.y;
      if(g.effect?.type==='cruise'&&f.destination){const p=clamp(g.effect.elapsed/g.effect.duration,0,1),eased=p*p*(3-2*p);x+=(f.destination.x-x)*eased;y+=(f.destination.y-y)*eased;}
      c.strokeStyle='#315373';c.lineWidth=2;c.setLineDash([5,9]);c.beginPath();c.moveTo(235,315);c.bezierCurveTo(390,315,450,220,585,245);c.bezierCurveTo(660,268,680,345,775,340);c.stroke();c.setLineDash([]);
      for(const [wx,wy] of [[500,224],[635,351]]){c.strokeStyle='#71d4dc';c.lineWidth=2;c.strokeRect(wx-21,wy-21,42,42);this.rect(wx-6,wy-2,12,4,'#c6fff4');this.rect(wx-2,wy-6,4,12,'#c6fff4');}
      this.ship(x-64,y-32,1,t);this.sprite('pix',x-30,y-77+Math.sin(t)*3,31,31);
      if(g.effect?.type==='scan'){const p=g.effect.elapsed/g.effect.duration;this.shield(x,y,65+p*165,t,1-p*.7);this.rect(x+70,y-2,130+p*170,3,'#76c9d566');}
      if(f.leg===1&&f.step>=2){c.strokeStyle='#b88be6';c.lineWidth=4;c.beginPath();c.moveTo(850,160);c.lineTo(800,270);c.lineTo(855,375);c.stroke();}
      this.rect(36,417,182,42,'#182c45');this.rect(45,426,7,7,'#71e4c7');this.text('EARTH RADIO LINK',62,435,10,'#b1e5e5');this.text('CONNECTED',62,451,9,'#78b2b4');
      this.text(leg.place,43,120,12,'#a6cadd');this.text('FLIGHT MODE · EXPLORE AT YOUR PACE',43,142,10,'#88a8bc');
    }
    tailFlame(x,y,length=45,width=28) { const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(Math.PI/2);this.sprite('flame',-width/2,0,width,length);c.restore(); }
    ship(x=130,y=268,scale=1,t=this.time) { this.tailFlame(x+1,y+31,42+Math.sin(t*15)*6,28);this.sprite('ship',x,y,128*scale,64*scale); }
    launch(t) {
      const g=this.game,d=g.data,c=this.ctx;const sky=c.createLinearGradient(0,120,0,540);sky.addColorStop(0,'rgba(39,50,100,.1)');sky.addColorStop(1,'#386b84');c.fillStyle=sky;c.fillRect(0,120,960,420);
      this.sprite('moon',775,95,65,65,.6);
      for(let i=0;i<18;i++){let x=i*61;this.rect(x,364-(i%4)*13,70,155,'#1b364c');this.rect(x+5,370-(i%4)*13,4,4,'#52747c');}
      this.rect(0,445,960,95,'#142735');this.rect(0,445,960,5,'#4b7382');this.rect(70,476,815,6,'#243c4d');this.rect(70,509,815,3,'#243c4d');
      this.rect(446,193,16,250,'#435c70');this.rect(452,187,6,260,'#8196a4');for(let y=220;y<420;y+=38){this.rect(410,y,48,6,'#5d7787');this.rect(416,y,6,24,'#455e72');}
      this.rect(440,238,90,8,'#638094');this.rect(440,340,90,8,'#638094');this.rect(467,429,107,18,'#8b9ca3');this.rect(458,447,125,12,'#2c4351');
      let lift=g.effect?.type==='launch'?Math.pow(clamp((g.effect.elapsed/g.effect.duration-.57)/.43,0,1),2)*650:0;
      if(g.visualHits('engine')>0||lift){this.sprite('flame',505,397-lift,42,65+Math.sin(t*19)*9);}
      this.sprite('rocket',489,203-lift,70,210);
      this.rect(194,330,75,115,'#425a68');this.rect(187,320,89,12,'#7d97a5');this.rect(204,346,54,63,'#192d43');for(let i=0;i<4;i++)this.rect(210,398-i*12,42,7,g.visualHits('fuel')*2>i?'#6ae7be':'#2b4b59');this.text('FUEL',216,431,11,'#d1dde0');
      this.panel(600,180,112,68,g.visualDone('navigation'));this.text('NAV',614,199,10);this.rect(615,210,76,4,g.visualDone('navigation')?'#71efc3':'#53718e');
      this.rect(735,366,42,76,'#354c65');this.rect(741,372,30,47,'#0c2638');this.rect(754,315,6,55,'#799da7');this.rect(724,313,65,6,'#9bb3b7');this.rect(738,299,36,6,'#9bb3b7');if(g.visualHits('radio')){c.strokeStyle='#6ae7be';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.arc(758,309,20+i*12,3.7,5.7);c.stroke();}}
      this.panel(284,165,105,68,g.visualDone('launch'));this.text('CONTROL',299,187,10);this.rect(301,202,69,12,g.visualDone('launch')?'#6ae7be':'#fdb15c');
      this.sprite('nova',92,371,39,55);this.text('STARLING · LUNAR RESCUE',45,118,12,'#b0cfe7');
      if(lift>40){for(let i=0;i<12;i++)this.rect(437+i*13,433-(i%3)*10,32,18,'#b1c9cc');}
    }
    panel(x,y,w,h,working) {this.rect(x,y,w,h,'#50627c');this.rect(x+3,y+3,w-6,h-6,'#162a43');this.rect(x+8,y+8,4,4,working?'#69e5c2':'#f7a16e');this.rect(x+w-13,y+8,4,4,'#7195b2');}
    asteroids(t) {
      const g=this.game;this.sprite('earth',-88,348,230,230,.65);this.ship(112,270,1,t);this.text('DEFENSE LASER  /  READY',55,419,11,'#75cfdb');
      for(const ob of g.visualTargets()){if(g.visualDone(ob.id))continue;let x=ob.x*9.6,y=ob.y*5.4,size=ob.kind==='large'?84:ob.kind==='cluster'?58:61;let approach=this.reduced?0:58*Math.exp(-g.sceneAge/4),wobble=this.reduced?0:Math.sin(t*.45+ob.x)*5;x+=approach;size*=1-approach/250;this.sprite('asteroid',x-size/2+wobble,y-size/2,size,size);if(ob.kind==='cluster'){this.sprite('asteroid',x-38,y-43,30,30);this.sprite('asteroid',x+26,y+10,34,34);}if(ob.kind==='shielded')this.shield(x,y,48,t);}
      this.text('UNUSUAL GRAVITY SIGNATURE DETECTED',450,475,10,'#b092d2');
    }
    interior(t) {
      const g=this.game,c=this.ctx;this.rect(28,105,904,385,'#16223a');this.rect(45,123,870,345,'#25344c');
      for(let x=60;x<915;x+=80){this.rect(x,127,4,325,'#34445b');this.rect(x,445,70,4,'#45556c');}
      this.rect(83,140,790,100,'#091528');for(let x=94;x<860;x+=160){this.rect(x,148,143,83,'#0a2135');this.rect(x+4,153,4,4,'#779eb9');}
      this.sprite('earth',702,145,79,79,.8);this.rect(466,118,7,128,'#45566c');
      this.rect(53,459,855,20,'#111e31');for(let x=60;x<900;x+=38)this.rect(x,462,28,4,'#33485b');
      const specs=[[150,258,106,83,'oxygen'],[351,344,110,89,'power'],[574,240,113,93,'guidance'],[734,344,110,87,'stabilizer']];
      for(const [x,y,w,h,id]of specs){const fixed=g.visualDone(id);this.panel(x,y,w,h,fixed);this.rect(x+15,y+23,w-30,27,fixed?'#123f45':'#442e47');for(let i=0;i<4;i++)this.rect(x+20+i*16,y+30,9,12,fixed?'#6ae2c3':'#ee947b');this.rect(x+18,y+h-16,w-36,4,fixed?'#6ae2c3':'#b46c79');if(!fixed){this.rect(x+w-6,y+12,15,4,'#d7a15c');if(Math.sin(t*3+x)>.5){this.rect(x+w+3,y+1,4,9,'#ffd98a');this.rect(x+w+9,y+7,7,3,'#ffb15a');}}}
      this.rect(89,254,30,124,'#536d84');this.rect(96,265,16,94,g.visualDone('oxygen')?'#63c9d1':'#71435c');
      this.sprite('nova',440,329+Math.sin(t)*2,48,70);this.sprite('pix',504,300+Math.sin(t*1.3)*5,35,35);
      this.text(g.visualDone('power')?'CABIN POWER: RESTORED':'EMERGENCY POWER · 4 SYSTEMS OFFLINE',57,102,12,g.visualDone('power')?'#71e7bd':'#f2aa8a');
      if(!g.visualDone('power')){c.fillStyle='rgba(160,53,63,.06)';c.fillRect(28,105,904,385);}this.text('STARLING / ENGINEERING DECK',57,505,10,'#7b94ac');
    }
    combat(t) {
      const g=this.game;this.sprite('moon',788,106,105,105,.48);this.ship(112,263,1,t);this.text(`PATROL WAVE 0${g.wave()} / 02`,60,420,12,'#7bdfde');
      for(const ob of g.visualTargets()){if(g.visualDone(ob.id))continue;const size=ob.kind==='armored'?115:91;this.sprite(ob.kind==='armored'?'armored':'drone',ob.x*9.6-size/2,ob.y*5.4-size*.32+Math.sin(t*1.7+ob.x)*5,size,size*.64);for(let i=0;i<ob.hp;i++)this.rect(ob.x*9.6-18+i*13,ob.y*5.4-41,9,4,i<ob.hp-g.visualHits(ob.id)?'#ce8eff':'#344663');}
      if(g.state===STATES.PLAY){const p=(t*.2)%1;this.rect(720-p*420,262+Math.sin(t)*6,19,3,'#ab65d8');this.shield(167,292,67,t,.22);}
    }
    boss(t) {
      const g=this.game,stage=g.visualBossStage();this.sprite('moon',710,228,270,270,.8);this.ship(98,273,1,t);
      const retreat=g.effect?.type==='defeat'?clamp((g.effect.elapsed/g.effect.duration-.32)/.68,0,1):0;
      this.ctx.save();this.ctx.translate(retreat*650,-retreat*100);
      const y=173+Math.sin(t*.65)*4;this.sprite('boss',468,y,354,189);
      if(stage===1)this.shield(647,265,191,t,.8);
      if(stage===3){this.rect(494,285,42,12,'#394358');this.rect(756,285,42,12,'#394358');this.rect(635,247,23,31,'#fff3b0');this.rect(641,241,11,43,'#77eedb');}
      this.ctx.restore();
      const hits=TARGETS[4].reduce((n,o)=>n+g.visualHits(o.id),0);this.rect(498,116,294,7,'#352b50');this.rect(498,116,294*(1-hits/9),7,stage===1?'#7de5eb':'#d09af5');this.text('COMMANDER GLITCH',498,106,11,'#d3b9ed');
      this.text(['','01 / DISRUPT SHIELD','02 / DISABLE WEAPONS','03 / CLOSE THE PORTAL'][stage]||'PORTAL OFFLINE',500,408,12,'#e7c7fd');
      this.sprite('glitch',854,353,46,46,.8);
    }
    shield(x,y,r,t,alpha=.7) {const c=this.ctx;c.globalAlpha=alpha;c.strokeStyle='#6be4f4';c.lineWidth=3;c.setLineDash([12,7]);c.beginPath();for(let i=0;i<=12;i++){const a=i*Math.PI/6;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r*.75;i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();c.setLineDash([]);c.globalAlpha=1;}
    lunar(t,victory) {
      const g=this.game,c=this.ctx;this.sprite('earth',110,111,103,103);this.text('HOME, 384,400 KM AWAY',75,232,9,'#789cbb');
      this.rect(0,422,960,118,'#647087');this.rect(0,422,960,6,'#a7afba');for(let i=0;i<33;i++){const x=(i*113)%960,y=438+(i*47)%100;this.rect(x,y,20+i%4*9,4,'#47566e');this.rect(x+4,y+4,12+i%4*6,3,'#7b8799');}for(let i=0;i<12;i++){let x=i*92;this.rect(x,414-(i%4)*6,48,10+(i%4)*6,'#8992a3');}
      this.rect(789,326,19,96,'#56667d');this.rect(783,321,31,10,'#9daabd');this.rect(788,301,21,21,victory?'#91ffe0':'#ba788c');this.rect(797,276,4,25,'#b6c8d2');
      if(victory){c.fillStyle='rgba(89,231,210,.12)';c.beginPath();c.moveTo(798,301);c.lineTo(735,0);c.lineTo(865,0);c.closePath();c.fill();this.shield(798,306,25,t,.4);}
      let finished=LANDING.reduce((n,o)=>n+g.visualHits(o.id),0),alt=victory?0:95-finished*8;
      if(g.effect?.type==='landing')alt=clamp(40*(1-g.effect.elapsed/g.effect.duration),0,40);
      const sx=490+(victory?0:Math.sin(t)* (g.visualDone('stability')?1:9)),sy=286-alt;
      this.sprite('rocket',sx,sy,64,136);
      if(victory){this.rect(sx-9,sy+115,15,5,'#b7c5cf');this.rect(sx-11,sy+115,4,22,'#b7c5cf');this.rect(sx+57,sy+115,15,5,'#b7c5cf');this.rect(sx+69,sy+115,4,22,'#b7c5cf');}
      if(!victory){this.sprite('flame',sx+17,sy+126,29,45+(g.visualHits('thrusters')?12:0)+Math.sin(t*15)*7);if(g.visualHits('gear')){this.rect(sx-9,sy+115,15,5,'#b7c5cf');this.rect(sx-11,sy+115,4,22,'#b7c5cf');this.rect(sx+57,sy+115,15,5,'#b7c5cf');this.rect(sx+69,sy+115,4,22,'#b7c5cf');}this.text(`ALTITUDE ${Math.max(0,Math.round(alt*12))} M`,63,318,11,'#bcd0dc');this.text(g.visualDone('alignment')?'BEACON LOCK: ALIGNED':'BEACON LOCK: ACQUIRING',63,340,11,'#76d8d8');}
      else {this.sprite('nova',625,362+Math.sin(t*3)*2,42,60);this.sprite('pix',688,344+Math.sin(t*2)*5,32,32);this.rect(591,355,4,68,'#d3dbe0');this.rect(595,355,38,25,'#d9975e');this.rect(601,361,15,4,'#fff3cd');this.rect(607,357,4,17,'#fff3cd');this.text('THE MOONLIGHT IS HOME',442,475,13,'#d8eee6');}
      if(g.visualDone('alignment')&&!victory){c.strokeStyle='#61bfc5';c.setLineDash([4,7]);c.beginPath();c.moveTo(520,414);c.lineTo(798,312);c.stroke();c.setLineDash([]);}
    }
    drawEffect(e) {
      const p=clamp(e.elapsed/e.duration,0,1),c=this.ctx;
      if(['laser','shield','boss','alien'].includes(e.type)){
        const x=e.target?.x*9.6||640,y=e.target?.y*5.4||270;
        if(p<.6){const z=clamp(p/.6,0,1),px=235+(x-235)*z,py=294+(y-294)*z;this.rect(px-28,py-3,37,6,e.type==='boss'?'#e8bcff':'#90ffed');this.rect(px-20,py-1,32,2,'#ffffff');}
        if(p>=.5){c.globalAlpha=(1-p)*1.5;this.rect(x-26,y-26,52,52,'#ffe6a4');this.rect(x-39,y-8,78,16,'#fff4d1');c.globalAlpha=1;}
        if(e.type==='shield')this.shield(174,295,80,this.time,1-p);
      }
      if(e.type==='launch'){this.text(p<.22?'3':p<.4?'2':p<.57?'1':'LIFTOFF',480,146,36,'#fff0c3','center');}
      if(e.type==='repair'){this.shield(e.target.x*9.6,e.target.y*5.4,45+p*20,this.time,1-p);}
      if(e.type==='activate'){this.text(e.target&&this.game.hits(e.target.id)<e.target.hp?'CHECK PASSED':'SYSTEM ONLINE',480,465,18,'#84f6cf','center');}
      if(e.type==='defeat'){this.shield(647,264,200+p*100,this.time,1-p);this.text('PORTAL DISCONNECTED',480,438,22,'#c8fff0','center');}
    }
  }

  class DisplayManager {
    constructor(game) {
      this.game=game;this.fallback=false;this.pending=false;
      const changed=()=>{this.fallback=false;this.sync();};
      document.addEventListener('fullscreenchange',changed);
      document.addEventListener('webkitfullscreenchange',changed);
      this.sync();
    }
    nativeActive() {return !!(document.fullscreenElement||document.webkitFullscreenElement);}
    active() {return this.nativeActive()||this.fallback;}
    enter() {
      if(this.active()||this.pending)return;
      const root=document.documentElement,request=root.requestFullscreen||root.webkitRequestFullscreen;
      if(!request){this.fallback=true;this.sync();return;}
      this.pending=true;
      try {
        const result=request===root.requestFullscreen?request.call(root,{navigationUI:'hide'}):request.call(root);
        Promise.resolve(result).then(()=>{this.pending=false;this.sync();}).catch(()=>{this.pending=false;this.fallback=true;this.sync();});
      } catch {this.pending=false;this.fallback=true;this.sync();}
    }
    exit() {
      this.fallback=false;
      const exit=document.exitFullscreen||document.webkitExitFullscreen;
      if(this.nativeActive()&&exit){try{Promise.resolve(exit.call(document)).then(()=>this.sync()).catch(()=>this.sync());}catch{this.sync();}}
      else this.sync();
    }
    toggle() {if(this.active())this.exit();else this.enter();}
    sync() {
      const active=this.active(),button=$('fullscreen-button');
      document.documentElement.classList.toggle('is-fullscreen',active);
      if(button){button.textContent=active?'Exit fullscreen':'Fullscreen';button.title=active?'Exit fullscreen':'Enter fullscreen';button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(active));}
      this.game.renderer.resize();
    }
  }

  class Game {
    constructor() {
      this.state=STATES.MENU;this.data=null;this.effect=null;this.question=null;this.last=0;this.autosave=0;this.sceneAge=0;this.bank=new QuestionBank();this.save=new SaveManager();this.audio=new AudioManager();this.renderer=new Renderer(this);this.loaded=false;this.modalReturn=null;this.story=null;this.repair=null;this.travel=null;this.audioReturn=null;
      this.display=new DisplayManager(this);this.bind();this.syncSound();requestAnimationFrame(t=>this.frame(t));
    }
    async init() {
      try { await Promise.all([this.bank.load(),this.renderer.load()]);this.loaded=true;this.saved=this.save.read();this.showMenu(); }
      catch(error){this.state=STATES.ERROR;this.overlay(`<div class="modal-backdrop"><section class="panel"><p class="eyebrow">MISSION FILES UNAVAILABLE</p><h2>Let’s get you ready for launch.</h2><p>${esc(error.message)}</p><p>Open <strong>index.html</strong> using your editor’s <strong>Live Preview</strong>. Check that <strong>questions.json</strong> and the <strong>assets</strong> folder are beside it, then refresh the preview.</p><button class="primary" data-action="reload">Try again</button></section></div>`);}
    }
    bind() {
      document.addEventListener('click',event=>{
        const button=event.target.closest('button');if(!button||button.disabled)return;
        this.audio.unlock();
        if(button.dataset.target){this.interact(button.dataset.target);return;}
        if(button.dataset.answer!==undefined){this.answer(Number(button.dataset.answer));return;}
        if(button.dataset.contact!==undefined){this.connect(Number(button.dataset.contact));return;}
        if(button.dataset.flight){this.travelAction(button.dataset.flight);return;}
        if(button.dataset.audioPreset){this.applyAudioPreset(button.dataset.audioPreset);return;}
        if(button.dataset.action){this.audio.play('click');this.action(button.dataset.action);}
      });
      $('pause-button').addEventListener('click',()=>this.pause());
      $('sound-button').addEventListener('click',()=>{this.audio.toggle();this.syncSound();if(this.state===STATES.AUDIO)this.renderAudio();});
      $('music-button').addEventListener('click',()=>{this.audio.unlock();this.audio.play('click');this.audio.toggleMusic();this.syncSound();if(this.state===STATES.AUDIO)this.renderAudio();});
      $('fullscreen-button').addEventListener('click',()=>{this.audio.unlock();this.audio.play('click');this.display.toggle();});
      $('help-button').addEventListener('click',()=>this.help());
      $('audio-button').addEventListener('click',()=>this.openAudio());
      document.addEventListener('input',event=>{const channel=event.target.dataset?.audioVolume;if(!channel)return;this.audio.unlock();this.audio.setVolume(channel,Number(event.target.value)/100);const output=document.querySelector(`[data-volume-output="${channel}"]`);if(output)output.textContent=`${event.target.value}%`;this.syncSound();this.syncAudioPresets();this.audioStatus(this.audio.volume('master')===0?'Master volume is at 0%. Raise it to hear audio.':this.audio.enabled?'Volume saved. Use Test to hear your mix.':'Volume saved. Master audio is muted; your mix will be used when you unmute.');});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(this.display.fallback)this.display.exit();if(this.state===STATES.AUDIO)this.closeAudio();else if(this.state===STATES.PAUSE)this.resume();else if(this.state===STATES.HELP)this.closeHelp();else this.pause();}if(e.key===' '&&this.state===STATES.STORY&&e.target===document.body){e.preventDefault();this.nextStory();}});
      document.addEventListener('visibilitychange',()=>{if(document.hidden){this.stopAllSounds();if([STATES.PLAY,STATES.QUESTION,STATES.STORY,STATES.EFFECT,STATES.REPAIR,STATES.TRAVEL].includes(this.state))this.pause();this.persist();}this.last=performance.now();});
      window.addEventListener('pagehide',()=>{this.stopAllSounds();this.persist();});
    }
    action(action) {
      const actions={new:()=>this.newGame(),continue:()=>this.continueGame(),help:()=>this.help(),'close-help':()=>this.closeHelp(),audio:()=>this.openAudio(),'close-audio':()=>this.closeAudio(),'audio-master':()=>this.audioSetting('master'),'audio-music':()=>this.audioSetting('music'),'audio-effects':()=>this.audioSetting('effects'),'audio-voice':()=>this.audioSetting('voice'),'audio-reset':()=>{this.audio.resetSettings();this.syncSound();this.renderAudio('Balanced defaults restored. All audio channels are enabled.');},'test-master':()=>this.testAudio('master'),'test-music':()=>this.testAudio('music'),'test-effects':()=>this.testAudio('effects'),'test-voice':()=>this.testAudio('voice'),sound:()=>{this.audio.toggle();this.syncSound();this.renderPause();},music:()=>{this.audio.toggleMusic();this.syncSound();},pause:()=>this.pause(),resume:()=>this.resume(),retry:()=>this.retry(),restart:()=>this.newGame(),menu:()=>this.showMenu(),'story-next':()=>this.nextStory(),'story-skip':()=>this.finishStory(),'question-next':()=>this.finishQuestion(),'round-next':()=>this.advanceRound(),'travel-radio':()=>this.travelAction('radio'),'travel-upper':()=>this.travelAction('upper'),'travel-lower':()=>this.travelAction('lower'),'travel-scan':()=>this.travelAction('scan'),reload:()=>location.reload()};
      actions[action]?.();
    }
    overlay(html,className='') {const el=$('overlay');el.hidden=false;el.className=`overlay ${className}`;el.innerHTML=html;this.setInert(true);const button=el.querySelector('button:not([disabled])');if(button)button.focus({preventScroll:true});}
    hideOverlay() {$('overlay').hidden=true;$('overlay').innerHTML='';this.setInert(false);}
    setInert(value) { $('scene-targets').inert=value;if($('mission-controls'))$('mission-controls').inert=value; }
    syncSound() {
      const b=$('sound-button');b.textContent=this.audio.enabled?'Master on':'Master muted';b.setAttribute('aria-pressed',String(this.audio.enabled));b.title=this.audio.enabled?`Mute all audio (master volume ${Math.round(this.audio.volume('master')*100)}%)`:'Unmute all audio';b.setAttribute('aria-label',b.title);
      const music=$('music-button');music.textContent=this.audio.musicEnabled?'Music on':'Music off';music.setAttribute('aria-pressed',String(this.audio.musicEnabled));music.title=this.audio.musicEnabled?'Mute background music':'Play background music';music.setAttribute('aria-label',music.title);
      document.querySelectorAll('[data-action="sound"]').forEach(el=>el.textContent=this.audio.enabled?'Master: on':'Master: muted');
      document.querySelectorAll('[data-action="music"]').forEach(el=>{el.textContent=this.audio.musicEnabled?'Music: on':'Music: off';el.setAttribute('aria-pressed',String(this.audio.musicEnabled));});
    }
    stopAllSounds() {this.audio.stopSpeech();this.audio.stopNodes(this.audio.effects);this.audio.stopNodes(this.audio.musicPreviewNodes);this.audio.setAmbience(null);this.audio.stopMusic();}
    openAudio() {
      if(this.state===STATES.AUDIO)return;this.audio.unlock();
      const active=[STATES.PLAY,STATES.QUESTION,STATES.STORY,STATES.EFFECT,STATES.REPAIR,STATES.COMPLETE,STATES.TRAVEL].includes(this.state);
      if(active)this.pause();this.stopAllSounds();
      this.audioReturn={state:this.state,resume:active,html:$('overlay').innerHTML,className:$('overlay').className.replace(/^overlay\s*/,''),hidden:$('overlay').hidden};
      this.state=STATES.AUDIO;this.renderAudio();
    }
    renderAudio(message='') {
      if(this.state!==STATES.AUDIO)return;
      const enabled={music:this.audio.musicEnabled,effects:this.audio.effectsEnabled,voice:this.audio.voiceEnabled};
      const descriptions={music:['Music','Outer Space Loop by wipics, softer during dialogue and questions.'],effects:['Sound effects','Lasers, engines, repairs, and the ship’s gentle hum.'],voice:['Character voices','Little talking sounds for Nova, PIX, Glitch, and Earth.']};
      const rows=Object.entries(descriptions).map(([channel,[label,help]])=>`<div class="audio-setting"><div class="audio-setting-copy"><label for="${channel}-volume">${label}</label><p>${help}</p></div><div class="audio-setting-control"><button class="secondary audio-row-toggle" data-action="audio-${channel}" aria-pressed="${enabled[channel]}" aria-label="${enabled[channel]?'Mute':'Enable'} ${label.toLowerCase()}">${enabled[channel]?'On':'Muted'}</button><input id="${channel}-volume" type="range" min="0" max="100" step="1" value="${Math.round(this.audio.volume(channel)*100)}" data-audio-volume="${channel}" aria-label="${label} volume"><output for="${channel}-volume" data-volume-output="${channel}">${Math.round(this.audio.volume(channel)*100)}%</output><button class="ghost" data-action="test-${channel}" aria-label="Test ${label.toLowerCase()}">Test</button></div></div>`).join('');
      const status=this.audio.status();
      const hint=message||(!status.supported?'Audio is unavailable in this browser. You can still play.':!this.audio.enabled?'Master audio is muted. Unmute it to hear your mix.':this.audio.volume('master')===0?'Master volume is at 0%. Raise it to hear audio.':status.musicError?'The music file could not load. Refresh Live Preview and check the audio asset folder.':status.error?'The browser has not started audio yet. Try Test mix or open Live Preview in your browser.':'Set your volumes, then use Test to hear each channel. Your choices are saved.');
      const presets=Object.entries(AUDIO_PRESETS).map(([id,preset])=>`<button class="secondary" data-audio-preset="${id}" aria-pressed="false">${preset.label}</button>`).join('');
      this.overlay(`<div class="modal-backdrop"><section class="panel wide audio-panel" role="dialog" aria-modal="true" aria-labelledby="audio-title"><div class="panel-header"><div><p class="eyebrow">MAKE SPACE SOUND LIKE YOU</p><h2 id="audio-title">Music & sound</h2></div><button class="ghost" data-action="close-audio" aria-label="Close audio settings">Close ×</button></div><div class="audio-setting audio-master-setting"><div class="audio-setting-copy"><label for="master-volume">Master audio</label><p>Adjust every sound together. Your channel balance stays the same.</p></div><div class="audio-setting-control"><button class="secondary audio-row-toggle" data-action="audio-master" aria-pressed="${this.audio.enabled}" aria-label="${this.audio.enabled?'Mute':'Unmute'} all audio">${this.audio.enabled?'On':'Muted'}</button><input id="master-volume" type="range" min="0" max="100" step="1" value="${Math.round(this.audio.volume('master')*100)}" data-audio-volume="master" aria-label="Master audio volume"><output for="master-volume" data-volume-output="master">${Math.round(this.audio.volume('master')*100)}%</output><button class="ghost" data-action="test-master" aria-label="Test the complete audio mix">Test mix</button></div></div><div class="audio-presets" role="group" aria-label="Audio mix presets">${presets}</div><p class="volume-description">Choose a mix, or adjust the channels below. Presets keep your mute choices.</p>${rows}<p id="audio-status" class="audio-status" role="status" aria-live="polite">${esc(hint)}</p><div class="button-row"><button class="secondary" data-action="audio-reset">Restore defaults</button><button class="primary" data-action="close-audio">Done →</button></div></section></div>`,'audio-overlay');
      this.syncAudioPresets();
    }
    audioSetting(channel) {
      if(this.state!==STATES.AUDIO)return;
      if(channel==='master')this.audio.toggle();else if(channel==='music')this.audio.toggleMusic();else if(channel==='effects')this.audio.toggleEffects();else if(channel==='voice')this.audio.toggleVoice();
      this.syncSound();this.renderAudio();document.querySelector(`[data-action="audio-${channel}"]`)?.focus({preventScroll:true});
    }
    audioStatus(message) {const status=$('audio-status');if(status)status.textContent=message;}
    syncAudioPresets() {document.querySelectorAll('[data-audio-preset]').forEach(button=>{const preset=AUDIO_PRESETS[button.dataset.audioPreset];button.setAttribute('aria-pressed',String(['master','music','effects','voice'].every(channel=>Math.abs(this.audio.volume(channel)-preset[channel])<.005)));});}
    applyAudioPreset(id) {
      if(this.state!==STATES.AUDIO||!AUDIO_PRESETS[id])return;const preset=AUDIO_PRESETS[id];
      this.audio.unlock();for(const channel of ['master','music','effects','voice'])this.audio.setVolume(channel,preset[channel]);
      this.syncSound();this.renderAudio(`${preset.label} mix saved. Your mute choices have been kept.`);document.querySelector(`[data-audio-preset="${id}"]`)?.focus({preventScroll:true});
    }
    testAudio(channel) {
      if(this.state!==STATES.AUDIO)return;
      if(!this.audio.enabled||this.audio.volume('master')===0){this.audioStatus('Master audio is muted or at 0%. Unmute it and raise the master volume to test your mix.');return;}
      const playing=channel==='master'?['music','effects','voice'].map(c=>this.audio.preview(c)).some(Boolean):this.audio.preview(channel);
      this.audioStatus(playing?'Playing your current mix. If you cannot hear it, check your device volume and browser tab mute.':'This channel is muted or at 0%. Enable it and raise its volume to hear a preview.');
    }
    closeAudio() {
      if(this.state!==STATES.AUDIO||!this.audioReturn)return;this.stopAllSounds();const back=this.audioReturn;this.audioReturn=null;this.state=back.state;this.last=performance.now();
      if(back.resume){this.resume();return;}
      if(back.hidden)this.hideOverlay();else this.overlay(back.html,back.className);this.syncSound();
    }
    newGame() {
      if(!this.loaded)return;
      this.display.enter();
      this.data={version:3,objectiveVersion:2,round:0,phase:'main',hearts:3,progress:{},used:[],interludes:[],correct:0,mistakes:0,elapsed:0,checkpoint:'intro'};
      this.effect=null;this.question=null;this.repair=null;this.travel=null;this.saved=this.data;this.audio.unlock();this.persist();this.beginStory(INTRO[0],()=>this.startPlaying());this.updateHUD();
    }
    continueGame() {
      this.data=this.save.read()||this.saved;if(!this.data){this.showMenu();return;}
      this.display.enter();
      this.effect=null;this.question=null;this.repair=null;this.travel=null;this.updateHUD();
      if(this.data.checkpoint==='failed')this.gameOver();
      else if(this.data.checkpoint==='victory')this.victory();
      else if(this.data.checkpoint==='ending')this.beginEnding();
      else if(this.data.checkpoint==='travel')this.beginTravel(this.data.travel.leg,true);
      else if(this.data.checkpoint==='intro')this.beginStory(this.data.phase==='landing'?LANDING_STORY:INTRO[this.data.round],()=>this.startPlaying());
      else if(this.data.checkpoint==='complete')this.roundComplete();
      else this.startPlaying();
    }
    beginTravel(leg,restoring=false) {
      const step=restoring?this.data.travel.step:0;
      this.data.checkpoint='travel';this.data.travel={leg,step};
      this.travel={leg,step,x:step>=2?500:240,y:step>=2?224:310,destination:null};
      this.question=null;this.effect=null;$('scene-targets').innerHTML='';if($('mission-controls'))$('mission-controls').innerHTML='';
      this.persist();this.updateHUD();
      if(step===3)this.beginStory(FLIGHT_LEGS[leg].scan,()=>this.finishTravel());
      else if(step===0)this.beginStory(FLIGHT_LEGS[leg].brief,()=>this.renderTravel());
      else this.renderTravel();
    }
    renderTravel() {
      if(!this.travel)return;this.state=STATES.TRAVEL;this.travel.step=this.data.travel.step;this.updateHUD();
      const f=this.travel,leg=FLIGHT_LEGS[f.leg],step=f.step;
      const instructions=['Earth is calling. Answer the radio to hear your flight instructions.','Pilot the Starling to either blue waypoint. Both routes are safe.','Scan the route ahead to discover what is waiting near the Moon.'];
      const controls=step===0?'<button class="primary travel-button" data-action="travel-radio">Answer Earth’s call →</button>':step===1?'<button class="secondary travel-button" data-action="travel-upper">Fly to upper waypoint ↗</button><button class="secondary travel-button" data-action="travel-lower">Fly to lower waypoint ↘</button>':'<button class="primary travel-button" data-action="travel-scan">Scan the route →</button>';
      this.overlay(`<section class="travel-panel" aria-labelledby="flight-title"><p class="eyebrow travel-eyebrow">FLIGHT LOG · LEG ${f.leg+1} OF 5</p><h2 id="flight-title">${leg.title}</h2><p class="travel-stage">${step+1} / 3 · ${['Contact Earth','Choose your course','Explore ahead'][step]}</p><p id="travel-instruction">${instructions[step]}</p><div class="travel-actions"><button class="ghost" data-action="pause">Ⅱ Pause flight</button></div></section><div class="flight-readout">NOVA AT THE HELM · PIX ONLINE</div><div class="travel-controls">${controls}</div>`,'travel-overlay');
      $('scene-targets').innerHTML=step===1?'<button class="target-button" style="left:52.1%;top:41.5%" data-flight="upper" aria-label="Fly to the upper waypoint"><span class="target-dot">+</span><span class="target-label">Upper waypoint</span></button><button class="target-button" style="left:66.1%;top:65%" data-flight="lower" aria-label="Fly to the lower waypoint"><span class="target-dot">+</span><span class="target-label">Lower waypoint</span></button>':'';
      $('scene-targets').inert=false;
    }
    travelAction(action) {
      if(this.state!==STATES.TRAVEL||!this.travel)return;const f=this.travel,step=this.data.travel.step,leg=FLIGHT_LEGS[f.leg];
      const finish=(lines)=>{this.data.travel.step++;f.step=this.data.travel.step;this.persist();this.updateHUD();this.beginStory(lines,()=>f.step===3?this.finishTravel():this.renderTravel());};
      if(step===0&&action==='radio'){this.audio.play('transmission');finish(leg.radio);}
      else if(step===1&&['upper','lower'].includes(action)){
        f.destination=action==='upper'?{x:500,y:224}:{x:635,y:351};
        this.runEffect('cruise',null,2.4,()=>{f.x=f.destination.x;f.y=f.destination.y;f.destination=null;finish(leg.course);});
      }else if(step===2&&action==='scan')this.runEffect('scan',null,1.8,()=>finish(leg.scan));
    }
    finishTravel() {
      if(!this.travel)return;const leg=this.travel.leg;this.travel=null;delete this.data.travel;
      if(leg===4)this.data.phase='landing';else{this.data.round++;this.data.hearts=3;}
      this.data.progress={};this.data.checkpoint='intro';this.sceneAge=0;this.persist();this.updateHUD();
      this.beginStory(leg===4?LANDING_STORY:INTRO[this.data.round],()=>this.startPlaying());
    }
    showMenu() {
      this.audio.stopSpeech();this.audio.setAmbience(null);this.story=null;this.travel=null;
      if(this.data)this.persist();this.saved=this.save.read()||this.data||this.saved;this.state=STATES.MENU;this.effect=null;this.question=null;
      $('hud').hidden=true;$('scene-targets').innerHTML='';if($('mission-controls'))$('mission-controls').innerHTML='';$('scene-caption').textContent='EARTH → THE MOON  /  ONE EXTRAORDINARY JOURNEY';
      const continueLabel=this.saved?.checkpoint==='victory'?'Mission debrief':'Continue game';
      this.overlay(`<section class="menu-content"><p class="eyebrow"><span class="status-light"></span> A LITTLE CURIOSITY. A BIG ADVENTURE.</p><h1><span class="title-main">MOONY</span><span class="title-accent">JOURNEY<span class="title-star">✦</span></span></h1><p class="menu-subtitle">An Adventure Beyond Earth</p><p class="menu-copy">The Moon’s light has gone missing.<br>One brave captain. One clever little robot.<br>And a whole universe counting on you.</p><div class="menu-actions">${this.saved?`<button class="primary" data-action="continue">${continueLabel} <span aria-hidden="true">→</span></button><button class="secondary" data-action="new">New game · fresh journey</button>`:'<button class="primary" data-action="new">New game <span aria-hidden="true">→</span></button>'}<button class="secondary" data-action="audio">Music & sound</button><button class="ghost" data-action="help">How to play <span aria-hidden="true">↗</span></button></div><div class="menu-meta"><span>5 CHAPTERS</span><i></i><span>~15 MINUTES</span><i></i><span>AGES 6+</span></div>${this.saved?'<p class="save-note">New game replaces your saved mission.</p>':''}${this.save.warning?`<p class="save-note" role="status">${esc(this.save.warning)}</p>`:''}</section><div class="menu-stamp" aria-hidden="true"><span>MISSION 001</span><strong>THE MISSING<br>MOONLIGHT</strong><span>DESTINATION: WONDER</span></div>`,'menu-overlay');
    }
    defs() {return this.data?.phase==='landing'?LANDING:TARGETS[this.data?.round||0];}
    progress(id) {return this.data.progress[id]||{hits:0,fixed:false};}
    hits(id) {return this.data?this.progress(id).hits:0;}
    done(id) {const ob=this.defs().find(t=>t.id===id);return !!ob&&this.hits(id)>=ob.hp&&(ob.kind!=='repair'||this.progress(id).fixed);}
    visualHits(id) {
      let pending=this.question?.answered&&this.question.correct&&this.question.target.id===id;
      if(this.effect?.target?.id===id&&this.effect.elapsed/this.effect.duration<.55)pending=true;
      return Math.max(0,this.hits(id)-(pending?1:0));
    }
    visualDone(id) {const ob=this.defs().find(t=>t.id===id);return !!ob&&this.visualHits(id)>=ob.hp&&(ob.kind!=='repair'||this.progress(id).fixed);}
    visualBossStage() {return !this.visualDone('shield')?1:!this.visualDone('weapons')?2:3;}
    visualTargets() {const defs=this.defs();if(this.data.round===3){const wave=TARGETS[3].filter(t=>t.wave===1).every(t=>this.visualDone(t.id))?2:1;return defs.filter(t=>t.wave===wave);}if(this.data.round===4&&this.data.phase==='main')return defs.filter(t=>t.stage===this.visualBossStage());return defs;}
    wave() {return TARGETS[3].filter(t=>t.wave===1).every(t=>this.done(t.id))?2:1;}
    bossStage() {return !this.done('shield')?1:!this.done('weapons')?2:3;}
    visibleTargets() {const defs=this.defs();if(this.data.round===3)return defs.filter(t=>t.wave===this.wave());if(this.data.round===4&&this.data.phase==='main')return defs.filter(t=>t.stage===this.bossStage());return defs;}
    objective() {
      if(!this.data)return '';
      if(this.data.phase==='landing')return 'Bring all five landing systems online. Return the moonlight.';
      return ['Tap a launch system. Complete its one or two safety checks.','Tap an asteroid to aim your laser or shield.','Authorize each repair, then connect the highlighted contacts.',`Clear patrol wave ${this.wave()} of 2. Tap a drone to aim.`,['','Target the shield emitters. Break Glitch’s energy shell.','Target the weapon array. Make the portal ship safe.','Target the portal core. Charge your final burst.'][this.bossStage()]][this.data.round];
    }
    updateHUD() {
      if(!this.data)return;$('hud').hidden=this.state===STATES.MENU;
      if(this.travel){const f=this.travel;$('round-label').textContent=`FLIGHT LEG 0${f.leg+1} / 05`;$('round-title').textContent=FLIGHT_LEGS[f.leg].title;$('objective-text').textContent=['Listen to Earth’s instructions.','Choose either safe waypoint and fly the Starling.','Scan ahead and report your discovery.','Route complete. Prepare for the next part of the mission.'][this.data.travel.step];$('progress-label').textContent=`${this.data.travel.step} / 3`;$('progress-fill').style.width=`${this.data.travel.step/3*100}%`;$('hearts').innerHTML='<span class="small-note">SAFE FLIGHT</span>';$('hearts').setAttribute('aria-label','No hearts are at risk during this flight.');$('scene-caption').textContent=FLIGHT_LEGS[f.leg].place;this.renderTargets();return;}
      $('round-label').textContent=`CHAPTER 0${this.data.round+1} / 05`;$('round-title').textContent=this.data.phase==='landing'?'The Moon landing':ROUND_NAMES[this.data.round];$('objective-text').textContent=this.objective();
      const hearts=$('hearts');hearts.setAttribute('aria-label',`${this.data.hearts} of 3 hearts remaining`);hearts.innerHTML=Array.from({length:3},(_,i)=>`<img src="assets/ui/heart.svg" width="23" height="23" alt="" class="heart ${i>=this.data.hearts?'lost':''}">`).join('');
      const total=this.defs().reduce((n,t)=>n+t.hp+(t.kind==='repair'?1:0),0),complete=this.defs().reduce((n,t)=>n+this.hits(t.id)+(t.kind==='repair'&&this.progress(t.id).fixed?1:0),0);
      $('progress-label').textContent=`${Math.round(complete/total*100)}%`;$('progress-fill').style.width=`${complete/total*100}%`;
      $('scene-caption').textContent=this.data.phase==='landing'?'TRANQUILITY BASE · LUNAR APPROACH':ROUND_PLACES[this.data.round];
      this.renderTargets();
    }
    renderTargets() {
      if(this.travel){$('scene-targets').innerHTML='';if($('mission-controls'))$('mission-controls').innerHTML='';return;}
      if(!this.data)return;const visible=this.visibleTargets(),html=visible.map(ob=>{
        const done=this.done(ob.id),p=this.progress(ob.id),ready=ob.kind==='repair'&&p.hits>=ob.hp&&!p.fixed;
        const status=ob.kind==='repair'?'REPAIRED':this.data.round===1?'CLEARED':this.data.round===3?'DEFEATED':ob.kind==='boss'?'DISABLED':'ONLINE';
        return `<button type="button" class="target-button ${ob.kind==='repair'?'repair':''} ${done?'done':''} ${ob.kind==='boss'?'boss':''}" style="left:${ob.x}%;top:${ob.y}%" data-target="${ob.id}" ${done?'disabled':''} aria-label="${esc(ob.label)}: ${done?'complete':ready?'connect repair contacts':`${p.hits} of ${ob.hp} checks complete`}"><span class="target-dot" aria-hidden="true">${done?'✓':ready?'+':'+'}</span><span class="target-label">${esc(ob.label)}<span class="target-health">${done?status:ready?'CONNECT CONTACTS':Array.from({length:ob.hp},(_,i)=>i<p.hits?'■':'□').join(' ')}</span></span></button>`;
      }).join('');$('scene-targets').innerHTML=html;
      if($('mission-controls'))$('mission-controls').innerHTML=visible.filter(o=>!this.done(o.id)).map(o=>`<button class="mission-button" data-target="${o.id}">${esc(o.label)} <span>${this.hits(o.id)}/${o.hp}</span></button>`).join('');
      this.setInert(this.state!==STATES.PLAY);
    }
    beginStory(lines,onDone) {this.audio.stopSpeech();this.state=STATES.STORY;this.story={lines,index:0,onDone,visible:0,elapsed:0,transmitted:false};this.renderStory();}
    renderStory() {
      const [who,speaker,line]=this.story.lines[this.story.index],portrait=who;
      const speaking=this.story.visible<line.length;
      this.overlay(`<div class="story-panel" role="dialog" aria-label="${esc(speaker)} transmission"><div class="portrait ${who} ${speaking?'is-speaking':''}"><img src="assets/${SPRITES[portrait]}" alt="${esc(speaker)}"></div><div class="story-copy"><div class="speaker"><span class="eyebrow">${esc(speaker)}</span><span class="talk-indicator ${speaking?'is-speaking':''}" aria-hidden="true"><i></i><i></i><i></i></span><span class="dialogue-count">${this.story.index+1} / ${this.story.lines.length}</span></div><p class="dialogue-text"><span id="dialogue-visible" aria-hidden="true">${esc(line.slice(0,this.story.visible))}</span><span class="sr-only">${esc(line)}</span></p><div class="story-actions"><button class="ghost" data-action="story-skip">Skip transmission</button><button id="story-next" class="primary" data-action="story-next">${speaking?'Show message':this.story.index===this.story.lines.length-1?'Let’s do this':'Next'} →</button></div></div></div>`,'story-overlay');
      if(!this.story.transmitted){this.story.transmitted=true;this.audio.play('transmission');}
    }
    updateStory(dt) {
      const s=this.story;if(this.state!==STATES.STORY||!s)return;
      const [who,,line]=s.lines[s.index];s.elapsed+=dt;
      const visible=Math.min(line.length,Math.floor(s.elapsed/.023));
      if(visible===s.visible)return;
      s.visible=visible;const text=$('dialogue-visible');if(text)text.textContent=line.slice(0,visible);
      const speaking=visible<line.length;
      if(speaking)this.audio.speak(who,line.charAt(visible-1),visible);else this.audio.stopSpeech();
      document.querySelector('.story-panel .portrait')?.classList.toggle('is-speaking',speaking);
      document.querySelector('.talk-indicator')?.classList.toggle('is-speaking',speaking);
      const next=$('story-next');if(next&&!speaking)next.textContent=`${s.index===s.lines.length-1?'Let’s do this':'Next'} →`;
    }
    nextStory() {
      if(this.state!==STATES.STORY)return;const s=this.story,line=s.lines[s.index][2];this.audio.stopSpeech();
      if(s.visible<line.length){s.elapsed=(line.length+1)*.023;s.visible=line.length;this.renderStory();return;}
      if(++s.index>=s.lines.length)this.finishStory();else{s.visible=0;s.elapsed=0;s.transmitted=false;this.renderStory();}
    }
    finishStory() {if(this.state!==STATES.STORY)return;this.audio.stopSpeech();const callback=this.story.onDone;this.story=null;callback();}
    startPlaying() {
      this.state=STATES.PLAY;this.data.checkpoint='play';this.effect=null;this.question=null;this.hideOverlay();this.updateHUD();this.persist();
      if(this.defs().every(t=>this.done(t.id)))this.roundComplete();
    }
    interact(id) {
      if(this.state!==STATES.PLAY)return;const ob=this.visibleTargets().find(t=>t.id===id);if(!ob||this.done(id))return;
      this.audio.play('click');if(ob.kind==='repair'&&this.hits(id)>=ob.hp){this.startRepair(ob);return;}
      const q=this.bank.pick(this.data.used);if(!q){this.exhausted();return;}
      this.data.used.push(String(q.id));this.question={item:q,target:ob,check:this.hits(ob.id)+1,remaining:30,answered:false,correct:false,warning:false};this.state=STATES.QUESTION;this.persist();this.renderQuestion();
    }
    questionAction(ob) {
      if(this.data.phase==='landing')return 'Activate landing system';
      return ['Activate system',ob.kind==='shielded'?'Activate shield':'Fire defense laser','Authorize repair','Fire at drone',ob.id==='shield'?'Fire energy disruptor':'Fire charged laser'][this.data.round];
    }
    renderQuestion() {
      const q=this.question;
      this.overlay(`<div class="modal-backdrop"><section class="panel question-panel" role="dialog" aria-modal="true" aria-labelledby="question-text"><div class="question-top"><p class="eyebrow">${esc(q.target.label)} · CHECK ${q.check}/${q.target.hp}</p><button class="ghost small" data-action="pause" aria-label="Pause question">Ⅱ Pause</button></div><div class="question-context"><img src="assets/characters/pix.svg" width="32" height="32" alt="PIX"><span>Your answer powers our next move.</span><strong id="timer-label" aria-label="Seconds remaining">30s</strong></div><div class="timer-track"><div id="timer-fill"></div></div><h2 id="question-text">${esc(q.item.question)}</h2><div class="answers">${q.item.answers.map((a,i)=>`<button class="answer" data-answer="${i}"><span class="answer-key">${'ABCD'[i]}</span><span>${esc(a)}</span><span class="answer-result" aria-hidden="true"></span></button>`).join('')}</div><p id="answer-feedback" class="answer-feedback" role="status" aria-live="polite">Choose one answer. You’ve got this, Captain.</p><button id="question-next" class="primary" data-action="question-next" hidden>Continue →</button></section></div>`,'question-overlay');
      const text=$('timer-label');text.textContent=`${Math.ceil(q.remaining)}s`;$('timer-fill').style.width=`${q.remaining/30*100}%`;
      if(q.answered)this.showAnswerFeedback();
    }
    answer(index) {
      const q=this.question;if(this.state!==STATES.QUESTION||!q||q.answered)return;
      q.answered=true;q.choice=index;q.correct=index===q.item.correctAnswer;
      document.querySelectorAll('[data-answer]').forEach(b=>b.disabled=true);
      if(q.correct){this.data.correct++;const p=this.progress(q.target.id);this.data.progress[q.target.id]={hits:Math.min(q.target.hp,p.hits+1),fixed:p.fixed};this.audio.play('correct');}
      else{this.data.mistakes++;this.data.hearts=Math.max(0,this.data.hearts-1);this.audio.play('wrong');if(this.data.hearts===0)this.data.checkpoint='failed';}
      if(q.correct&&this.defs().every(t=>this.done(t.id)))this.data.checkpoint='complete';
      this.updateHUD();this.persist();this.showAnswerFeedback();
    }
    showAnswerFeedback() {
      const q=this.question;if(!q)return;
      document.querySelectorAll('[data-answer]').forEach(b=>{b.disabled=true;const n=Number(b.dataset.answer);if(n===q.item.correctAnswer){b.classList.add('correct');b.querySelector('.answer-result').textContent='✓';}else if(n===q.choice){b.classList.add('incorrect');b.querySelector('.answer-result').textContent='×';}});
      const explanation=q.item.explanation?` ${q.item.explanation}`:'';
      $('answer-feedback').textContent=q.correct?`✓ All clear, Captain!${explanation}`:`${q.choice===-1?'Time’s up.':'Good try!'} The answer is ${q.item.answers[q.item.correctAnswer]}.${explanation} ${this.data.hearts?`${this.data.hearts} ${this.data.hearts===1?'heart':'hearts'} left.`:'Let’s regroup and try again.'}`;
      $('answer-feedback').className=`answer-feedback ${q.correct?'positive':'negative'}`;
      const next=$('question-next');next.hidden=false;
      next.textContent=q.correct?(this.hits(q.target.id)<q.target.hp?`Next question · ${this.hits(q.target.id)+1}/${q.target.hp} →`:`${this.questionAction(q.target)} →`):this.data.hearts?'Try another question →':'Regroup with PIX →';next.focus({preventScroll:true});
    }
    finishQuestion() {
      if(this.state!==STATES.QUESTION||!this.question?.answered)return;const q=this.question;this.question=null;
      if(!q.correct){if(!this.data.hearts)this.gameOver();else this.continueTask(q.target);return;}
      const type=this.data.phase==='landing'?'activate':['activate',q.target.kind==='shielded'?'shield':'laser','repair','alien','boss'][this.data.round];
      this.runEffect(type,q.target,1.05,()=>{if(this.hits(q.target.id)<q.target.hp)this.continueTask(q.target);else if(q.target.kind==='repair'&&!this.done(q.target.id))this.startRepair(q.target);else this.afterTask();});
    }
    continueTask(ob) {this.startPlaying();this.interact(ob.id);}
    afterTask() {
      if(this.defs().every(t=>this.done(t.id))){this.roundComplete();return;}
      this.startPlaying();if(this.milestoneStory())return;
      if(this.data.round===4&&this.data.phase==='main')this.bossQuip();
    }
    milestoneStory() {
      const count=this.defs().filter(t=>this.done(t.id)).length,key=`${this.data.round}-${this.data.phase}-mid`;
      if((this.data.interludes||[]).includes(key))return false;
      let lines=null;
      if(this.data.round===0&&count>=3)lines=[['control','Mission Control','We’re reading your systems as they come online. Your launch window is ready when you are.'],['nova','Captain Nova','Nearly there. PIX, remind me to wave at Earth on the way up.']];
      else if(this.data.round===1&&count>=3)lines=[['nova','Captain Nova','Half the lane is clear. These rocks aren’t drifting the way they should.'],['pix','PIX','Agreed. I’m recording their motion for Earth. Keep clearing the path while I look for the cause.']];
      else if(this.data.round===2&&count>=2)lines=[['control','Mission Control','Your readings are improving, Nova. You’re handling this exactly right: one system at a time.'],['pix','PIX','And I’ve found a pattern in that pulse. Finish our repairs and we can follow it.']];
      else if(this.data.round===3&&this.wave()===2)lines=[['control','Mission Control','First patrol cleared. A second group is approaching from the Moon. Keep your shield facing them.'],['nova','Captain Nova','Copy. We’re protecting the Starling and keeping a way through.']];
      else if(this.data.round===4&&this.data.phase==='landing'&&count>=3)lines=[['nova','Captain Nova','The surface looks close enough to touch.'],['pix','PIX','Soon. Finish the landing checks first. We prefer footprints to ship-shaped dents.']];
      if(!lines)return false;this.data.interludes=this.data.interludes||[];this.data.interludes.push(key);this.persist();this.beginStory(lines,()=>this.startPlaying());return true;
    }
    startRepair(ob) {this.state=STATES.REPAIR;this.repair={target:ob,step:0};this.renderRepair();}
    renderRepair() {
      const r=this.repair;
      this.overlay(`<div class="modal-backdrop"><section class="panel repair-panel" role="dialog" aria-modal="true" aria-labelledby="repair-title"><p class="eyebrow">SAFETY CHECKS PASSED</p><h2 id="repair-title">Reconnect ${esc(r.target.label.toLowerCase())}</h2><p>Tap the numbered contacts in order. Follow the glowing connection.</p><div class="repair-circuit">${[0,1,2].map(i=>`<button class="contact ${i<r.step?'connected':i===r.step?'active':''}" data-contact="${i}" ${i!==r.step?'disabled':''} aria-label="Connect contact ${i+1}"><span>${i<r.step?'✓':i+1}</span><small>${['POWER','LINK','ONLINE'][i]}</small></button>`).join('<span class="circuit-wire" aria-hidden="true"></span>')}</div><p class="answer-feedback" role="status">${r.step?`Contact ${r.step} connected. Keep going!`:'PIX: “A little wiring. A lot less disco.”'}</p><button class="ghost" data-action="pause">Ⅱ Pause mission</button></section></div>`,'repair-overlay');
      document.querySelector('.contact.active')?.focus({preventScroll:true});
    }
    connect(index) {const r=this.repair;if(this.state!==STATES.REPAIR||!r||index!==r.step)return;this.audio.play('repair');r.step++;if(r.step===3){this.data.progress[r.target.id].fixed=true;this.persist();const ob=r.target;this.repair=null;this.renderer.burst(ob.x*9.6,ob.y*5.4,'#7bffd7');this.updateHUD();this.runEffect('repair',ob,.8,()=>this.afterTask());}else this.renderRepair();}
    runEffect(type,target,duration,next) {
      this.state=STATES.EFFECT;this.hideOverlay();this.setInert(true);this.effect={type,target,duration:this.renderer.reduced?Math.min(duration,.65):duration,elapsed:0,next,burst:false};
      this.audio.play({activate:'repair',boss:'laser',alien:'laser',laser:'laser',shield:'shield',repair:'repair',launch:'launch',landing:'landing',defeat:'defeat'}[type]||'click');
    }
    bossQuip() {
      const hits=TARGETS[4].reduce((n,t)=>n+this.hits(t.id),0);
      if(hits===3)this.beginStory([['glitch','Commander Glitch','My shield! That was a limited-edition shield!'],['pix','PIX','His weapons are exposed. Let’s make those decorative too.']],()=>this.startPlaying());
      if(hits===6)this.beginStory([['glitch','Commander Glitch','Who put the OFF switch on the OUTSIDE?'],['pix','PIX','The core is exposed. Three more charges will close the portal safely.']],()=>this.startPlaying());
    }
    roundComplete() {
      this.state=STATES.COMPLETE;this.data.checkpoint='complete';this.updateHUD();this.setInert(true);this.persist();
      const r=this.data.round,landing=this.data.phase==='landing';
      const copy=landing?['Ready for touchdown','The Starling is aligned, steady, and ready. Let’s touch down and restore the beacon.','Land on the Moon']:[['All systems are go','Fuel loaded. Navigation locked. Engines humming. Your Moon adventure starts now.','Begin countdown'],['A path through the stars','The last rock drifts safely past. But a strange purple signal is getting stronger…','Keep flying'],['The Starling is back','The cabin is bright and the air is fresh. Report to Earth, then follow the mysterious signal.','Follow the signal'],['Patrol cleared','Glitch’s drones are retreating. Their signal leads straight to the stolen beacon in lunar orbit.','Head for the Moon'],['Portal shutdown confirmed','Glitch’s weapons are quiet. One final burst will disconnect his portal and free the beacon.','Close the portal']][r];
      this.overlay(`<div class="modal-backdrop"><section class="panel completion-panel"><p class="eyebrow">${landing?'LANDING CHECKLIST COMPLETE':`CHAPTER 0${r+1} · OBJECTIVE COMPLETE`}</p><div class="success-emblem" aria-hidden="true">✓</div><h2>${copy[0]}</h2><p>${copy[1]}</p><button class="primary" data-action="round-next">${copy[2]} →</button></section></div>`,'complete-overlay');
    }
    advanceRound() {
      if(this.state!==STATES.COMPLETE)return;
      if(this.data.round===4&&this.data.phase==='landing'){this.runEffect('landing',null,3,()=>this.beginEnding());return;}
      if(this.data.round===4){this.runEffect('defeat',null,2,()=>this.beginTravel(4));return;}
      if(this.data.round===0)this.runEffect('launch',null,4.2,()=>this.beginTravel(0));else this.beginTravel(this.data.round);
    }
    beginEnding() {this.data.checkpoint='ending';this.persist();this.beginStory(ENDING,()=>this.victory());}
    victory() {
      this.state=STATES.VICTORY;this.data.checkpoint='victory';this.effect=null;this.persist();this.audio.play('victory');$('hud').hidden=true;$('scene-targets').innerHTML='';if($('mission-controls'))$('mission-controls').innerHTML='';
      this.renderer.burst(650,210,'#8bf5dc',50);this.renderer.burst(440,150,'#ffd78e',40);
      this.overlay(`<div class="victory-wrap"><section class="panel victory-panel"><p class="eyebrow">EARTH → MOON · SAFE AND SOUND</p><h2>MISSION<br><span>COMPLETE!</span></h2><p>You brought back the moonlight, Captain.<br>A universe of adventures is waiting for you.</p><div class="stats-grid"><div class="stat"><strong>${this.data.correct}</strong><span>CORRECT ANSWERS</span></div><div class="stat"><strong>${this.data.mistakes}</strong><span>MISTAKES</span></div><div class="stat"><strong>${this.formatTime(this.data.elapsed)}</strong><span>MISSION TIME</span></div></div><div class="button-row"><button class="primary" data-action="new">Play again →</button><button class="secondary" data-action="menu">Main menu</button></div></section></div>`,'victory-overlay');
    }
    gameOver() {
      this.state=STATES.OVER;this.data.checkpoint='failed';this.question=null;this.effect=null;this.persist();this.setInert(true);
      this.overlay(`<div class="modal-backdrop"><section class="panel"><p class="eyebrow">EVERY GREAT CAPTAIN TRIES AGAIN</p><img class="panel-mascot" src="assets/characters/pix.svg" alt="PIX"><h2>MISSION FAILED</h2><p>PIX: “Even stars need a second take. Let’s reset this chapter and give that clever brain another go.”</p><p class="small-note">You’ll get three fresh hearts. Earlier chapters stay complete, and questions you’ve seen stay in the flight log.</p><div class="button-row"><button class="primary" data-action="retry">Retry round →</button><button class="secondary" data-action="restart">Restart journey</button><button class="ghost" data-action="menu">Main menu</button></div></section></div>`,'gameover-overlay');
    }
    retry() {
      if(this.travel){this.beginTravel(this.travel.leg);return;}
      if(!this.data)return;this.data.hearts=3;this.data.progress={};this.data.checkpoint='intro';this.effect=null;this.question=null;this.repair=null;this.travel=null;delete this.data.travel;this.data.interludes=(this.data.interludes||[]).filter(id=>!id.startsWith(`${this.data.round}-`));
      // Round five includes BOTH boss and landing: retry resets the whole round.
      if(this.data.round===4)this.data.phase='main';this.sceneAge=0;this.persist();this.updateHUD();this.beginStory(INTRO[this.data.round],()=>this.startPlaying());
    }
    pause() {
      if(![STATES.PLAY,STATES.QUESTION,STATES.STORY,STATES.EFFECT,STATES.REPAIR,STATES.COMPLETE,STATES.TRAVEL].includes(this.state))return;
      this.stopAllSounds();
      this.previousState=this.state;this.state=STATES.PAUSE;this.persist();this.renderPause();
    }
    renderPause() {if(this.state!==STATES.PAUSE)return;this.overlay(`<div class="modal-backdrop"><section class="panel pause-panel"><p class="eyebrow">TAKE A BREATHER, CAPTAIN</p><h2>Space can wait.</h2><p>Your mission and question clock are paused.</p><div class="pause-actions"><button class="primary" data-action="resume">Resume mission →</button><button class="secondary" data-action="retry">${this.travel?'Restart flight leg':'Retry round'}</button><button class="secondary audio-menu-button" data-action="audio">Music & sound settings</button><button class="ghost" data-action="menu">Save & main menu</button></div></section></div>`,'pause-overlay');}
    resume() {
      if(this.state!==STATES.PAUSE)return;this.state=this.previousState;this.last=performance.now();
      if(this.state===STATES.QUESTION)this.renderQuestion();else if(this.state===STATES.STORY)this.renderStory();else if(this.state===STATES.REPAIR)this.renderRepair();else if(this.state===STATES.COMPLETE)this.roundComplete();else if(this.state===STATES.TRAVEL)this.renderTravel();else{this.hideOverlay();this.setInert(this.state!==STATES.PLAY);}
    }
    help() {
      if(!this.loaded||[STATES.HELP,STATES.ERROR].includes(this.state))return;
      if(this.state!==STATES.MENU&&this.state!==STATES.PAUSE){this.pause();if(this.state!==STATES.PAUSE)return;}
      this.helpReturn=this.state;this.state=STATES.HELP;
      this.overlay(`<div class="modal-backdrop"><section class="panel wide help-panel"><p class="eyebrow">YOUR FIRST FLIGHT, EXPLAINED</p><h2>Little answers. Big adventures.</h2><div class="help-steps"><p><b>01 · Aim with a tap.</b> Choose glowing systems, rocks, or alien ships in the scene.</p><p><b>02 · Think, then act.</b> Pick one of four answers within 30 seconds. Every correct answer powers a real action.</p><p><b>03 · Three hearts per chapter.</b> A wrong answer or timeout costs one heart. Three mistakes? Retry the chapter. New chapter, fresh hearts.</p><p><b>04 · Make it to the Moon.</b> Launch, dodge rocks, reconnect repairs, clear two drone waves, stop Glitch, then land.</p></div><p class="small-note">Use a mouse or touch. Pause anytime with Ⅱ or Escape. Your mission saves automatically in this browser. Questions never repeat during a journey.</p><button class="primary" data-action="close-help">Ready, Captain →</button></section></div>`,'help-overlay');
    }
    closeHelp() {if(this.state!==STATES.HELP)return;this.state=this.helpReturn;if(this.state===STATES.PAUSE)this.renderPause();else this.showMenu();}
    exhausted() {
      this.previousState=STATES.PLAY;this.state=STATES.PAUSE;this.persist();
      this.overlay(`<div class="modal-backdrop"><section class="panel"><p class="eyebrow">FLIGHT LOG FULL</p><h2>You explored every question.</h2><p>No questions will be repeated. Your progress is saved. Start a fresh journey to reset your question history, or add new questions to questions.json and reload to continue this mission.</p><button class="primary" data-action="restart">Start a fresh journey</button><button class="secondary" data-action="menu">Save & main menu</button></section></div>`,'pause-overlay');
    }
    persist() {if(this.data){this.save.write(this.data);this.saved=this.data;}}
    formatTime(seconds) {return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
    frame(now) {
      const dt=Math.min((now-(this.last||now))/1000,.1);this.last=now;
      const running=!document.hidden&&![STATES.MENU,STATES.PAUSE,STATES.HELP,STATES.ERROR,STATES.VICTORY,STATES.OVER,STATES.AUDIO].includes(this.state);
      const ambient=running&&[STATES.PLAY,STATES.EFFECT,STATES.STORY,STATES.TRAVEL].includes(this.state)&&this.data?(this.travel?(this.travel.leg>=3?'lunar':'asteroids'):this.data.round===4?'lunar':['launch','asteroids','cabin','combat'][this.data.round]):null;
      this.audio.setAmbience(ambient);
      this.audio.updateMusic(this.loaded&&!document.hidden&&![STATES.PAUSE,STATES.HELP,STATES.ERROR,STATES.OVER,STATES.AUDIO].includes(this.state),this.state===STATES.STORY||this.state===STATES.QUESTION);
      if(!document.hidden&&this.state===STATES.STORY)this.updateStory(dt);
      if(running&&this.data)this.data.elapsed+=dt;if(this.state===STATES.PLAY&&!document.hidden)this.sceneAge+=dt;
      if(!document.hidden&&this.state===STATES.QUESTION&&this.question&&!this.question.answered){const q=this.question;q.remaining=Math.max(0,q.remaining-dt);const label=$('timer-label');if(label){const sec=Math.ceil(q.remaining);if(label.textContent!==`${sec}s`)label.textContent=`${sec}s`;$('timer-fill').style.width=`${q.remaining/30*100}%`;$('timer-fill').classList.toggle('urgent',q.remaining<=8);}if(q.remaining<8&&!q.warning){q.warning=true;this.audio.play('warning');}if(q.remaining<=0)this.answer(-1);}
      if(!document.hidden&&this.state===STATES.EFFECT&&this.effect){const e=this.effect;e.elapsed+=dt;if(!e.burst&&e.elapsed/e.duration>.52&&e.target){e.burst=true;this.renderer.burst(e.target.x*9.6,e.target.y*5.4,['repair','activate'].includes(e.type)?'#7cf7cd':'#ffd08a');if(['laser','alien','boss'].includes(e.type))this.audio.play('explosion');}if(e.elapsed>=e.duration){this.effect=null;e.next();}}
      this.autosave+=dt;if(this.autosave>5){this.autosave=0;if(running)this.persist();}
      if(!document.hidden)this.renderer.draw(dt,(running&&this.state!==STATES.QUESTION)||this.state===STATES.MENU||this.state===STATES.VICTORY);
      requestAnimationFrame(t=>this.frame(t));
    }
  }
  const game=new Game();game.init();
})();
