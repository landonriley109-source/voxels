/*
Voxels v38 Audio Quick Fix
Original lightweight voxel sandbox using plain WebGL.
No external libraries, no copied Minecraft or Eaglercraft assets/code.
*/

"use strict";

const canvas = document.getElementById("game");
const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
if (!gl) {
  alert("WebGL is not supported on this browser/device.");
  throw new Error("WebGL unavailable");
}

const $ = id => document.getElementById(id);
const statsEl = $("stats"), hotbarEl = $("hotbar"), invEl = $("inventory"), invGridEl = $("inventoryGrid");
const settingsEl = $("settings"), menu = $("menu"), playBtn = $("playBtn"), loadBtn = $("loadBtn");
const createWorldMenu = $("createWorldMenu"), confirmCreateWorldBtn = $("confirmCreateWorldBtn"), cancelCreateWorldBtn = $("cancelCreateWorldBtn");
const worldsBtn = $("worldsBtn"), worldMenu = $("worldMenu"), worldList = $("worldList"), refreshWorldsBtn = $("refreshWorldsBtn"), closeWorldsBtn = $("closeWorldsBtn");
const menuSettingsBtn = $("menuSettingsBtn"), resumeBtn = $("resumeBtn"), saveSettingsBtn = $("saveSettingsBtn"), backToMenuBtn = $("backToMenuBtn");
const breakWrap = $("breakWrap"), breakBar = $("breakBar"), handEl = $("hand"), heldBlockEl = $("heldBlock");
const healthEl = $("health"), damageFlash = $("damageFlash"), vignetteEl = $("vignette");

const WORLD_X = 128, WORLD_Y = 60, WORLD_Z = 128;
const TEX_SIZE = 16;

const BLOCK = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, WOOD: 5, LEAF: 6,
  BRICK: 7, PLANKS: 8, GLASS: 9, COAL: 10, WATER: 11, COBBLE: 12, GOLD: 13,
  SNOW: 14, CLAY: 15, BASALT: 16, MOSS: 17, PILLAR_WOOD: 18, DARK_PLANKS: 19, GRASS_SIDE: 20
};

const BLOCKS = [
  null,
  { id:1, name:"Grass", solid:true, hardness:0.65 },
  { id:2, name:"Dirt", solid:true, hardness:0.45 },
  { id:3, name:"Stone", solid:true, hardness:1.45 },
  { id:4, name:"Sand", solid:true, hardness:0.38 },
  { id:5, name:"Wood", solid:true, hardness:1.05 },
  { id:6, name:"Leaf", solid:true, hardness:0.22 },
  { id:7, name:"Brick", solid:true, hardness:1.7 },
  { id:8, name:"Planks", solid:true, hardness:0.85 },
  { id:9, name:"Glass", solid:true, hardness:0.25 },
  { id:10, name:"Coal Ore", solid:true, hardness:1.9 },
  { id:11, name:"Water", solid:false, hardness:0.1 },
  { id:12, name:"Cobble", solid:true, hardness:1.25 },
  { id:13, name:"Gold Block", solid:true, hardness:2.3 },
  { id:14, name:"Snow", solid:true, hardness:0.28 },
  { id:15, name:"Clay", solid:true, hardness:0.7 },
  { id:16, name:"Basalt", solid:true, hardness:1.7 },
  { id:17, name:"Moss", solid:true, hardness:0.35 },
  { id:18, name:"Wood Pillar", solid:true, hardness:1.15 },
  { id:19, name:"Dark Planks", solid:true, hardness:0.9 },
  { id:20, name:"Grass Side", solid:true, hardness:0.65 }
];

let settings = {
  preset: "balanced",
  renderDistance: 512,
  resolutionScale: 135,
  motionBlur: false,
  motionBlurStrength: 45,
  fov: 75,
  brightness: 100,
  lightingContrast: 100,
  ambientLight: 100,
  fogDensity: 100,
  skyWarmth: 100,
  texturePack: "voxels",
  customTexturePackEnabled: false,
  texturePreset: "minecrafty",
  screenFilter: "none",
  textureContrast: 110,
  textureSaturation: 110,
  pixelSharpness: true,
  sound: true,
  soundVolume: 55,
  menuMusic: true,
  customWorldAudioEnabled: false,
  customMenuAudioEnabled: false,
  menuMusicVolume: 35,
  worldMusicVolume: 25,
  worldSong: "calm",
  worldMusic: false,
  menuSong: "calm",
  superGraphics: false,
  superShadows: true,
  superReflections: true,
  superBloom: true,
  superIntensity: 120,
  clouds: false,
  cloudAmount: 0,
  sunGlow: 100,
  sunBillboard: true,
  fog: true,
  smoothLighting: true,
  panorama: true,
  vignette: true,
  creative: false,
  uiStylePreset: "classic",
  profilePicture: "grass",
  profileUsername: "Player",
  autoStep: true,
  timeOfDay: 0.5,
  timeSpeed: 100,
  dayCycle: true,
  showSun: true,
  creativeSprintSpeed: 10,
  panoramaPreset: "classic",
  panoramaSpeed: 100,
  creativeBreakSpeed: 20,
  pendingWorldPreset: "default",
  worldPreset: "default",
  binds: {
    forward:"KeyW", back:"KeyS", left:"KeyA", right:"KeyD",
    jump:"Space", sprint:"KeyR", crouch:"ShiftLeft", fly:"KeyF",
    inventory:"KeyE", save:"KeyP", load:"KeyL"
  }
};

const presetValues = {
  performance: { renderDistance: 512, fog: true, smoothLighting: false, resolutionScale: 100 },
  balanced: { renderDistance: 2048, fog: true, smoothLighting: true, resolutionScale: 135 },
  quality: { renderDistance: 8000, fog: true, smoothLighting: true, resolutionScale: 175 }
};

let selectedSlot = 0;
let hotbar = [0,0,0,0,0,0,0,0,0];
let inventory = {};
for (let i=1; i<BLOCKS.length; i++) inventory[i] = 0;

let flying = false, inventoryOpen = false, settingsOpen = false, gameStarted = false;
let currentWorldName = "New World";
let dirtyMesh = true, vertexCount = 0;
const world = new Uint8Array(WORLD_X * WORLD_Y * WORLD_Z);

let mouseDown = false;
let breakTargetKey = null;
let breakProgress = 0;
let breakStage = 0;
let health = 20;
let lastGroundY = 0;

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function lerp(a,b,t){ return a + (b-a)*t; }
function normalize(v){ const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }
function cross(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy/2), nf = 1/(near-far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,(2*far*near)*nf,0]);
}
function mat4LookAt(eye, center, up) {
  const z = normalize([eye[0]-center[0], eye[1]-center[1], eye[2]-center[2]]);
  const x = normalize(cross(up,z));
  const y = cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}


/* Lightweight generated sound effects */

let audioCtx = null;
let lastStepSound = 0;

function ensureAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if(audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq=220, duration=0.08, type="square", volume=0.12, slide=0){
  if(!settings.sound) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if(slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide), now+duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume * (settings.soundVolume/100), now+0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now+duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now+duration+0.02);
}

function playNoise(duration=0.08, volume=0.12, filterFreq=600){
  if(!settings.sound) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++) data[i] = (Math.random()*2-1) * (1-i/bufferSize);
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFreq, now);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume * (settings.soundVolume/100), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now+duration);
  src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
  src.start(now);
  src.stop(now+duration+0.02);
}


/* Calm procedural menu music */

let menuMusicTimer = null;
let menuMusicStep = 0;


function songNotes(song){
  if(song==="bright") return [329.63,392.00,493.88,523.25,493.88,392.00,329.63,392.00];
  if(song==="mystic") return [220.00,261.63,329.63,392.00,329.63,293.66,246.94,261.63];
  if(song==="night") return [196.00,246.94,293.66,349.23,293.66,246.94,220.00,196.00];
  return [261.63,329.63,392.00,493.88,392.00,329.63,293.66,349.23];
}

let worldMusicTimer = null;
let worldMusicStep = 0;

function startWorldMusic(){
  if(playCustomWorldMusicIfPossible()) return;
  if(!settings.worldMusic || !gameStarted) return;
  try { ensureAudio(); } catch(e) { return; }
  if(worldMusicTimer) return;
  worldMusicTimer=setInterval(()=>{
    if(!gameStarted || !settings.worldMusic){
      stopWorldMusic();
      return;
    }
    const notes=songNotes(settings.worldSong || "calm");
    const n=notes[worldMusicStep % notes.length];
    const vol=0.045 * ((settings.worldMusicVolume ?? 25)/100);
    playTone(n,0.42,"sine",vol,0);
    if(worldMusicStep % 2 === 0) playTone(n/2,0.7,"sine",vol*0.45,0);
    worldMusicStep++;
  }, 840);
}

function stopWorldMusicProceduralOnly(){
  if(worldMusicTimer){
    clearInterval(worldMusicTimer);
    worldMusicTimer=null;
  }
}
function stopWorldMusic(){
  stopWorldMusicProceduralOnly();
  if(customWorldAudio) customWorldAudio.pause();
}

function updateWorldMusic(){
  if(settings.worldMusic && gameStarted) startWorldMusic();
  else stopWorldMusic();
}



const CUSTOM_MENU_AUDIO_KEY = "voxels-v38-menu-audio-name";
const CUSTOM_WORLD_AUDIO_KEY = "voxels-v38-world-audio-name";
let customMenuAudio = null;
let customWorldAudio = null;
let customMenuAudioUrl = null;
let customWorldAudioUrl = null;
let customMenuAudioName = "";
let customWorldAudioName = "";

// v38 quick fix:
// Use temporary object URLs instead of saving the full audio file in localStorage.
// This allows normal-size songs to play, but the player must reselect the file after refresh.
function setAudioStatus(){
  if($("menuAudioStatus")){
    $("menuAudioStatus").textContent = customMenuAudio
      ? "Custom menu music loaded for this session: " + customMenuAudioName
      : "No custom menu music loaded. Upload again after page reload.";
  }
  if($("worldAudioStatus")){
    $("worldAudioStatus").textContent = customWorldAudio
      ? "Custom world music loaded for this session: " + customWorldAudioName
      : "No custom world music loaded. Upload again after page reload.";
  }
}

function stopCustomAudio(){
  for(const a of [customMenuAudio, customWorldAudio]){
    if(a){
      try { a.pause(); a.currentTime=0; } catch(e){}
    }
  }
}

function updateCustomAudioVolumes(){
  if(customMenuAudio) customMenuAudio.volume = Math.min(1, Math.max(0, (settings.menuMusicVolume || 0) / 200));
  if(customWorldAudio) customWorldAudio.volume = Math.min(1, Math.max(0, (settings.worldMusicVolume || 0) / 200));
}

function makeLoopingAudioFromUrl(url, volume){
  const a = new Audio(url);
  a.loop = true;
  a.preload = "auto";
  a.volume = Math.min(1, Math.max(0, volume/200));
  return a;
}

async function loadCustomAudioStorage(){
  // v38 does not load stored audio data. It only remembers previous file names.
  try{
    customMenuAudioName = localStorage.getItem(CUSTOM_MENU_AUDIO_KEY) || "";
    customWorldAudioName = localStorage.getItem(CUSTOM_WORLD_AUDIO_KEY) || "";
    settings.customMenuAudioEnabled=false;
    settings.customWorldAudioEnabled=false;
    setAudioStatus();
  }catch(e){
    console.warn("Could not load custom audio names", e);
  }
}

async function applyCustomMenuAudio(){
  const input=$("customMenuAudioFile");
  if(!input || !input.files || input.files.length===0){
    alert("Choose an audio file first.");
    return;
  }
  const file=input.files[0];

  if(customMenuAudio){ customMenuAudio.pause(); customMenuAudio=null; }
  if(customMenuAudioUrl){ URL.revokeObjectURL(customMenuAudioUrl); customMenuAudioUrl=null; }

  customMenuAudioUrl = URL.createObjectURL(file);
  customMenuAudioName = file.name;
  customMenuAudio = makeLoopingAudioFromUrl(customMenuAudioUrl, settings.menuMusicVolume || 35);

  settings.customMenuAudioEnabled=true;
  settings.menuMusic=true;

  try{ localStorage.setItem(CUSTOM_MENU_AUDIO_KEY, customMenuAudioName); }catch(e){}
  setAudioStatus();
  updateMenuMusic();
}

async function applyCustomWorldAudio(){
  const input=$("customWorldAudioFile");
  if(!input || !input.files || input.files.length===0){
    alert("Choose an audio file first.");
    return;
  }
  const file=input.files[0];

  if(customWorldAudio){ customWorldAudio.pause(); customWorldAudio=null; }
  if(customWorldAudioUrl){ URL.revokeObjectURL(customWorldAudioUrl); customWorldAudioUrl=null; }

  customWorldAudioUrl = URL.createObjectURL(file);
  customWorldAudioName = file.name;
  customWorldAudio = makeLoopingAudioFromUrl(customWorldAudioUrl, settings.worldMusicVolume || 25);

  settings.customWorldAudioEnabled=true;
  settings.worldMusic=true;

  try{ localStorage.setItem(CUSTOM_WORLD_AUDIO_KEY, customWorldAudioName); }catch(e){}
  setAudioStatus();
  if(typeof updateWorldMusic==="function") updateWorldMusic();
}

function resetCustomMenuAudio(){
  localStorage.removeItem(CUSTOM_MENU_AUDIO_KEY);
  if(customMenuAudio){ customMenuAudio.pause(); customMenuAudio=null; }
  if(customMenuAudioUrl){ URL.revokeObjectURL(customMenuAudioUrl); customMenuAudioUrl=null; }
  customMenuAudioName="";
  settings.customMenuAudioEnabled=false;
  setAudioStatus();
  updateMenuMusic();
}

function resetCustomWorldAudio(){
  localStorage.removeItem(CUSTOM_WORLD_AUDIO_KEY);
  if(customWorldAudio){ customWorldAudio.pause(); customWorldAudio=null; }
  if(customWorldAudioUrl){ URL.revokeObjectURL(customWorldAudioUrl); customWorldAudioUrl=null; }
  customWorldAudioName="";
  settings.customWorldAudioEnabled=false;
  setAudioStatus();
  if(typeof updateWorldMusic==="function") updateWorldMusic();
}

function playCustomMenuMusicIfPossible(){
  if(!settings.menuMusic || gameStarted || !settings.customMenuAudioEnabled || !customMenuAudio) return false;
  stopMenuMusicProceduralOnly();
  stopCustomAudio();
  updateCustomAudioVolumes();
  customMenuAudio.play().catch(()=>{});
  return true;
}

function playCustomWorldMusicIfPossible(){
  if(!settings.worldMusic || !gameStarted || !settings.customWorldAudioEnabled || !customWorldAudio) return false;
  if(typeof stopWorldMusicProceduralOnly==="function") stopWorldMusicProceduralOnly();
  stopCustomAudio();
  updateCustomAudioVolumes();
  customWorldAudio.play().catch(()=>{});
  return true;
}

function startMenuMusic(){
  if(playCustomMenuMusicIfPossible()) return;
  if(!settings.menuMusic || gameStarted) return;
  try { ensureAudio(); } catch(e) { return; }
  if(menuMusicTimer) return;
  const notes=songNotes(settings.menuSong || "calm");
  menuMusicTimer=setInterval(()=>{
    if(gameStarted || !settings.menuMusic){
      stopMenuMusic();
      return;
    }
    const n=notes[menuMusicStep % notes.length];
    const vol=0.045 * (settings.menuMusicVolume/100);
    playTone(n,0.42,"sine",vol,0);
    if(menuMusicStep % 2 === 0) playTone(n/2,0.7,"sine",vol*0.55,0);
    menuMusicStep++;
  }, 720);
}

function stopMenuMusicProceduralOnly(){
  if(menuMusicTimer){
    clearInterval(menuMusicTimer);
    menuMusicTimer=null;
  }
}
function stopMenuMusic(){
  stopMenuMusicProceduralOnly();
  if(customMenuAudio) customMenuAudio.pause();
}

function updateMenuMusic(){
  if(settings.menuMusic && !gameStarted) startMenuMusic();
  else stopMenuMusic();
}

function sound(name){
  if(name==="step") playNoise(0.045,0.055,900);
  if(name==="break") { playNoise(0.12,0.16,520); playTone(110,0.05,"square",0.05,-40); }
  if(name==="place") { playTone(180,0.055,"square",0.10,-35); playNoise(0.035,0.06,750); }
  if(name==="fall") { playTone(90,0.18,"sawtooth",0.14,-45); playNoise(0.16,0.13,360); }
  if(name==="die") { playTone(170,0.32,"sawtooth",0.16,-120); setTimeout(()=>playNoise(0.22,0.12,300),90); }
}

/* Texture generation */

const atlasCanvas = document.createElement("canvas");
atlasCanvas.width = TEX_SIZE * BLOCKS.length;
atlasCanvas.height = TEX_SIZE;
const actx = atlasCanvas.getContext("2d");
actx.imageSmoothingEnabled = false;

function rect(x,y,w,h,c){ actx.fillStyle=c; actx.fillRect(x,y,w,h); }
function rnd(min,max){ return Math.floor(min+Math.random()*(max-min+1)); }
function shadeHex(r,g,b,a=1){ return `rgba(${clamp(r,0,255)|0},${clamp(g,0,255)|0},${clamp(b,0,255)|0},${a})`; }
function noiseColor(base, spread=18){ return shadeHex(base[0]+rnd(-spread,spread), base[1]+rnd(-spread,spread), base[2]+rnd(-spread,spread), base[3] ?? 1); }
function drawBase(id, fn){ const ox=id*TEX_SIZE; for(let y=0;y<TEX_SIZE;y++) for(let x=0;x<TEX_SIZE;x++) rect(ox+x,y,1,1,fn(x,y)); }
function drawOutline(ox, light="rgba(255,255,255,0.22)", dark="rgba(0,0,0,0.32)"){
  rect(ox,0,TEX_SIZE,1,light); rect(ox,0,1,TEX_SIZE,light);
  rect(ox,TEX_SIZE-1,TEX_SIZE,1,dark); rect(ox+TEX_SIZE-1,0,1,TEX_SIZE,dark);
}
function scatter(ox,count,c,w=1,h=1){ for(let i=0;i<count;i++) rect(ox+rnd(0,15),rnd(0,15),w,h,c); }
function vein(ox, count, color){
  for(let i=0;i<count;i++){
    let x=rnd(1,14), y=rnd(1,14);
    for(let j=0;j<rnd(2,5);j++){
      rect(ox+clamp(x,0,15),clamp(y,0,15),1,1,color);
      x += rnd(-1,1); y += rnd(-1,1);
    }
  }
}


function packColor(type, fallback){
  const pack=settings.texturePack || "voxels";
  const map={
    voxels:{},
    crafty:{
      grass:[82,158,63], grassSide:[94,132,58], dirt:[126,87,55], stone:[124,124,124], cobble:[91,91,91],
      sand:[216,204,158], wood:[112,78,39], pillarWood:[112,78,39], planks:[164,125,72], leaf:[58,126,49],
      brick:[145,67,55], glass:[128,205,230], coal:[54,54,58], gold:[237,181,43], snow:[230,240,245],
      clay:[116,132,138], basalt:[55,58,65], moss:[63,112,55], darkPlanks:[82,48,28]
    },
    smooth:{
      grass:[88,184,84], grassSide:[100,152,70], dirt:[150,105,70], stone:[150,154,158], cobble:[130,132,134],
      sand:[235,220,168], wood:[148,98,50], pillarWood:[148,98,50], planks:[194,150,88], leaf:[86,158,76],
      brick:[172,88,76], glass:[150,225,245], coal:[70,70,78], gold:[250,205,70], snow:[245,250,255],
      clay:[142,156,164], basalt:[76,80,90], moss:[84,142,72], darkPlanks:[102,62,38]
    },
    medieval:{
      grass:[70,112,54], grassSide:[86,102,52], dirt:[92,66,47], stone:[96,98,102], cobble:[78,78,82],
      sand:[172,156,116], wood:[92,56,30], pillarWood:[92,56,30], planks:[124,82,48], leaf:[42,85,42],
      brick:[112,50,45], glass:[100,150,165], coal:[36,34,35], gold:[190,136,32], snow:[190,198,205],
      clay:[94,104,112], basalt:[36,38,44], moss:[45,78,42], darkPlanks:[52,30,20]
    },
    neon:{
      grass:[55,240,90], grassSide:[50,210,100], dirt:[120,70,255], stone:[95,105,140], cobble:[75,80,110],
      sand:[255,230,90], wood:[255,120,40], pillarWood:[255,120,40], planks:[240,150,60], leaf:[40,255,140],
      brick:[255,60,90], glass:[70,240,255], coal:[25,25,45], gold:[255,220,30], snow:[230,255,255],
      clay:[95,180,220], basalt:[30,35,70], moss:[50,230,130], darkPlanks:[85,30,95]
    }
  };
  return (map[pack] && map[pack][type]) ? map[pack][type] : fallback;
}

function drawCheckers(ox, c1, c2, size=4){
  for(let y=0;y<TEX_SIZE;y++){
    for(let x=0;x<TEX_SIZE;x++){
      const use=((Math.floor(x/size)+Math.floor(y/size))%2)===0;
      rect(ox+x,y,1,1,shadeHex(...(use?c1:c2)));
    }
  }
}


const CUSTOM_TEXTURE_STORAGE_KEY = "voxels-v36-custom-textures";
let customTextureImages = {};
let pendingTextureFiles = [];

const TEXTURE_FILE_TO_BLOCK = {
  "grass":1, "grass_block":1,
  "dirt":2,
  "stone":3,
  "sand":4,
  "wood":5, "log":5,
  "leaf":6, "leaves":6,
  "brick":7, "bricks":7,
  "planks":8, "wood_planks":8,
  "glass":9,
  "coal":10, "coal_ore":10,
  "water":11,
  "cobble":12, "cobblestone":12,
  "gold":13, "gold_block":13,
  "snow":14,
  "clay":15,
  "basalt":16,
  "moss":17,
  "pillarwood":18, "pillar_wood":18,
  "darkplanks":19, "dark_planks":19,
  "grassside":20, "grass_side":20
};

function cleanTextureName(path){
  const file = String(path).split("/").pop().split("\\").pop().toLowerCase();
  return file.replace(".png","").replace(/[^a-z0-9_]/g,"_");
}

function dataUrlToImage(dataUrl){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload=()=>resolve(img);
    img.onerror=reject;
    img.src=dataUrl;
  });
}

async function loadCustomTextureStorage(){
  try{
    const raw=localStorage.getItem(CUSTOM_TEXTURE_STORAGE_KEY);
    if(!raw) return;
    const saved=JSON.parse(raw);
    customTextureImages={};
    for(const key of Object.keys(saved)){
      customTextureImages[key]=await dataUrlToImage(saved[key]);
    }
    settings.customTexturePackEnabled=Object.keys(customTextureImages).length>0;
  }catch(e){
    console.warn("Could not load custom texture pack", e);
  }
}

function saveCustomTextureStorage(dataUrls){
  try{
    localStorage.setItem(CUSTOM_TEXTURE_STORAGE_KEY, JSON.stringify(dataUrls));
  }catch(e){
    alert("Texture pack was too large to save locally. It may still apply until refresh.");
  }
}

function setTexturePackStatus(msg){
  const el=$("texturePackStatus");
  if(el) el.textContent=msg;
}

async function readPngFileAsDataUrl(file){
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

async function importLoosePngFiles(files){
  const dataUrls={};
  for(const file of files){
    const name=cleanTextureName(file.name);
    if(!TEXTURE_FILE_TO_BLOCK[name]) continue;
    dataUrls[name]=await readPngFileAsDataUrl(file);
  }
  return dataUrls;
}

async function importZipTexturePack(file){
  if(typeof JSZip==="undefined"){
    alert("ZIP import needs JSZip. If you opened this file offline, use loose PNG uploads or host the game online.");
    return {};
  }
  const zip = await JSZip.loadAsync(file);
  const dataUrls={};
  const names=Object.keys(zip.files);
  for(const path of names){
    const entry=zip.files[path];
    if(entry.dir || !path.toLowerCase().endsWith(".png")) continue;
    const name=cleanTextureName(path);
    if(!TEXTURE_FILE_TO_BLOCK[name]) continue;
    const blob=await entry.async("blob");
    const pngFile=new File([blob], name+".png", {type:"image/png"});
    dataUrls[name]=await readPngFileAsDataUrl(pngFile);
  }
  return dataUrls;
}

async function applyImportedTexturePack(){
  const input=$("texturePackFile");
  if(!input || !input.files || input.files.length===0){
    alert("Choose a ZIP or PNG texture first.");
    return;
  }

  let dataUrls={};
  const files=[...input.files];

  for(const file of files){
    if(file.name.toLowerCase().endsWith(".zip")){
      const fromZip=await importZipTexturePack(file);
      dataUrls={...dataUrls, ...fromZip};
    } else if(file.type==="image/png" || file.name.toLowerCase().endsWith(".png")){
      const fromPng=await importLoosePngFiles([file]);
      dataUrls={...dataUrls, ...fromPng};
    }
  }

  const keys=Object.keys(dataUrls);
  if(keys.length===0){
    alert("No recognized block textures found. Use names like grass.png, dirt.png, stone.png, cobble.png, planks.png, or wood.png.");
    return;
  }

  customTextureImages={};
  for(const key of keys){
    customTextureImages[key]=await dataUrlToImage(dataUrls[key]);
  }

  settings.customTexturePackEnabled=true;
  settings.texturePack="custom";
  saveCustomTextureStorage(dataUrls);
  rebuildBlockTextures();
  renderSettings();
  setTexturePackStatus("Custom pack loaded: " + keys.join(", "));
}

function resetImportedTexturePack(){
  customTextureImages={};
  settings.customTexturePackEnabled=false;
  if(settings.texturePack==="custom") settings.texturePack="voxels";
  localStorage.removeItem(CUSTOM_TEXTURE_STORAGE_KEY);
  rebuildBlockTextures();
  renderSettings();
  setTexturePackStatus("Custom texture pack removed.");
}

function drawCustomTextureIfAvailable(id,type){
  if(!settings.customTexturePackEnabled) return false;
  const aliases = {
    grass:["grass","grass_block"],
    grassSide:["grass_side","grassside"],
    dirt:["dirt"],
    stone:["stone"],
    sand:["sand"],
    wood:["wood","log"],
    leaf:["leaf","leaves"],
    brick:["brick","bricks"],
    planks:["planks","wood_planks"],
    glass:["glass"],
    coal:["coal","coal_ore"],
    water:["water"],
    cobble:["cobble","cobblestone"],
    gold:["gold","gold_block"],
    snow:["snow"],
    clay:["clay"],
    basalt:["basalt"],
    moss:["moss"],
    pillarWood:["pillar_wood","pillarwood"],
    darkPlanks:["dark_planks","darkplanks"]
  };
  const list=aliases[type] || [type.toLowerCase()];
  let img=null;
  for(const key of list){
    if(customTextureImages[key]){ img=customTextureImages[key]; break; }
  }
  if(!img) return false;
  const ox=id*TEX_SIZE;
  actx.clearRect(ox,0,TEX_SIZE,TEX_SIZE);
  actx.imageSmoothingEnabled=false;
  actx.drawImage(img, ox, 0, TEX_SIZE, TEX_SIZE);
  drawOutline(ox, "rgba(255,255,255,0.16)", "rgba(0,0,0,0.28)");
  return true;
}

function drawPackTexture(id,type){
  const pack=settings.texturePack || "voxels";
  if(pack==="voxels") return false;
  const ox=id*TEX_SIZE;
  const base=packColor(type,[128,128,128]);

  function px(x,y,c){ rect(ox+x,y,1,1,shadeHex(c[0],c[1],c[2],c[3]??1)); }
  function fill(c){ rect(ox,0,TEX_SIZE,TEX_SIZE,shadeHex(c[0],c[1],c[2],c[3]??1)); }
  function lineH(y,c){ rect(ox,y,TEX_SIZE,1,shadeHex(c[0],c[1],c[2],c[3]??1)); }
  function lineV(x,c){ rect(ox+x,0,1,TEX_SIZE,shadeHex(c[0],c[1],c[2],c[3]??1)); }

  if(pack==="smooth"){
    fill(base);
    rect(ox+1,1,14,1,"rgba(255,255,255,0.18)");
    rect(ox+1,1,1,14,"rgba(255,255,255,0.12)");
    rect(ox+1,14,14,1,"rgba(0,0,0,0.22)");
    rect(ox+14,1,1,14,"rgba(0,0,0,0.18)");
    if(type==="glass"){
      fill([120,210,235,0.45]);
      rect(ox+3,3,3,10,"rgba(255,255,255,0.35)");
      rect(ox+8,2,2,12,"rgba(255,255,255,0.18)");
    }
    drawOutline(ox);
    return true;
  }

  if(pack==="crafty"){
    if(type==="grass"){
      drawCheckers(ox,[72,145,54],[94,170,66],4);
      scatter(ox,16,"rgba(30,95,25,0.22)");
    } else if(type==="grassSide"){
      for(let y=0;y<16;y++) for(let x=0;x<16;x++) rect(ox+x,y,1,1,noiseColor(packColor("dirt",[126,87,55]),16));
      for(let y=0;y<5;y++) for(let x=0;x<16;x++) rect(ox+x,y,1,1,noiseColor(packColor("grass",[82,158,63]),16));
      for(let x=0;x<16;x+=2) rect(ox+x,4,1,rnd(1,4),"rgba(40,100,30,0.35)");
    } else if(["stone","cobble","basalt"].includes(type)){
      fill(base); 
      for(let i=0;i<18;i++) rect(ox+rnd(0,14),rnd(0,14),rnd(1,3),1,"rgba(0,0,0,0.18)");
      if(type==="cobble") for(let y=3;y<16;y+=5) lineH(y,"rgba(30,30,30,0.30)");
    } else if(["wood","pillarWood"].includes(type)){
      fill(base);
      for(let x=2;x<16;x+=4) lineV(x,"rgba(40,20,8,0.35)");
      for(let y=2;y<16;y+=5) rect(ox+rnd(0,10),y,rnd(3,6),1,"rgba(255,220,130,0.16)");
    } else if(["planks","darkPlanks"].includes(type)){
      fill(base);
      for(let y=0;y<16;y+=4) lineH(y,"rgba(40,20,8,0.45)");
      for(let x=6;x<16;x+=7) lineV(x,"rgba(30,15,5,0.35)");
    } else {
      fill(base);
      scatter(ox,22,"rgba(0,0,0,0.16)");
      scatter(ox,12,"rgba(255,255,255,0.13)");
    }
    drawOutline(ox);
    return true;
  }

  if(pack==="medieval"){
    fill(base);
    if(["stone","cobble","brick","basalt"].includes(type)){
      for(let y=0;y<16;y+=4) lineH(y,"rgba(0,0,0,0.35)");
      for(let y=2;y<16;y+=4) for(let x=(y%8===2?0:5);x<16;x+=8) rect(ox+x,y,1,4,"rgba(0,0,0,0.28)");
      scatter(ox,20,"rgba(255,255,255,0.08)");
    } else if(["wood","pillarWood","planks","darkPlanks"].includes(type)){
      for(let x=1;x<16;x+=3) lineV(x,"rgba(20,10,5,0.35)");
      for(let y=3;y<16;y+=6) rect(ox+2,y,12,1,"rgba(255,210,120,0.10)");
    } else if(type==="grass" || type==="leaf" || type==="moss"){
      scatter(ox,35,"rgba(0,0,0,0.20)");
      scatter(ox,12,"rgba(160,220,110,0.10)");
    } else {
      scatter(ox,25,"rgba(0,0,0,0.18)");
    }
    drawOutline(ox,"rgba(255,255,255,0.12)","rgba(0,0,0,0.48)");
    return true;
  }

  if(pack==="neon"){
    fill(base);
    rect(ox+1,1,14,1,"rgba(255,255,255,0.35)");
    rect(ox+1,14,14,1,"rgba(0,0,0,0.35)");
    for(let i=0;i<6;i++) rect(ox+rnd(1,14),rnd(1,14),1,1,"rgba(255,255,255,0.7)");
    if(type==="glass" || type==="gold" || type==="coal"){
      rect(ox+3,3,10,10,"rgba(255,255,255,0.12)");
      rect(ox+5,5,6,6,"rgba(255,255,255,0.16)");
    }
    drawOutline(ox,"rgba(255,255,255,0.38)","rgba(0,0,0,0.42)");
    return true;
  }

  return false;
}

function drawTexture(id,type){
  const ox=id*TEX_SIZE;
  if(drawCustomTextureIfAvailable(id,type)) return;
  if(drawPackTexture(id,type)) return;
  if(type==="grass"){
    drawBase(id,(x,y)=> noiseColor([56,172,62], 24));
    for(let x=0;x<TEX_SIZE;x++) rect(ox+x, rnd(0,5), 1, rnd(3,9), `rgba(${rnd(105,160)},${rnd(200,250)},${rnd(75,130)},0.26)`);
    scatter(ox,24,"rgba(15,80,25,0.25)");
    vein(ox,7,"rgba(190,255,140,0.13)");
    drawOutline(ox);
  }
  if(type==="grassSide"){
    // Dirt body with a clear green grass layer across the top edge of the side face.
    drawBase(id,()=> noiseColor([104,68,38], 22));
    for(let y=0;y<5;y++){
      for(let x=0;x<TEX_SIZE;x++){
        const edge = y===4 ? rnd(0,1) : 0;
        rect(ox+x,y+edge,1,1, noiseColor([55,165,58], 24));
      }
    }
    for(let x=0;x<TEX_SIZE;x++) rect(ox+x, rnd(0,3), 1, rnd(2,5), `rgba(${rnd(95,160)},${rnd(200,250)},${rnd(70,130)},0.26)`);
    scatter(ox,16,"rgba(45,28,16,0.22)");
    scatter(ox,12,"rgba(175,120,72,0.13)");
    drawOutline(ox);
  }

  if(type==="dirt"){
    drawBase(id,()=> noiseColor([104,68,38], 23));
    scatter(ox,34,"rgba(45,28,16,0.25)");
    scatter(ox,24,"rgba(175,120,72,0.17)");
    vein(ox,5,"rgba(55,35,20,0.24)");
    drawOutline(ox);
  }
  if(type==="stone"){
    drawBase(id,()=> noiseColor([126,132,137], 24));
    vein(ox,10,"rgba(255,255,255,0.11)");
    vein(ox,9,"rgba(0,0,0,0.18)");
    scatter(ox,14,"rgba(190,200,205,0.12)");
    drawOutline(ox);
  }
  if(type==="sand"){
    drawBase(id,()=> noiseColor([211,194,130], 20));
    scatter(ox,42,"rgba(125,95,45,0.17)");
    scatter(ox,28,"rgba(255,242,188,0.19)");
    drawOutline(ox);
  }
  if(type==="wood"){
    for(let x=0;x<TEX_SIZE;x++) rect(ox+x,0,1,TEX_SIZE, noiseColor([122,73,32], 17));
    for(let x=2;x<TEX_SIZE;x+=4) rect(ox+x,0,1,TEX_SIZE,"rgba(50,25,10,0.46)");
    for(let y=2;y<TEX_SIZE;y+=5) rect(ox,y,TEX_SIZE,1,"rgba(230,170,95,0.14)");
    vein(ox,6,"rgba(255,190,110,0.12)");
    drawOutline(ox);
  }
  if(type==="leaf"){
    drawBase(id,()=> noiseColor([43,137,52], 26));
    for(let i=0;i<28;i++) rect(ox+rnd(0,15),rnd(0,15),rnd(1,3),1,"rgba(15,70,20,0.37)");
    for(let i=0;i<18;i++) rect(ox+rnd(0,15),rnd(0,15),1,1,"rgba(130,230,105,0.20)");
    drawOutline(ox);
  }
  if(type==="brick"){
    rect(ox,0,TEX_SIZE,TEX_SIZE,"#8d3d32");
    for(let y=4;y<TEX_SIZE;y+=5) rect(ox,y,TEX_SIZE,1,"#2f201e");
    for(let y=0;y<TEX_SIZE;y+=10){ rect(ox+7,y,1,5,"#2f201e"); rect(ox+1,y+5,1,5,"#2f201e"); }
    scatter(ox,20,"rgba(255,150,120,0.14)");
    scatter(ox,14,"rgba(40,10,10,0.22)");
    drawOutline(ox);
  }
  if(type==="planks"){
    rect(ox,0,TEX_SIZE,TEX_SIZE,"#a16e37");
    for(let y=0;y<TEX_SIZE;y+=5){ rect(ox,y,TEX_SIZE,1,"rgba(60,35,15,0.68)"); rect(ox,y+1,TEX_SIZE,1,"rgba(255,215,145,0.10)"); }
    for(let x=7;x<TEX_SIZE;x+=8) rect(ox+x,0,1,TEX_SIZE,"rgba(45,24,8,0.48)");
    vein(ox,7,"rgba(255,230,170,0.17)");
    drawOutline(ox);
  }
  if(type==="glass"){
    drawBase(id,()=>`rgba(${rnd(135,175)},${rnd(205,240)},${rnd(228,255)},0.58)`);
    rect(ox+1,1,14,1,"rgba(255,255,255,0.75)");
    rect(ox+1,1,1,14,"rgba(255,255,255,0.50)");
    rect(ox+11,3,1,10,"rgba(255,255,255,0.30)");
    rect(ox+3,12,10,1,"rgba(60,120,170,0.27)");
  }
  if(type==="coal"){
    drawTexture(id,"stone");
    vein(ox,14,"#0e0e0e");
    scatter(ox,12,"rgba(45,45,45,0.65)",2,1);
  }
  if(type==="water"){
    drawBase(id,()=> shadeHex(38+rnd(-8,8),116+rnd(-18,18),205+rnd(-24,24),1));
    for(let y=2;y<TEX_SIZE;y+=4) rect(ox,y,TEX_SIZE,1,"rgba(255,255,255,0.23)");
    for(let x=0;x<TEX_SIZE;x+=5) rect(ox+x,rnd(0,15),rnd(2,4),1,"rgba(105,190,255,0.22)");
  }
  if(type==="cobble"){
    drawBase(id,()=> noiseColor([105,112,118], 24));
    for(const y of [3,8,13]) rect(ox,y,TEX_SIZE,1,"rgba(30,35,40,0.58)");
    for(let x=3;x<TEX_SIZE;x+=5) rect(ox+x,0,1,TEX_SIZE,"rgba(30,35,40,0.48)");
    scatter(ox,16,"rgba(255,255,255,0.12)");
    drawOutline(ox);
  }
  if(type==="gold"){
    drawBase(id,()=> noiseColor([234,178,48], 24));
    rect(ox,0,TEX_SIZE,2,"rgba(255,255,255,0.22)");
    rect(ox+2,2,6,2,"rgba(255,255,210,0.30)");
    rect(ox,TEX_SIZE-2,TEX_SIZE,2,"rgba(90,50,0,0.28)");
    vein(ox,5,"rgba(255,255,220,0.18)");
    drawOutline(ox,"rgba(255,255,220,0.30)","rgba(80,45,0,0.34)");
  }
  if(type==="snow"){
    drawBase(id,()=> noiseColor([238,246,252], 14));
    scatter(ox,18,"rgba(130,160,190,0.18)");
    scatter(ox,18,"rgba(255,255,255,0.38)");
    drawOutline(ox,"rgba(255,255,255,0.38)","rgba(105,130,150,0.24)");
  }
  if(type==="clay"){
    drawBase(id,()=> noiseColor([140,154,169], 20));
    vein(ox,8,"rgba(55,65,75,0.16)");
    scatter(ox,14,"rgba(220,230,240,0.13)");
    drawOutline(ox);
  }
  if(type==="basalt"){
    drawBase(id,()=> noiseColor([58,64,72], 17));
    for(let y=1;y<TEX_SIZE;y+=4) rect(ox,y,TEX_SIZE,1,"rgba(10,14,18,0.40)");
    for(let i=0;i<13;i++) rect(ox+rnd(0,15),rnd(0,15),1,rnd(2,5),"rgba(160,170,180,0.09)");
    drawOutline(ox,"rgba(180,190,200,0.13)","rgba(0,0,0,0.35)");
  }
  if(type==="moss"){
    drawBase(id,()=> noiseColor([60,122,55], 22));
    for(let i=0;i<28;i++) rect(ox+rnd(0,15),rnd(0,15),rnd(1,3),1,"rgba(20,70,25,0.34)");
    scatter(ox,14,"rgba(150,215,120,0.20)");
    drawOutline(ox);
  }
  if(type==="pillarWood"){
    rect(ox,0,TEX_SIZE,TEX_SIZE,"#855326");
    for(let x=1;x<TEX_SIZE;x+=3) rect(ox+x,0,1,TEX_SIZE,"rgba(45,22,8,0.40)");
    rect(ox+2,1,12,2,"rgba(255,210,140,0.18)");
    rect(ox+2,13,12,2,"rgba(45,20,5,0.38)");
    for(let y=4;y<TEX_SIZE;y+=5) rect(ox,y,TEX_SIZE,1,"rgba(240,170,90,0.17)");
    drawOutline(ox);
  }
  if(type==="darkPlanks"){
    rect(ox,0,TEX_SIZE,TEX_SIZE,"#4d2c18");
    for(let y=0;y<TEX_SIZE;y+=5) rect(ox,y,TEX_SIZE,1,"rgba(20,10,5,0.78)");
    for(let x=7;x<TEX_SIZE;x+=8) rect(ox+x,0,1,TEX_SIZE,"rgba(10,5,2,0.52)");
    scatter(ox,12,"rgba(190,120,65,0.13)");
    drawOutline(ox);
  }
}

["","grass","dirt","stone","sand","wood","leaf","brick","planks","glass","coal","water","cobble","gold","snow","clay","basalt","moss","pillarWood","darkPlanks","grassSide"].forEach((t,i)=>{ if(i) drawTexture(i,t); });

/* Crack overlay texture atlas */
const crackCanvas = document.createElement("canvas");
crackCanvas.width = TEX_SIZE * 6;
crackCanvas.height = TEX_SIZE;
const cctx = crackCanvas.getContext("2d");
cctx.imageSmoothingEnabled = false;
for(let s=0;s<6;s++){
  const ox=s*TEX_SIZE;
  cctx.clearRect(ox,0,TEX_SIZE,TEX_SIZE);
  cctx.strokeStyle=`rgba(0,0,0,${0.35+s*0.09})`;
  cctx.lineWidth=1;
  const lines=3+s*3;
  for(let i=0;i<lines;i++){
    cctx.beginPath();
    let x=ox+rnd(2,14), y=rnd(2,14);
    cctx.moveTo(x,y);
    for(let j=0;j<2+s/2;j++){
      x += rnd(-3,3); y += rnd(-3,3);
      cctx.lineTo(clamp(x,ox+1,ox+15), clamp(y,1,15));
    }
    cctx.stroke();
  }
}

function makeTexture(canvas){
  const tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return tex;
}
const atlas = makeTexture(atlasCanvas);
const crackTex = makeTexture(crackCanvas);

/* WebGL programs */

const vs = `
attribute vec3 aPos;
attribute vec2 aUV;
attribute float aShade;
uniform mat4 uProj;
uniform mat4 uView;
varying vec2 vUV;
varying float vShade;
varying float vFog;
void main() {
  vec4 p = uView * vec4(aPos, 1.0);
  gl_Position = uProj * p;
  vUV = aUV;
  vShade = aShade;
  vFog = clamp((-p.z - 10.0) / 78.0, 0.0, 1.0);
}`;
const fs = `
precision mediump float;
varying vec2 vUV;
varying float vShade;
varying float vFog;
uniform sampler2D uAtlas;
uniform vec3 uSky;
uniform float uFogEnabled;
uniform float uBrightness;
uniform float uContrast;
uniform float uFogDensity;
uniform float uTextureContrast;
uniform float uTextureSaturation;
uniform float uSuperShadows;
uniform float uSuperReflections;
uniform float uSuperBloom;
uniform float uSuperIntensity;
uniform vec3 uSunDir;
void main() {
  vec4 tex = texture2D(uAtlas, vUV);
  if (tex.a < 0.12) discard;
  float shade = mix(1.0, vShade, uContrast);
  vec3 base = tex.rgb;
  float gray = dot(base, vec3(0.299, 0.587, 0.114));
  base = mix(vec3(gray), base, uTextureSaturation);
  base = (base - 0.5) * uTextureContrast + 0.5;
  // Sun-position shadow approximation. It is not real ray tracing, but faces
  // pointed away from the fixed sun direction get darker in Super mode.
  float sunFacing = clamp(dot(normalize(vec3(vShade - 0.5, vShade, 1.0 - vShade)), normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
  float sunShadow = mix(1.0, mix(0.58, 1.18, sunFacing), uSuperShadows * uSuperIntensity);
  float shadowBoost = mix(1.0, smoothstep(0.18, 1.15, shade), uSuperShadows * 0.18 * uSuperIntensity) * sunShadow;
  vec3 lit = base * shade * shadowBoost * uBrightness;
  float shine = max(max(base.r, base.g), base.b);
  lit += vec3(shine * (0.06 + sunFacing*0.10)) * uSuperReflections * uSuperIntensity;
  lit += vec3(max(0.0, shine - 0.72) * 0.18) * uSuperBloom * uSuperIntensity;
  float fog = clamp(vFog * uFogDensity, 0.0, 1.0) * uFogEnabled;
  gl_FragColor = vec4(mix(lit, uSky, fog), tex.a);
}`;
const crackFs = `
precision mediump float;
varying vec2 vUV;
uniform sampler2D uAtlas;
void main() {
  vec4 tex = texture2D(uAtlas, vUV);
  if (tex.a < 0.08) discard;
  gl_FragColor = tex;
}`;

function compile(type, src) {
  const s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function makeProgram(frag){
  const p=gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER,vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER,frag));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
const program=makeProgram(fs);
const crackProgram=makeProgram(crackFs);

const posLoc=gl.getAttribLocation(program,"aPos"), uvLoc=gl.getAttribLocation(program,"aUV"), shadeLoc=gl.getAttribLocation(program,"aShade");
const projLoc=gl.getUniformLocation(program,"uProj"), viewLoc=gl.getUniformLocation(program,"uView"), skyLoc=gl.getUniformLocation(program,"uSky");
const fogLoc=gl.getUniformLocation(program,"uFogEnabled"), brightLoc=gl.getUniformLocation(program,"uBrightness"), contrastLoc=gl.getUniformLocation(program,"uContrast");
const fogDensityLoc=gl.getUniformLocation(program,"uFogDensity"), textureContrastLoc=gl.getUniformLocation(program,"uTextureContrast"), textureSaturationLoc=gl.getUniformLocation(program,"uTextureSaturation");
const superShadowsLoc=gl.getUniformLocation(program,"uSuperShadows"), superReflectionsLoc=gl.getUniformLocation(program,"uSuperReflections"), superBloomLoc=gl.getUniformLocation(program,"uSuperBloom"), superIntensityLoc=gl.getUniformLocation(program,"uSuperIntensity"), sunDirLoc=gl.getUniformLocation(program,"uSunDir");
const cPosLoc=gl.getAttribLocation(crackProgram,"aPos"), cUvLoc=gl.getAttribLocation(crackProgram,"aUV"), cShadeLoc=gl.getAttribLocation(crackProgram,"aShade");
const cProjLoc=gl.getUniformLocation(crackProgram,"uProj"), cViewLoc=gl.getUniformLocation(crackProgram,"uView");

const buffer=gl.createBuffer();
const crackBuffer=gl.createBuffer();

/* 3D sky objects: fixed sun and clouds */

const skyObjVs = `
attribute vec3 aPos;
attribute vec4 aColor;
uniform mat4 uProj;
uniform mat4 uView;
varying vec4 vColor;
void main(){
  gl_Position = uProj * uView * vec4(aPos, 1.0);
  vColor = aColor;
}`;
const skyObjFs = `
precision mediump float;
varying vec4 vColor;
void main(){
  gl_FragColor = vColor;
}`;

function makeSkyProgram(){
  const p=gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, skyObjVs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, skyObjFs));
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
const skyProgram = makeSkyProgram();
const skyPosLoc = gl.getAttribLocation(skyProgram,"aPos");
const skyColorLoc = gl.getAttribLocation(skyProgram,"aColor");
const skyProjLoc = gl.getUniformLocation(skyProgram,"uProj");
const skyViewLoc = gl.getUniformLocation(skyProgram,"uView");
const skyBuffer = gl.createBuffer();

function pushSkyQuad(verts, cx, cy, cz, sx, sy, color){
  // Camera-facing-ish flat quads in fixed world space. These stay in one sky location,
  // not stuck to the screen like an overlay.
  const pts=[
    [cx-sx,cy-sy,cz],
    [cx+sx,cy-sy,cz],
    [cx+sx,cy+sy,cz],
    [cx-sx,cy-sy,cz],
    [cx+sx,cy+sy,cz],
    [cx-sx,cy+sy,cz]
  ];
  for(const p of pts) verts.push(p[0],p[1],p[2], color[0],color[1],color[2],color[3]);
}



function normalize3(v){
  const l=Math.hypot(v[0],v[1],v[2]) || 1;
  return [v[0]/l,v[1]/l,v[2]/l];
}
function pushBillboardSkyQuad(verts, cx, cy, cz, sx, sy, color, right, up){
  const rx=[right[0]*sx,right[1]*sx,right[2]*sx];
  const uy=[up[0]*sy,up[1]*sy,up[2]*sy];
  const pts=[
    [cx-rx[0]-uy[0], cy-rx[1]-uy[1], cz-rx[2]-uy[2]],
    [cx+rx[0]-uy[0], cy+rx[1]-uy[1], cz+rx[2]-uy[2]],
    [cx+rx[0]+uy[0], cy+rx[1]+uy[1], cz+rx[2]+uy[2]],
    [cx-rx[0]-uy[0], cy-rx[1]-uy[1], cz-rx[2]-uy[2]],
    [cx+rx[0]+uy[0], cy+rx[1]+uy[1], cz+rx[2]+uy[2]],
    [cx-rx[0]+uy[0], cy-rx[1]+uy[1], cz-rx[2]+uy[2]]
  ];
  for(const p of pts) verts.push(p[0],p[1],p[2], color[0],color[1],color[2],color[3]);
}

function pushSunGlow(verts, cx, cy, cz, size, alpha, superGlow, right=null, up=null){
  // v30: square sky sun with layered glow.
  if(!right) right=[1,0,0];
  if(!up) up=[0,1,0];
  pushBillboardSkyQuad(verts, cx, cy, cz, size*4.2, size*4.2, [1.0,0.48,0.14,0.055*alpha*superGlow], right, up);
  pushBillboardSkyQuad(verts, cx, cy, cz, size*2.9, size*2.9, [1.0,0.66,0.25,0.12*alpha*superGlow], right, up);
  pushBillboardSkyQuad(verts, cx, cy, cz, size*1.72, size*1.72, [1.0,0.82,0.36,0.28*alpha*superGlow], right, up);
  pushBillboardSkyQuad(verts, cx, cy, cz, size*0.95, size*0.95, [1.0,0.96,0.62,0.90*alpha], right, up);
  pushBillboardSkyQuad(verts, cx, cy, cz, size*0.50, size*0.50, [1.0,1.0,0.86,0.98*alpha], right, up);
}

function drawSkyObjects(proj, view){
  const verts=[];
  // v30 distant sun billboard: position sun relative to camera/player, not fixed world.
  const camRight=normalize3([view[0], view[4], view[8]]);
  const camUp=normalize3([view[1], view[5], view[9]]);
  const intensity=(settings.superGraphics && settings.superBloom ? settings.superIntensity/100 : 1);
  const sunAlpha=Math.min(1, (settings.sunGlow/100) * (settings.superGraphics ? 1.35 : 1) * daylightAmount());
  const sunSize=8 + (settings.sunGlow/100)*7;

  // Fixed sun point in the sky. Clouds are deliberately kept away from this area.
  const sv=sunVector();
  const day=daylightAmount();
  const sunX=WORLD_X/2 + sv[0]*92;
  const sunY=WORLD_Y + 4 + Math.max(0, sv[1])*70;
  const sunZ=WORLD_Z/2 + sv[2]*120;
  if(settings.showSun) if(settings.sunBillboard) pushSunGlow(verts, sunX, sunY, sunZ, sunSize, sunAlpha, settings.superGraphics ? 1.9 : 1.0, camRight, camUp); else pushSunGlow(verts, sunX, sunY, sunZ, sunSize, sunAlpha, settings.superGraphics ? 1.9 : 1.0);

  if(settings.clouds){
    const amount=settings.cloudAmount/100;
    const cloudAlpha=(0.18 + amount*0.34) * (settings.superGraphics ? 1.1 : 1);
    const maxClouds=Math.floor(16*amount);

    // v12: Minecraft-like blocky cloud clusters. They are scattered above the world
    // and avoid the sun's fixed region so the sun stays visible.
    const clusters=[
      [-105,  0,-118],[-72,  5,-82],[-30, -2,-120],[  8,  4,-98],[ 92, -1,-122],
      [-118,  8,-38],[-64,  3,-28],[-16,  7,-48],[ 88,  2,-32],[124,  5,-58],
      [-96, -3, 24],[-42,  4, 36],[ 18,  0, 20],[ 84,  6, 42],[130, -2, 24],
      [-58,  9, 96],[  4,  3, 86],[ 76,  7,108]
    ];

    const blocks=[
      [0,0,0,12,3], [14,0,0,10,3], [-14,0,0,10,3],
      [0,0,10,11,3], [0,0,-10,11,3],
      [8,3,4,9,3], [-8,3,-4,9,3],
      [20,1,8,8,2], [-22,1,-8,8,2]
    ];

    for(let i=0;i<Math.min(maxClouds,clusters.length);i++){
      const c=clusters[i];
      const baseX=WORLD_X/2+c[0], baseY=WORLD_Y+24+c[1], baseZ=WORLD_Z/2+c[2];

      // Skip any cloud cluster too close to the sun.
      const distToSun=Math.hypot(baseX-sunX, baseY-sunY, baseZ-sunZ);
      if(distToSun < 52) continue;

      for(const b of blocks){
        const cx=baseX+b[0], cy=baseY+b[1], cz=baseZ+b[2];
        const sx=b[3], sy=b[4];
        // Main block face plus a slight underside to create chunk depth.
        pushSkyQuad(verts, cx, cy, cz, sx, sy, [1.0,1.0,1.0,cloudAlpha]);
        pushSkyQuad(verts, cx, cy-3, cz+4, sx*0.92, sy*0.55, [0.72,0.82,0.96,cloudAlpha*0.32]);
        // Cross plane gives visible volume from angles.
        pushSkyQuad(verts, cx+2, cy, cz+sx*0.35, sx*0.32, sy*0.9, [0.86,0.92,1.0,cloudAlpha*0.38]);
      }
    }
  }

  if(!verts.length) return;

  gl.useProgram(skyProgram);
  gl.uniformMatrix4fv(skyProjLoc,false,proj);
  gl.uniformMatrix4fv(skyViewLoc,false,view);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);

  const stride=7*4;
  gl.enableVertexAttribArray(skyPosLoc);
  gl.vertexAttribPointer(skyPosLoc,3,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(skyColorLoc);
  gl.vertexAttribPointer(skyColorLoc,4,gl.FLOAT,false,stride,3*4);

  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);
  gl.drawArrays(gl.TRIANGLES,0,verts.length/7);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
}


/* World */

function idx(x,y,z){ return x + WORLD_X*(z + WORLD_Z*y); }
function inBounds(x,y,z){ return x>=0&&x<WORLD_X&&y>=0&&y<WORLD_Y&&z>=0&&z<WORLD_Z; }
function getBlock(x,y,z){ return inBounds(x,y,z) ? world[idx(x,y,z)] : BLOCK.AIR; }
function setBlock(x,y,z,b){ if(inBounds(x,y,z)){ world[idx(x,y,z)] = b; dirtyMesh=true; } }
function isSolidBlock(b){ return b && BLOCKS[b] && BLOCKS[b].solid; }
function hash2(x,z){ let n=x*374761393+z*668265263; n=(n^(n>>13))*1274126177; return ((n^(n>>16))>>>0)/4294967295; }
function smoothNoise(x,z){
  const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi;
  const a=hash2(xi,zi),b=hash2(xi+1,zi),c=hash2(xi,zi+1),d=hash2(xi+1,zi+1);
  const u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  return lerp(lerp(a,b,u),lerp(c,d,u),v);
}
function terrainHeight(x,z){
  if(settings.worldPreset==="flat"){
    return 14;
  }

  if(settings.worldPreset==="desert"){
    const dunes = 12 + smoothNoise(x/24,z/24)*10 + smoothNoise(x/8,z/8)*4;
    const dryHills = Math.pow(smoothNoise((x+700)/36,(z-100)/36), 2.0) * 26;
    return Math.floor(dunes + dryHills);
  }

  const rolling = 10 + smoothNoise(x/18,z/18)*16 + smoothNoise(x/8,z/8)*5;

  if(settings.worldPreset==="mountains"){
    // Mountain World: tall terrain is common, dramatic, and more rugged.
    const broad = Math.pow(Math.max(0.0, smoothNoise((x+500)/30,(z-300)/30)), 1.15) * 72;
    const ridges = Math.pow(smoothNoise(x/15,z/15), 1.45) * 32;
    const sharp = Math.pow(smoothNoise((x-200)/8,(z+100)/8), 2.2) * 22;
    return Math.floor(18 + broad + ridges + sharp);
  }

  // Default: mixed plains, hills, and occasional mountains.
  const mountainMask = Math.pow(smoothNoise((x+500)/38,(z-300)/38), 1.75);
  const ridge = Math.pow(smoothNoise(x/24,z/24), 1.35);
  const sharp = Math.pow(smoothNoise((x-200)/13,(z+100)/13), 2.0) * 10;
  const mountainShape = (ridge * 42 + sharp) * mountainMask;

  return Math.floor(rolling + mountainShape);
}

function generateWorld(){
  world.fill(BLOCK.AIR);
  for(let x=0;x<WORLD_X;x++) for(let z=0;z<WORLD_Z;z++){
    const h=terrainHeight(x,z);
    for(let y=0;y<=h;y++){
      let b=BLOCK.STONE;

      if(settings.worldPreset==="flat"){
        if(y===h) b=BLOCK.GRASS;
        else if(y>h-4) b=BLOCK.DIRT;
        else b=BLOCK.STONE;
      } else if(settings.worldPreset==="desert"){
        if(y===h) b=BLOCK.SAND;
        else if(y>h-5) b=BLOCK.SAND;
        else if(y<8 && smoothNoise(x/9,z/9)>0.76) b=BLOCK.BASALT;
        else b=BLOCK.STONE;
      } else {
        if(y===h) {
          if(h>35) b=BLOCK.SNOW;
          else if(h<12) b=BLOCK.SAND;
          else b= smoothNoise(x/11,z/11) > 0.72 ? BLOCK.MOSS : BLOCK.GRASS;
        } else if(y>h-4) {
          b=h<12 ? BLOCK.CLAY : BLOCK.DIRT;
        } else if(y<8 && smoothNoise(x/9,z/9)>0.72) {
          b=BLOCK.BASALT;
        }
        if(y<10 && hash2(x+y,z-y)>0.948) b=BLOCK.COAL;
      }

      setBlock(x,y,z,b);
    }

    if(settings.worldPreset!=="flat" && h<11) setBlock(x,h+1,z,BLOCK.WATER);
    if(settings.worldPreset!=="flat" && settings.worldPreset!=="desert" && hash2(x*3,z*3)>0.987 && h>12 && h<34) makeTree(x,h+1,z);
  }

  if(settings.worldPreset!=="flat") for(let i=0;i<26;i++){
    const x=3+rnd(0,WORLD_X-7);
    const z=3+rnd(0,WORLD_Z-7);
    const y=Math.floor(findSurfaceY(x,z));
    const below=getBlock(x,y-1,z);
    if(below===BLOCK.WATER || y<8 || y>28) continue;
    makeWoodPillarRuin(x,y,z);
  }

  // v16 guaranteed church: every world gets at least one small stone church.
  {
    let placedChurch=false;
    for(let attempt=0; attempt<80 && !placedChurch; attempt++){
      const x=8+rnd(0,WORLD_X-16);
      const z=8+rnd(0,WORLD_Z-16);
      const y=Math.floor(findSurfaceY(x,z));
      const below=getBlock(x,y-1,z);
      if(below!==BLOCK.WATER && y>=8 && y<=42){
        makeStoneChurch(x,y,z);
        placedChurch=true;
      }
    }
    if(!placedChurch){
      const x=Math.floor(WORLD_X/2);
      const z=Math.floor(WORLD_Z/2);
      const y=Math.floor(findSurfaceY(x,z));
      makeStoneChurch(x,y,z);
    }
  }

  dirtyMesh=true;
}

function makeTree(x,y,z){
  for(let i=0;i<5;i++) setBlock(x,y+i,z,BLOCK.WOOD);
  for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++) for(let dy=2;dy<=5;dy++){
    if(Math.abs(dx)+Math.abs(dz)+Math.abs(dy-3)<5) setBlock(x+dx,y+dy,z+dz,BLOCK.LEAF);
  }
}


function makeStoneChurch(x,y,z){
  const h=4;
  for(let dx=-2; dx<=2; dx++){
    for(let dz=-3; dz<=3; dz++){
      for(let dy=0; dy<h; dy++){
        const edge = dx===-2 || dx===2 || dz===-3 || dz===3 || dy===0;
        if(edge) setBlock(x+dx,y+dy,z+dz, dy===0 ? BLOCK.STONE : BLOCK.COBBLE);
      }
    }
  }
  for(let dx=-1; dx<=1; dx++){
    for(let dz=-2; dz<=2; dz++){
      for(let dy=1; dy<3; dy++) setBlock(x+dx,y+dy,z+dz,BLOCK.AIR);
    }
  }
  setBlock(x,y+1,z-3,BLOCK.AIR);
  setBlock(x,y+2,z-3,BLOCK.AIR);

  for(let dx=-3; dx<=3; dx++){
    for(let dz=-4; dz<=4; dz++) setBlock(x+dx,y+h,z+dz,BLOCK.DARK_PLANKS);
  }
  for(let dx=-2; dx<=2; dx++){
    for(let dz=-3; dz<=3; dz++) setBlock(x+dx,y+h+1,z+dz,BLOCK.DARK_PLANKS);
  }

  // Centered tower.
  for(let dy=0; dy<5; dy++){
    setBlock(x,y+h+dy,z-2,BLOCK.COBBLE);
    setBlock(x+1,y+h+dy,z-2,BLOCK.COBBLE);
    setBlock(x,y+h+dy,z-1,BLOCK.COBBLE);
    setBlock(x+1,y+h+dy,z-1,BLOCK.COBBLE);
  }

  // v24 fixed wooden cross: centered, upright, and clearly cross-shaped.
  const cx=x, cy=y+h+5, cz=z-2;
  setBlock(cx,cy,cz,BLOCK.WOOD);
  setBlock(cx,cy+1,cz,BLOCK.WOOD);
  setBlock(cx,cy+2,cz,BLOCK.WOOD);
  setBlock(cx-1,cy+1,cz,BLOCK.WOOD);
  setBlock(cx+1,cy+1,cz,BLOCK.WOOD);
}

function makeWoodPillarRuin(x,y,z){
  const height=3+rnd(0,5);
  const radius=hash2(x,z)>0.55 ? 1 : 0;
  for(let dy=0;dy<height;dy++) setBlock(x,y+dy,z,BLOCK.PILLAR_WOOD);
  if(radius){
    if(hash2(x+1,z)>0.35) for(let dy=0;dy<height-1;dy++) setBlock(x+2,y+dy,z,BLOCK.PILLAR_WOOD);
    if(hash2(x,z+1)>0.35) for(let dy=0;dy<height-1;dy++) setBlock(x,y+dy,z+2,BLOCK.PILLAR_WOOD);
    if(hash2(x+2,z+2)>0.45){
      setBlock(x,y+height,z+1,BLOCK.DARK_PLANKS);
      setBlock(x+1,y+height,z,BLOCK.DARK_PLANKS);
      setBlock(x+1,y+height,z+1,BLOCK.DARK_PLANKS);
    }
  }
}

const faces = [
  [[ 1,0,0], [[1,0,0, 0,1],[1,1,0, 0,0],[1,1,1, 1,0],[1,0,1, 1,1]], 0.78],
  [[-1,0,0], [[0,0,1, 0,1],[0,1,1, 0,0],[0,1,0, 1,0],[0,0,0, 1,1]], 0.62],
  [[0, 1,0], [[0,1,1, 0,1],[1,1,1, 1,1],[1,1,0, 1,0],[0,1,0, 0,0]], 1.00],
  [[0,-1,0], [[0,0,0, 0,1],[1,0,0, 1,1],[1,0,1, 1,0],[0,0,1, 0,0]], 0.42],
  [[0,0, 1], [[1,0,1, 0,1],[1,1,1, 0,0],[0,1,1, 1,0],[0,0,1, 1,1]], 0.72],
  [[0,0,-1], [[0,0,0, 0,1],[0,1,0, 0,0],[1,1,0, 1,0],[1,0,0, 1,1]], 0.56]
];

function skyLightAt(x,y,z){
  if(!settings.smoothLighting) return 0.5;
  for(let yy=y+1; yy<WORLD_Y; yy++) if(getBlock(x,yy,z)!==BLOCK.AIR) return 0;
  return 1;
}

function sunShadowAt(x,y,z){
  if(!(settings.superGraphics && settings.superShadows)) return 0;
  const day=daylightAmount();
  if(day <= 0.05) return 0;

  // Cast toward the moving sun. Shadows change direction as sun moves east-west.
  const sv=sunVector();
  let sx=x, sy=y+1, sz=z;
  const step=[-sv[0]*0.78, Math.max(0.20, sv[1])*0.78, -sv[2]*0.78];

  for(let i=0;i<24;i++){
    sx += step[0];
    sy += step[1];
    sz += step[2];
    const bx=Math.floor(sx), by=Math.floor(sy), bz=Math.floor(sz);
    if(!inBounds(bx,by,bz)) return 0;
    const b=getBlock(bx,by,bz);
    if(b!==BLOCK.AIR && b!==BLOCK.WATER) {
      return (1.0 - Math.min(i/30, 0.55)) * day;
    }
  }
  return 0;
}


function buildMesh(){
  const verts=[];
  const px=Math.floor(player.x), pz=Math.floor(player.z);
  const vd=settings.renderDistance;
  for(let y=0;y<WORLD_Y;y++) for(let x=0;x<WORLD_X;x++) for(let z=0;z<WORLD_Z;z++){
    const b=getBlock(x,y,z);
    if(!b) continue;
    if(Math.hypot(x-px,z-pz)>vd && !menuVisible()) continue;
    for(const face of faces){
      const d=face[0], corners=face[1], shade=face[2];
      const nb=getBlock(x+d[0],y+d[1],z+d[2]);
      if(nb!==BLOCK.AIR && nb!==BLOCK.WATER) continue;

      // Grass uses a top texture on top, dirt underneath, and a special side texture
      // with visible dirt below the grass layer.
      let texBlock = b;
      if(b===BLOCK.GRASS){
        if(d[1] === 1) texBlock = BLOCK.GRASS;
        else if(d[1] === -1) texBlock = BLOCK.DIRT;
        else texBlock = BLOCK.GRASS_SIDE;
      }

      const u0=texBlock/BLOCKS.length, u1=(texBlock+1)/BLOCKS.length;
      const castShadow = sunShadowAt(x,y,z);
      const shadowFactor = 1.0 - castShadow * 0.46 * (settings.superIntensity/100);
      const finalShade=clamp((shade + skyLightAt(x,y,z)*0.2) * (settings.ambientLight/100) * shadowFactor, 0.14, 1.35);
      const quad=[0,1,2, 0,2,3];
      for(const qi of quad){
        const c=corners[qi];
        verts.push(x+c[0], y+c[1], z+c[2], lerp(u0+0.002,u1-0.002,c[3]), lerp(0.02,0.98,c[4]), finalShade);
      }
    }
  }
  const data=new Float32Array(verts);
  vertexCount=data.length/6;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  dirtyMesh=false;
}

let crackVertexCount=0;
function buildCrackMesh(hit){
  if(!hit || breakProgress<=0){ crackVertexCount=0; return; }
  const verts=[];
  const stage=clamp(Math.floor(breakProgress*6),0,5);
  const u0=stage/6+0.002, u1=(stage+1)/6-0.002;
  const eps=0.004;
  const x=hit.x, y=hit.y, z=hit.z;
  for(const face of faces){
    const d=face[0], corners=face[1];
    const nb=getBlock(x+d[0],y+d[1],z+d[2]);
    if(nb!==BLOCK.AIR && nb!==BLOCK.WATER) continue;
    const quad=[0,1,2, 0,2,3];
    for(const qi of quad){
      const c=corners[qi];
      verts.push(x+c[0]+d[0]*eps, y+c[1]+d[1]*eps, z+c[2]+d[2]*eps, lerp(u0,u1,c[3]), lerp(0.02,0.98,c[4]), 1);
    }
  }
  const data=new Float32Array(verts);
  crackVertexCount=data.length/6;
  gl.bindBuffer(gl.ARRAY_BUFFER, crackBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
}

/* Player / controls */

const player={x:WORLD_X/2,y:30,z:WORLD_Z/2,vx:0,vy:0,vz:0,yaw:0,pitch:0,grounded:false};
const keys={};
let lookMotion=0;
function bind(name){ return settings.binds[name]; }
function down(name){ return keys[bind(name)]; }
function getForward(){ return normalize([Math.sin(player.yaw)*Math.cos(player.pitch), Math.sin(player.pitch), Math.cos(player.yaw)*Math.cos(player.pitch)]); }
function solidAt(x,y,z){ return isSolidBlock(getBlock(Math.floor(x),Math.floor(y),Math.floor(z))); }

function updatePlayer(dt){
  if(inventoryOpen || settingsOpen || !gameStarted) return;
  const beforeGrounded = player.grounded;
  const beforeY = player.y;
  const forwardFlat=normalize([Math.sin(player.yaw),0,Math.cos(player.yaw)]);
  const right=normalize([Math.cos(player.yaw),0,-Math.sin(player.yaw)]);
  let mx=0,mz=0,my=0;
  if(down("forward")){mx+=forwardFlat[0];mz+=forwardFlat[2];}
  if(down("back")){mx-=forwardFlat[0];mz-=forwardFlat[2];}
  if(down("right")){mx-=right[0];mz-=right[2];}
  if(down("left")){mx+=right[0];mz+=right[2];}
  const move=normalize([mx,0,mz]);
  const sprinting = down("sprint") && !down("crouch");
  const crouching = down("crouch");
  const speed = crouching && !settings.creative ? 2.4 : (sprinting ? 8.8 : 5.2);

  if(settings.creative) flying = true;

  if(flying){
    if(down("jump")) my+=1;
    if(crouching || keys.ControlLeft) my-=1;
    const flySpeed = crouching ? 3.2 : (sprinting ? settings.creativeSprintSpeed : 7.0);
    player.x+=move[0]*flySpeed*dt; player.z+=move[2]*flySpeed*dt; player.y+=my*flySpeed*dt; player.vy=0;
    player.grounded=false;
    return;
  }

  player.vx=move[0]*speed; player.vz=move[2]*speed; player.vy-=32*dt;
  if(down("jump") && player.grounded){ player.vy=8.4; player.grounded=false; lastGroundY=player.y; }
  moveAndCollide(dt);

  const movingOnGround = player.grounded && (Math.abs(player.vx) + Math.abs(player.vz) > 0.1);
  if(movingOnGround && performance.now() - lastStepSound > (sprinting ? 260 : 390)){
    lastStepSound = performance.now();
    sound("step");
  }

  if(beforeGrounded && !player.grounded) lastGroundY = beforeY;
  if(!beforeGrounded && player.grounded) {
    const fallDistance = lastGroundY - player.y;
    if(fallDistance > 7.0) {
      // Easier survival: higher safe-fall threshold and lower damage multiplier.
      const dmg = Math.max(1, Math.floor((fallDistance - 7.0) * 1.15));
      sound("fall");
      takeDamage(dmg);
    }
  }
  if(player.y<-10){ takeDamage(20); respawn(); }
}


function hasFloorUnderPlayer(nx,nz){
  // Sneak edge check. Tests if there is solid ground just below the player's feet.
  const r=0.24;
  const footY=player.y-0.08;
  const checks=[
    [nx-r,nz-r],
    [nx+r,nz-r],
    [nx-r,nz+r],
    [nx+r,nz+r],
    [nx,nz]
  ];
  return checks.some(p=>solidAt(p[0], footY, p[1]));
}

function canSneakMoveTo(nx,nz){
  // While crouching in survival, prevent horizontal movement into empty air.
  // This lets the player stay safely on the edge until uncrouching.
  const crouching = keys[settings.binds.crouch] && !settings.creative;
  if(!crouching || !player.grounded) return true;
  return hasFloorUnderPlayer(nx,nz);
}

function moveAndCollide(dt){
  const r=0.28,h=(keys[settings.binds.crouch] && !settings.creative ? 1.18 : 1.72);
  function collides(nx,ny,nz){
    const pts=[[nx-r,ny,nz-r],[nx+r,ny,nz-r],[nx-r,ny,nz+r],[nx+r,ny,nz+r],[nx-r,ny+h,nz-r],[nx+r,ny+h,nz-r],[nx-r,ny+h,nz+r],[nx+r,ny+h,nz+r]];
    return pts.some(p=>solidAt(p[0],p[1],p[2]));
  }

  function tryStep(nx,nz){
    // v18 auto-step: walk up simple one-block ledges instead of getting stuck.
    if(!settings.autoStep || !player.grounded || keys[settings.binds.crouch] || settings.creative) return false;
    const stepHeight = 1.05;
    if(!collides(nx, player.y + stepHeight, nz)){
      player.y += stepHeight;
      player.x = nx;
      player.z = nz;
      player.grounded = false;
      return true;
    }
    return false;
  }

  let nx=player.x+player.vx*dt;
  if(canSneakMoveTo(nx,player.z) && !collides(nx,player.y,player.z)) player.x=nx;
  else tryStep(nx, player.z);

  let nz=player.z+player.vz*dt;
  if(canSneakMoveTo(player.x,nz) && !collides(player.x,player.y,nz)) player.z=nz;
  else tryStep(player.x, nz);

  let ny=player.y+player.vy*dt;
  if(!collides(player.x,ny,player.z)){ player.y=ny; player.grounded=false; }
  else { if(player.vy<0) player.grounded=true; player.vy=0; }
}

function raycast(maxDist){
  const origin=[player.x,player.y+1.55,player.z], dir=getForward();
  let prev=[Math.floor(origin[0]),Math.floor(origin[1]),Math.floor(origin[2])];
  for(let t=0;t<maxDist;t+=0.05){
    const x=Math.floor(origin[0]+dir[0]*t), y=Math.floor(origin[1]+dir[1]*t), z=Math.floor(origin[2]+dir[2]*t);
    if(!inBounds(x,y,z)) continue;
    const b=getBlock(x,y,z);
    if(b!==BLOCK.AIR && b!==BLOCK.WATER) return {x,y,z,prev,block:b,key:`${x},${y},${z}`};
    prev=[x,y,z];
  }
  return null;
}

function placeSelected(){
  const hit=raycast(7);
  if(!hit) return;
  const b=hotbar[selectedSlot], p=hit.prev;
  if(!b) return;
  if(!settings.creative && inventory[b]<=0) return;
  const insidePlayer = !settings.creative && Math.floor(player.x)===p[0] && (Math.floor(player.y)===p[1] || Math.floor(player.y+1)===p[1]) && Math.floor(player.z)===p[2];
  if(insidePlayer) return;
  setBlock(p[0],p[1],p[2],b);
  if(!settings.creative) {
    inventory[b]--;
    cleanupHotbar();
  }
  sound("place");
  swingHand("build");
  renderUI();
}

function updateBreaking(dt){
  if(!mouseDown || inventoryOpen || settingsOpen || !gameStarted){
    resetBreak();
    return null;
  }
  const hit=raycast(7);
  if(!hit){ resetBreak(); return null; }

  if(settings.creative){
    setBlock(hit.x,hit.y,hit.z,BLOCK.AIR);
    sound("break");
    swingHand("break");
    resetBreak();
    return null;
  }

  if(hit.key !== breakTargetKey){
    breakTargetKey = hit.key;
    breakProgress = 0;
    breakStage = 0;
  }
  const hardness = BLOCKS[hit.block]?.hardness || 1;
  breakProgress += dt / hardness;
  const newStage = Math.floor(breakProgress * 6);
  if(newStage !== breakStage){
    breakStage = newStage;
    swingHand("break");
  }
  breakWrap.classList.remove("hidden");
  breakBar.style.width = `${clamp(breakProgress*100,0,100)}%`;
  buildCrackMesh(hit);
  if(breakProgress >= 1){
    setBlock(hit.x,hit.y,hit.z,BLOCK.AIR);
    sound("break");
    inventory[hit.block]=(inventory[hit.block]||0)+1;
    if(!hotbar.includes(hit.block)){
      const empty=hotbar.indexOf(0);
      if(empty !== -1) hotbar[empty]=hit.block;
    }
    swingHand("break");
    renderUI();
    resetBreak();
    return null;
  }
  return hit;
}

function resetBreak(){
  breakTargetKey=null; breakProgress=0; breakStage=0; crackVertexCount=0;
  breakWrap.classList.add("hidden"); breakBar.style.width="0%";
}

function wipeInventoryOnDeath(){
  inventory = {};
  for (let i=1; i<BLOCKS.length; i++) inventory[i] = 0;
  hotbar = [0,0,0,0,0,0,0,0,0];
  selectedSlot = 0;
}

function takeDamage(amount){
  if(settings.creative || flying || amount<=0) return;
  health = clamp(health - amount, 0, 20);
  damageFlash.classList.add("flash");
  setTimeout(()=>damageFlash.classList.remove("flash"),45);
  if(health<=0){
    sound("die");
    wipeInventoryOnDeath();
    respawn();
    health=20;
    flash("You died. Inventory lost.");
  } else {
    flash(`Fall damage: -${amount}`);
  }
  renderUI();
  renderHealth();
}

function findSurfaceY(x,z){
  const xi = Math.floor(clamp(x, 1, WORLD_X-2));
  const zi = Math.floor(clamp(z, 1, WORLD_Z-2));
  for(let y=WORLD_Y-3; y>=1; y--){
    const b = getBlock(xi,y,zi);
    const above = getBlock(xi,y+1,zi);
    const above2 = getBlock(xi,y+2,zi);
    if(isSolidBlock(b) && above===BLOCK.AIR && above2===BLOCK.AIR) return y + 1.02;
  }
  return WORLD_Y / 2;
}

function findSafeSpawn(){
  const cx = Math.floor(WORLD_X/2);
  const cz = Math.floor(WORLD_Z/2);
  for(let r=0; r<44; r++){
    for(let dx=-r; dx<=r; dx++){
      for(let dz=-r; dz<=r; dz++){
        if(Math.abs(dx)!==r && Math.abs(dz)!==r) continue;
        const x = cx + dx;
        const z = cz + dz;
        if(x<2 || z<2 || x>WORLD_X-3 || z>WORLD_Z-3) continue;
        const y = findSurfaceY(x,z);
        const below = getBlock(Math.floor(x), Math.floor(y-1), Math.floor(z));
        if(below !== BLOCK.WATER && y > 4 && y < WORLD_Y-4) return {x:x+0.5, y, z:z+0.5};
      }
    }
  }
  return {x:WORLD_X/2, y:findSurfaceY(WORLD_X/2,WORLD_Z/2), z:WORLD_Z/2};
}

function respawn(){
  const s = findSafeSpawn();
  player.x=s.x; player.y=s.y; player.z=s.z;
  player.vx=player.vy=player.vz=0;
  player.grounded=false;
  lastGroundY=player.y;
}

function swingHand(type){
  handEl.classList.remove("handSwingBuild","handSwingBreak");
  void handEl.offsetWidth;
  handEl.classList.add(type==="break" ? "handSwingBreak" : "handSwingBuild");
}

/* UI */

const atlasURL = atlasCanvas.toDataURL();
function blockIconStyle(blockId, size=35){
  if(!blockId) return "background:rgba(255,255,255,0.08);border:1px dashed rgba(255,255,255,0.25);";
  return `background-image:url(${atlasURL});background-size:${BLOCKS.length*size}px ${size}px;background-position:${-blockId*size}px 0;`;
}

function cleanupHotbar(){
  if(settings.creative) return;
  for(let i=0;i<hotbar.length;i++){
    const b=hotbar[i];
    if(b && (inventory[b] || 0) <= 0){
      hotbar[i]=0;
    }
  }
  if(hotbar[selectedSlot]===0){
    const next=hotbar.findIndex(b=>b && (settings.creative || (inventory[b]||0)>0));
    if(next>=0) selectedSlot=next;
  }
}

function renderUI(){
  cleanupHotbar();
  hotbarEl.innerHTML="";
  if(settings.creative && hotbar.every(v=>v===0)) hotbar = [1,2,3,4,5,8,12,16,18];

  for(let i=0;i<9;i++){
    const b=hotbar[i];
    const slot=document.createElement("div");
    slot.className="slot"+(i===selectedSlot?" selected":"")+(b ? "" : " empty");
    slot.onclick=()=>{selectedSlot=i; renderUI();};
    const countText = b ? (settings.creative ? "∞" : (inventory[b] ?? 0)) : "";
    slot.innerHTML=`<span class="num">${i+1}</span><div class="icon" style="${blockIconStyle(b)}"></div><span class="count">${countText}</span>`;
    hotbarEl.appendChild(slot);
  }
  const held=hotbar[selectedSlot];
  heldBlockEl.style.cssText = held ? (blockIconStyle(held, 68) + ";background-size:" + (BLOCKS.length*68) + "px 68px;background-position:" + (-held*68) + "px 0;") : "display:none;";
  if(held) heldBlockEl.style.display="block";

  invGridEl.innerHTML="";
  for(let id=1; id<BLOCKS.length; id++){ if(id===BLOCK.GRASS_SIDE) continue;
    const count=settings.creative ? "∞" : (inventory[id] ?? 0);
    const enabled=settings.creative || (inventory[id] ?? 0)>0;
    const item=document.createElement("div");
    item.className="invItem"+(enabled ? "" : " empty");
    item.innerHTML=`<div class="icon" style="${blockIconStyle(id,46)};margin:0 auto 6px auto;width:46px;height:46px;background-size:${BLOCKS.length*46}px 46px;background-position:${-id*46}px 0;"></div><div>${BLOCKS[id].name}</div><div>x${count}</div><div class="small">hardness ${BLOCKS[id].hardness}</div>`;
    item.onclick=()=>{ if(enabled){ hotbar[selectedSlot]=id; renderUI(); } };
    invGridEl.appendChild(item);
  }
}
function renderHealth(){
  if(settings.creative) {
    healthEl.textContent = "CREATIVE";
    return;
  }
  const hearts = Math.ceil(health/2);
  healthEl.textContent = "♥".repeat(hearts) + "♡".repeat(10-hearts);
}

function toggleInventory(force){
  inventoryOpen = force === undefined ? !inventoryOpen : force;
  invEl.classList.toggle("hidden", !inventoryOpen);
  if(inventoryOpen) document.exitPointerLock();
  else if(gameStarted && !settingsOpen) canvas.requestPointerLock();
  updateWorldMusic(); // v33
}
function toggleSettings(force){
  settingsOpen = force === undefined ? !settingsOpen : force;
  settingsEl.classList.toggle("hidden", !settingsOpen);
  if(settingsOpen) document.exitPointerLock();
  else if(gameStarted && !inventoryOpen) canvas.requestPointerLock();
}

function applyScreenFilter(){
  if(!screenFilterLayer) return;
  screenFilterLayer.className="";
  const f=settings.screenFilter || "none";
  if(f !== "none") screenFilterLayer.classList.add(f);
}


function rebuildBlockTextures(){
  const textureNames=["","grass","dirt","stone","sand","wood","leaf","brick","planks","glass","coal","water","cobble","gold","snow","clay","basalt","moss","pillarWood","darkPlanks","grassSide"];
  actx.clearRect(0,0,atlasCanvas.width,atlasCanvas.height);
  textureNames.forEach((t,i)=>{ if(i) drawTexture(i,t); });
  gl.bindTexture(gl.TEXTURE_2D, atlas);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,atlasCanvas);
  dirtyMesh=true;
  renderUI();
}


function profileIconData(pic){
  if(pic==="stone") return {text:"■", color:"#7b7f84"};
  if(pic==="gold") return {text:"◆", color:"#e6b63d"};
  if(pic==="sun") return {text:"☀", color:"#f5b642"};
  if(pic==="castle") return {text:"♜", color:"#6f6f78"};
  if(pic==="cross") return {text:"✚", color:"#8b6b2d"};
  return {text:"▣", color:"#5fb84a"};
}

function applyProfileUI(){
  const name = (settings.profileUsername || "Player").trim() || "Player";
  const pic = profileIconData(settings.profilePicture || "grass");

  if($("profilePreviewName")) $("profilePreviewName").textContent = name;
  if($("menuProfileName")) $("menuProfileName").textContent = name;

  for(const id of ["profileAvatar","menuProfileIcon"]){
    const el=$(id);
    if(el){
      el.textContent=pic.text;
      el.style.background=pic.color;
    }
  }

  document.body.classList.remove("ui-classic","ui-blocky","ui-minecrafty","ui-transparent","ui-liquid");
  document.body.classList.add("ui-" + (settings.uiStylePreset || "classic"));
}

function renderSettings(){
  setAudioStatus();
  if($("profileUsername")) $("profileUsername").value=settings.profileUsername;
  if($("profilePicture")) $("profilePicture").value=settings.profilePicture;
  if($("uiStylePreset")) $("uiStylePreset").value=settings.uiStylePreset;
  applyProfileUI();

  $("creativeToggle").checked=settings.creative;
  $("creativeBreakSpeed").value=settings.creativeBreakSpeed;
  $("creativeBreakSpeedLabel").textContent=settings.creativeBreakSpeed >= 20 ? "Instant" : settings.creativeBreakSpeed + "x";
  $("creativeSprintSpeed").value=settings.creativeSprintSpeed;
  $("creativeSprintSpeedLabel").textContent=settings.creativeSprintSpeed + "x";
  $("autoStepToggle").checked=settings.autoStep;
  $("dayCycleToggle").checked=settings.dayCycle;
  $("showSunToggle").checked=settings.showSun;
  $("timeSpeed").value=settings.timeSpeed;
  $("timeSpeedLabel").textContent=settings.timeSpeed + "%";
  $("timePreset").value=nearestTimePreset(settings.timeOfDay);
    $("superGraphicsToggle").checked=settings.superGraphics;
  document.querySelectorAll(".superTabBtn").forEach(b=>b.classList.toggle("hidden", !settings.superGraphics));
  $("superShadowsToggle").checked=settings.superShadows;
  $("superReflectionsToggle").checked=settings.superReflections;
  $("superBloomToggle").checked=settings.superBloom;
  $("superIntensity").value=settings.superIntensity;
  $("superIntensityLabel").textContent=settings.superIntensity + "%";
  $("graphicsPreset").value=settings.preset;
  $("renderDistance").value=settings.renderDistance;
  $("renderDistanceLabel").textContent=settings.renderDistance;
  $("resolutionScale").value=settings.resolutionScale;
  $("resolutionScaleLabel").textContent=settings.resolutionScale + "%";
  $("motionBlurToggle").checked=settings.motionBlur;
  $("motionBlurStrength").value=settings.motionBlurStrength;
  $("motionBlurStrengthLabel").textContent=settings.motionBlurStrength + "%";
  $("fov").value=settings.fov;
  $("fovLabel").textContent=settings.fov;
  $("brightness").value=settings.brightness;
  $("brightnessLabel").textContent=settings.brightness + "%";
  $("lightingContrast").value=settings.lightingContrast;
  $("lightingContrastLabel").textContent=settings.lightingContrast + "%";
  $("ambientLight").value=settings.ambientLight;
  $("ambientLightLabel").textContent=settings.ambientLight + "%";
  $("fogDensity").value=settings.fogDensity;
  $("fogDensityLabel").textContent=settings.fogDensity + "%";
  $("skyWarmth").value=settings.skyWarmth;
  $("skyWarmthLabel").textContent=settings.skyWarmth + "%";
  $("cloudToggle").checked=settings.clouds;
  $("cloudAmount").value=settings.cloudAmount;
  $("cloudAmountLabel").textContent=settings.cloudAmount + "%";
  $("sunGlow").value=settings.sunGlow;
  $("sunGlowLabel").textContent=settings.sunGlow + "%";
  $("sunBillboardToggle").checked=settings.sunBillboard;
  if($("texturePack")) $("texturePack").value=settings.texturePack;
  if($("texturePackStatus")) $("texturePackStatus").textContent = settings.customTexturePackEnabled ? "Custom texture pack active." : "No custom texture pack loaded.";
  $("texturePreset").value=settings.texturePreset;
  if($("screenFilter")) $("screenFilter").value=settings.screenFilter;
  $("textureContrast").value=settings.textureContrast;
  $("textureContrastLabel").textContent=settings.textureContrast + "%";
  $("textureSaturation").value=settings.textureSaturation;
  $("textureSaturationLabel").textContent=settings.textureSaturation + "%";
  $("pixelSharpness").checked=settings.pixelSharpness;
  $("fogToggle").checked=settings.fog;
  $("smoothToggle").checked=settings.smoothLighting;
  $("panoramaToggle").checked=settings.panorama;
  $("panoramaPreset").value=settings.panoramaPreset;
  $("panoramaSpeed").value=settings.panoramaSpeed;
  $("panoramaSpeedLabel").textContent=settings.panoramaSpeed + "%";
  $("vignetteToggle").checked=settings.vignette;
  vignetteEl.classList.toggle("hidden", !settings.vignette);

  $("soundToggle").checked=settings.sound;
  $("soundVolume").value=settings.soundVolume;
  $("soundVolumeLabel").textContent=settings.soundVolume + "%";
  $("menuMusicToggle").checked=settings.menuMusic;
  if($("menuSongSelect")) $("menuSongSelect").value=settings.menuSong;
  $("menuMusicVolume").value=settings.menuMusicVolume;
  $("menuMusicVolumeLabel").textContent=settings.menuMusicVolume + "%";
  if($("worldMusicToggle")) $("worldMusicToggle").checked=settings.worldMusic;
  if($("worldSongSelect")) $("worldSongSelect").value=settings.worldSong;
  if($("worldMusicVolume")){ $("worldMusicVolume").value=settings.worldMusicVolume; $("worldMusicVolumeLabel").textContent=settings.worldMusicVolume + "%"; }
  const labels = {forward:"Forward", back:"Back", left:"Left", right:"Right", jump:"Jump", sprint:"Sprint", crouch:"Crouch / Descend", fly:"Toggle Fly", inventory:"Inventory", save:"Save", load:"Load"};
  const grid=$("controlsGrid"); grid.innerHTML="";
  Object.keys(settings.binds).forEach(action=>{
    const row=document.createElement("div"); row.className="bindRow";
    const btn=document.createElement("button"); btn.className="bindBtn"; btn.textContent=settings.binds[action];
    btn.onclick=()=>{ btn.textContent="Press key..."; waitingBind=action; };
    row.innerHTML=`<span>${labels[action]}</span>`;
    row.appendChild(btn);
    grid.appendChild(row);
  });
}
let waitingBind=null;
function applyPreset(name){
  const p=presetValues[name]; if(!p) return;
  settings.preset=name;
  settings.renderDistance=p.renderDistance;
  settings.fog=p.fog;
  settings.smoothLighting=p.smoothLighting;
  settings.resolutionScale=p.resolutionScale;
  dirtyMesh=true;
  renderSettings();
}

function applyTexturePreset(name){
  settings.texturePreset=name;
  if(name==="classic"){
    settings.textureContrast=95;
    settings.textureSaturation=90;
    settings.pixelSharpness=true;
    settings.brightness=100;
  } else if(name==="minecrafty"){
    settings.textureContrast=118;
    settings.textureSaturation=105;
    settings.pixelSharpness=true;
    settings.brightness=102;
    settings.skyWarmth=96;
  } else if(name==="soft"){
    settings.textureContrast=80;
    settings.textureSaturation=85;
    settings.pixelSharpness=false;
  } else if(name==="crisp"){
    settings.textureContrast=115;
    settings.textureSaturation=110;
    settings.pixelSharpness=true;
  } else if(name==="vivid"){
    settings.textureContrast=130;
    settings.textureSaturation=145;
    settings.pixelSharpness=true;
    settings.brightness=108;
  } else if(name==="moody"){
    settings.textureContrast=125;
    settings.textureSaturation=70;
    settings.pixelSharpness=true;
    settings.brightness=88;
    settings.skyWarmth=80;
  } else if(name==="retro"){
    settings.textureContrast=140;
    settings.textureSaturation=155;
    settings.pixelSharpness=true;
    settings.brightness=112;
    settings.skyWarmth=115;
  }
  canvas.style.imageRendering=settings.pixelSharpness ? "pixelated" : "auto";
  dirtyMesh=true;
  renderSettings();
}

function applySuperGraphics(enabled){
  settings.superGraphics = enabled;
  if(enabled){
    settings.brightness = Math.max(settings.brightness, 118);
    settings.lightingContrast = Math.max(settings.lightingContrast, 128);
    settings.ambientLight = Math.max(settings.ambientLight, 112);
    settings.textureContrast = Math.max(settings.textureContrast, 130);
    settings.textureSaturation = Math.max(settings.textureSaturation, 130);
    settings.fogDensity = Math.max(settings.fogDensity, 125);
    settings.skyWarmth = Math.max(settings.skyWarmth, 125);
    settings.sunGlow = Math.max(settings.sunGlow, 190);
    settings.superShadows=true;
    settings.superReflections=true;
    settings.superBloom=true;
    settings.cloudAmount = Math.max(settings.cloudAmount, 0);
    settings.clouds = true;
    settings.smoothLighting = true;
  }
  dirtyMesh=true;
  updateSkyFX(performance.now());
  renderSettings();
}

function setupTabs(){
  document.querySelectorAll(".tabBtn").forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll(".tabBtn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".settingsTab").forEach(t=>t.classList.remove("active"));
      btn.classList.add("active");
      const target=$(btn.dataset.tab);
      if(target) target.classList.add("active");
    };
  });
}

function saveSettings(){
  localStorage.setItem("blocklite-v4-settings", JSON.stringify(settings));
  flash("Settings saved.");
}

function sanitizeSettings(){
  if(!["classic","mountains","flat","desert","default"].includes(settings.panoramaPreset)) settings.panoramaPreset = "classic";
  if(!["default","flat","mountains","desert"].includes(settings.worldPreset)) settings.worldPreset = "default";
  if(!Number.isFinite(settings.timeOfDay)) settings.timeOfDay = 0.5;
  if(!Number.isFinite(settings.timeSpeed)) settings.timeSpeed = 100;
  if(!Number.isFinite(settings.renderDistance)) settings.renderDistance = 512;
  if(!Number.isFinite(settings.fov)) settings.fov = 75;
  // v22: force safe shader mode; v21 experimental normal-based shader is not used.
}

function loadSettings(){
  const raw=localStorage.getItem("blocklite-v4-settings");
  if(raw){ try { settings = {...settings, ...JSON.parse(raw)}; } catch {} }
  // v10 default-control migration from older builds.
  if(settings.binds && settings.binds.sprint==="ShiftLeft" && settings.binds.crouch==="KeyC"){
    settings.binds.sprint="KeyR";
    settings.binds.crouch="ShiftLeft";
  }
}


function safeWorldName(name){
  name = (name || "New World").trim().slice(0,32);
  return name || "New World";
}
function worldKey(name){
  return "voxels-world-" + encodeURIComponent(name);
}
function loadWorldIndex(){
  try { return JSON.parse(localStorage.getItem("voxels-world-index") || "[]"); }
  catch { return []; }
}
function saveIndex(index){
  localStorage.setItem("voxels-world-index", JSON.stringify(index));
}
function rememberWorld(name){
  name=safeWorldName(name);
  const index=loadWorldIndex();
  const existing=index.find(w=>w.name===name);
  const meta={name, updated:Date.now(), preset:settings.worldPreset || "default"};
  if(existing) Object.assign(existing, meta);
  else index.push(meta);
  index.sort((a,b)=>(b.updated||0)-(a.updated||0));
  saveIndex(index);
}
function renderWorldMenu(){
  const index=loadWorldIndex();
  worldList.innerHTML="";
  if(index.length===0){
    worldList.innerHTML='<p>No saved worlds yet. Create a world, then press P to save.</p>';
    return;
  }
  for(const w of index){
    const row=document.createElement("div");
    row.className="worldRow";
    const date=w.updated ? new Date(w.updated).toLocaleString() : "unknown";
    row.innerHTML=`<div><b>${w.name}</b><div class="worldMeta">${w.preset || "default"} · ${date}</div></div>`;
    const play=document.createElement("button");
    play.textContent="Play";
    play.onclick=()=>{ worldMenu.classList.add("hidden"); menu.style.display="none"; currentWorldName=w.name; loadWorldByName(w.name); gameStarted=true; canvas.requestPointerLock(); };
    const del=document.createElement("button");
    del.textContent="Delete";
    del.onclick=()=>{ if(confirm("Delete world '"+w.name+"'?")){ localStorage.removeItem(worldKey(w.name)); saveIndex(loadWorldIndex().filter(x=>x.name!==w.name)); renderWorldMenu(); } };
    row.appendChild(play);
    row.appendChild(del);
    worldList.appendChild(row);
  }
}

/* Save/load game */

let tempMessage="", tempTimer=0;
function flash(msg){ tempMessage=msg; tempTimer=2; }
function saveWorld(){
  currentWorldName=safeWorldName(currentWorldName);
  const data={
    world:Array.from(world), player:{x:player.x,y:player.y,z:player.z}, inventory, hotbar, selectedSlot, health,
    creative:settings.creative, worldPreset:settings.worldPreset, fov:settings.fov, creativeBreakSpeed:settings.creativeBreakSpeed, profileUsername:settings.profileUsername, profilePicture:settings.profilePicture, uiStylePreset:settings.uiStylePreset, texturePack:settings.texturePack, customTexturePackEnabled:settings.customTexturePackEnabled, screenFilter:settings.screenFilter, menuSong:settings.menuSong, worldMusic:settings.worldMusic, worldSong:settings.worldSong, worldMusicVolume:settings.worldMusicVolume, customMenuAudioEnabled:settings.customMenuAudioEnabled, customWorldAudioEnabled:settings.customWorldAudioEnabled, motionBlur:settings.motionBlur, motionBlurStrength:settings.motionBlurStrength, sunBillboard:settings.sunBillboard,
    creativeSprintSpeed:settings.creativeSprintSpeed, autoStep:settings.autoStep, timeOfDay:settings.timeOfDay, timeSpeed:settings.timeSpeed,
    dayCycle:settings.dayCycle, showSun:settings.showSun
  };
  localStorage.setItem(worldKey(currentWorldName), JSON.stringify(data));
  localStorage.setItem("blocklite-v4-save", JSON.stringify(data)); // legacy quick-load slot
  rememberWorld(currentWorldName);
  flash("Saved world: " + currentWorldName);
}

function applyLoadedWorld(data){
  world.set(data.world);
  if(data.player) Object.assign(player, data.player);
  if(data.inventory) inventory=data.inventory;
  if(data.hotbar) hotbar=data.hotbar;
  if(Number.isInteger(data.selectedSlot)) selectedSlot=data.selectedSlot;
  if(Number.isFinite(data.health)) health=data.health;
  if(typeof data.creative === "boolean") settings.creative=data.creative;
  if(typeof data.worldPreset === "string") settings.worldPreset=data.worldPreset;
  if(Number.isFinite(data.fov)) settings.fov=data.fov;
  if(Number.isFinite(data.creativeBreakSpeed)) settings.creativeBreakSpeed=data.creativeBreakSpeed;
  if(typeof data.profileUsername === "string") settings.profileUsername=data.profileUsername;
  if(typeof data.profilePicture === "string") settings.profilePicture=data.profilePicture;
  if(typeof data.uiStylePreset === "string") settings.uiStylePreset=data.uiStylePreset;
  if(typeof data.texturePack === "string") settings.texturePack=data.texturePack;
  if(typeof data.customTexturePackEnabled === "boolean") settings.customTexturePackEnabled=data.customTexturePackEnabled;
  if(typeof data.screenFilter === "string") settings.screenFilter=data.screenFilter;
  if(typeof data.menuSong === "string") settings.menuSong=data.menuSong;
  if(typeof data.worldMusic === "boolean") settings.worldMusic=data.worldMusic;
  if(typeof data.worldSong === "string") settings.worldSong=data.worldSong;
  if(Number.isFinite(data.worldMusicVolume)) settings.worldMusicVolume=data.worldMusicVolume;
  if(typeof data.customMenuAudioEnabled === "boolean") settings.customMenuAudioEnabled=data.customMenuAudioEnabled;
  if(typeof data.customWorldAudioEnabled === "boolean") settings.customWorldAudioEnabled=data.customWorldAudioEnabled;

  if(typeof data.motionBlur === 'boolean') settings.motionBlur=data.motionBlur;
  if(Number.isFinite(data.motionBlurStrength)) settings.motionBlurStrength=data.motionBlurStrength;
  if(typeof data.sunBillboard === 'boolean') settings.sunBillboard=data.sunBillboard;
  if(Number.isFinite(data.creativeSprintSpeed)) settings.creativeSprintSpeed=data.creativeSprintSpeed;
  if(typeof data.autoStep === "boolean") settings.autoStep=data.autoStep;
  if(Number.isFinite(data.timeOfDay)) settings.timeOfDay=data.timeOfDay;
  if(Number.isFinite(data.timeSpeed)) settings.timeSpeed=data.timeSpeed;
  if(typeof data.dayCycle === "boolean") settings.dayCycle=data.dayCycle;
  if(typeof data.showSun === "boolean") settings.showSun=data.showSun;
  if(!settings.creative) flying=false;
  dirtyMesh=true; renderUI(); renderHealth(); renderSettings(); flash("World loaded.");
}
function loadWorldByName(name){
  const raw=localStorage.getItem(worldKey(name));
  if(!raw){ flash("World not found."); return false; }
  const data=JSON.parse(raw);
  currentWorldName=safeWorldName(name);
  applyLoadedWorld(data);
  return true;
}

function loadWorld(){
  const index=loadWorldIndex();
  if(index.length>0) return loadWorldByName(index[0].name);
  const raw=localStorage.getItem("blocklite-v4-save");
  if(!raw){ flash("No save found."); return false; }
  const data=JSON.parse(raw);
  currentWorldName="Legacy World";
  applyLoadedWorld(data);
  return true;
}
function resetInventory(){
  inventory = {};
  for (let i=1; i<BLOCKS.length; i++) inventory[i] = 0;
  hotbar = settings.creative ? [1,2,3,4,5,8,12,16,18] : [0,0,0,0,0,0,0,0,0];
  selectedSlot = 0;
}

/* Events */


function panoramaToWorldPreset(name){
  if(name==="mountains") return "mountains";
  if(name==="flat") return "flat";
  if(name==="desert") return "desert";
  return "default";
}

function refreshMenuPanoramaWorld(){
  const oldPreset = settings.worldPreset;
  const target = panoramaToWorldPreset(settings.panoramaPreset);
  settings.worldPreset = target;
  generateWorld();
  respawn();
  settings.worldPreset = oldPreset;
  dirtyMesh=true;
}


function safeBootMenuWorld(){
  try {
    if(typeof refreshMenuPanoramaWorld === "function"){
      refreshMenuPanoramaWorld();
    } else {
      generateWorld();
      respawn();
    }
  } catch(e) {
    console.warn("Menu panorama generation failed, falling back to default world:", e);
    settings.worldPreset = "default";
    generateWorld();
    respawn();
  }
  dirtyMesh = true;
}

function menuVisible(){ return menu.style.display !== "none"; }

function startGame(load=false){
  ensureAudio();
  stopMenuMusic();
  if(!load){
    generateWorld();
    resetInventory();
    health=20;
    respawn();
    dirtyMesh=true;
  } else {
    const ok=loadWorld();
    if(!ok){
      generateWorld();
      resetInventory();
      health=20;
      respawn();
      dirtyMesh=true;
    }
  }
  menu.style.display="none";
  gameStarted=true;
  settingsOpen=false;
  inventoryOpen=false;
  settingsEl.classList.add("hidden");
  invEl.classList.add("hidden");
  renderUI();
  renderHealth();
  canvas.requestPointerLock();
}
playBtn.onclick=()=>{
  createWorldMenu.classList.remove("hidden");
  menu.style.display="none";
};
loadBtn.onclick=()=>startGame(true);
worldsBtn.onclick=()=>{ menu.style.display="none"; worldMenu.classList.remove("hidden"); renderWorldMenu(); };
refreshWorldsBtn.onclick=()=>renderWorldMenu();
closeWorldsBtn.onclick=()=>{ worldMenu.classList.add("hidden"); menu.style.display="block"; updateMenuMusic(); };
confirmCreateWorldBtn.onclick=()=>{
  settings.worldPreset = $("createWorldPreset").value;
  currentWorldName = safeWorldName($("createWorldName").value);
  createWorldMenu.classList.add("hidden");
  startGame(false);
};
cancelCreateWorldBtn.onclick=()=>{
  createWorldMenu.classList.add("hidden");
  menu.style.display="block";
  updateMenuMusic();
};
menuSettingsBtn.onclick=()=>{ toggleSettings(true); };
resumeBtn.onclick=()=>toggleSettings(false);
saveSettingsBtn.onclick=()=>{ saveSettings(); toggleSettings(false); };
if($("deleteDataBtn")) $("deleteDataBtn").onclick=()=>deleteThisCopyData();
backToMenuBtn.onclick=()=>{ toggleSettings(false); menu.style.display="block"; gameStarted=false; stopWorldMusic(); updateMenuMusic(); };

$("soundToggle").onchange=e=>settings.sound=e.target.checked;
$("soundVolume").oninput=e=>{ settings.soundVolume=Number(e.target.value); $("soundVolumeLabel").textContent=settings.soundVolume+"%"; };
$("menuMusicToggle").onchange=e=>{ settings.menuMusic=e.target.checked; if(!settings.menuMusic) stopMenuMusic(); else updateMenuMusic(); };
if($("menuSongSelect")) $("menuSongSelect").onchange=e=>{ settings.menuSong=e.target.value; stopMenuMusic(); updateMenuMusic(); };
$("menuMusicVolume").oninput=e=>{ settings.menuMusicVolume=Number(e.target.value); $("menuMusicVolumeLabel").textContent=settings.menuMusicVolume+"%"; updateCustomAudioVolumes(); updateMenuMusic(); };
if($("worldMusicToggle")) $("worldMusicToggle").onchange=e=>{ settings.worldMusic=e.target.checked; updateWorldMusic(); };
if($("worldSongSelect")) $("worldSongSelect").onchange=e=>{ settings.worldSong=e.target.value; stopWorldMusic(); updateWorldMusic(); };
if($("worldMusicVolume")) $("worldMusicVolume").oninput=e=>{ settings.worldMusicVolume=Number(e.target.value); $("worldMusicVolumeLabel").textContent=settings.worldMusicVolume+"%"; updateCustomAudioVolumes(); if(typeof updateWorldMusic==="function") updateWorldMusic(); };

$("superGraphicsToggle").onchange=e=>{ settings.superGraphics=e.target.checked; applySuperGraphics(settings.superGraphics); };
$("superShadowsToggle").onchange=e=>settings.superShadows=e.target.checked;
$("superReflectionsToggle").onchange=e=>settings.superReflections=e.target.checked;
$("superBloomToggle").onchange=e=>settings.superBloom=e.target.checked;
$("superIntensity").oninput=e=>{ settings.superIntensity=Number(e.target.value); $("superIntensityLabel").textContent=settings.superIntensity+"%"; };

$("creativeBreakSpeed").oninput=e=>{
  settings.creativeBreakSpeed=Number(e.target.value);
  $("creativeBreakSpeedLabel").textContent=settings.creativeBreakSpeed >= 20 ? "Instant" : settings.creativeBreakSpeed + "x";
};

$("creativeSprintSpeed").oninput=e=>{
  settings.creativeSprintSpeed=Number(e.target.value);
  $("creativeSprintSpeedLabel").textContent=settings.creativeSprintSpeed + "x";
};

$("autoStepToggle").onchange=e=>{ settings.autoStep=e.target.checked; };

$("dayCycleToggle").onchange=e=>{ settings.dayCycle=e.target.checked; };
$("showSunToggle").onchange=e=>{ settings.showSun=e.target.checked; };
$("timeSpeed").oninput=e=>{ settings.timeSpeed=Number(e.target.value); $("timeSpeedLabel").textContent=settings.timeSpeed+"%"; };
$("timePreset").onchange=e=>{ settings.timeOfDay=timePresetValue(e.target.value); };

$("creativeToggle").onchange=e=>{
  settings.creative=e.target.checked;
  if(settings.creative) {
    flying=true;
    if(hotbar.every(v=>v===0)) hotbar=[1,2,3,4,5,8,12,16,18];
  } else {
    // Turning Creative off should immediately return the player to normal survival physics.
    flying=false;
    player.vy=0;
  }
  renderUI(); renderHealth(); renderSettings();
};
$("graphicsPreset").onchange=e=>applyPreset(e.target.value);
$("renderDistance").oninput=e=>{ settings.renderDistance=Number(e.target.value); $("renderDistanceLabel").textContent=settings.renderDistance; dirtyMesh=true; };
$("resolutionScale").oninput=e=>{ settings.resolutionScale=Number(e.target.value); $("resolutionScaleLabel").textContent=settings.resolutionScale+"%"; };
$("motionBlurToggle").onchange=e=>{ settings.motionBlur=e.target.checked; updateMotionBlur(0); };
$("motionBlurStrength").oninput=e=>{ settings.motionBlurStrength=Number(e.target.value); $("motionBlurStrengthLabel").textContent=settings.motionBlurStrength+"%"; };
$("fov").oninput=e=>{ settings.fov=Number(e.target.value); $("fovLabel").textContent=settings.fov; };
$("brightness").oninput=e=>{ settings.brightness=Number(e.target.value); $("brightnessLabel").textContent=settings.brightness+"%"; };
$("lightingContrast").oninput=e=>{ settings.lightingContrast=Number(e.target.value); $("lightingContrastLabel").textContent=settings.lightingContrast+"%"; };
$("ambientLight").oninput=e=>{ settings.ambientLight=Number(e.target.value); $("ambientLightLabel").textContent=settings.ambientLight+"%"; dirtyMesh=true; };
$("fogDensity").oninput=e=>{ settings.fogDensity=Number(e.target.value); $("fogDensityLabel").textContent=settings.fogDensity+"%"; };
$("skyWarmth").oninput=e=>{ settings.skyWarmth=Number(e.target.value); $("skyWarmthLabel").textContent=settings.skyWarmth+"%"; };
$("cloudToggle").onchange=e=>{ settings.clouds=e.target.checked; updateSkyFX(0); };
$("cloudAmount").oninput=e=>{ settings.cloudAmount=Number(e.target.value); $("cloudAmountLabel").textContent=settings.cloudAmount+"%"; updateSkyFX(0); };
$("sunGlow").oninput=e=>{ settings.sunGlow=Number(e.target.value); $("sunGlowLabel").textContent=settings.sunGlow+"%"; updateSkyFX(0); };
$("sunBillboardToggle").onchange=e=>{ settings.sunBillboard=e.target.checked; };
if($("texturePack")) $("texturePack").onchange=e=>{
  settings.texturePack=e.target.value;
  if(settings.texturePack==="custom" && Object.keys(customTextureImages).length===0){
    settings.customTexturePackEnabled=false;
    setTexturePackStatus("No custom pack loaded yet. Upload PNGs or a ZIP first.");
  } else {
    settings.customTexturePackEnabled=settings.texturePack==="custom";
  }
  rebuildBlockTextures();
};
$("texturePreset").onchange=e=>{
  settings.texturePreset=e.target.value;
  applyTexturePreset(settings.texturePreset);
  rebuildBlockTextures();
};
if($("screenFilter")) $("screenFilter").onchange=e=>{ settings.screenFilter=e.target.value; applyScreenFilter(); };
$("textureContrast").oninput=e=>{ settings.textureContrast=Number(e.target.value); $("textureContrastLabel").textContent=settings.textureContrast+"%"; };
$("textureSaturation").oninput=e=>{ settings.textureSaturation=Number(e.target.value); $("textureSaturationLabel").textContent=settings.textureSaturation+"%"; };
$("pixelSharpness").onchange=e=>{ settings.pixelSharpness=e.target.checked; canvas.style.imageRendering=settings.pixelSharpness ? "pixelated" : "auto"; };
$("fogToggle").onchange=e=>settings.fog=e.target.checked;
$("smoothToggle").onchange=e=>{ settings.smoothLighting=e.target.checked; dirtyMesh=true; };
$("panoramaToggle").onchange=e=>settings.panorama=e.target.checked;
$("panoramaPreset").onchange=e=>{ settings.panoramaPreset=e.target.value; refreshMenuPanoramaWorld(); };
$("panoramaSpeed").oninput=e=>{ settings.panoramaSpeed=Number(e.target.value); $("panoramaSpeedLabel").textContent=settings.panoramaSpeed+"%"; };
$("vignetteToggle").onchange=e=>{ settings.vignette=e.target.checked; renderSettings(); };

document.addEventListener("keydown", e=>{
  if(waitingBind){
    settings.binds[waitingBind]=e.code;
    waitingBind=null;
    renderSettings();
    e.preventDefault();
    return;
  }
  keys[e.code]=true;

  if(e.code==="Escape"){
    if(worldMenu && !worldMenu.classList.contains("hidden")){ worldMenu.classList.add("hidden"); menu.style.display="block"; updateMenuMusic(); return; }
    if(createWorldMenu && !createWorldMenu.classList.contains("hidden")){ createWorldMenu.classList.add("hidden"); menu.style.display="block"; return; }
    if(inventoryOpen) toggleInventory(false);
    else if(gameStarted) toggleSettings();
    return;
  }
  if(e.code.startsWith("Digit")){
    const n=Number(e.code.slice(5));
    if(n>=1&&n<=9){ selectedSlot=n-1; renderUI(); }
  }
  if(e.code===bind("inventory") && gameStarted) toggleInventory();
  if(e.code===bind("fly") && gameStarted && !settings.creative) flying=!flying;
  if(e.code===bind("save") && gameStarted) saveWorld();
  if(e.code===bind("load") && gameStarted) loadWorld();
});
document.addEventListener("keyup", e=>keys[e.code]=false);
document.addEventListener("mousemove", e=>{
  if(document.pointerLockElement!==canvas || inventoryOpen || settingsOpen) return;
  player.yaw-=e.movementX*0.0025;
  player.pitch-=e.movementY*0.0025;
  player.pitch=clamp(player.pitch,-1.45,1.45);
});
document.addEventListener("mousedown", e=>{
  if(document.pointerLockElement!==canvas || inventoryOpen || settingsOpen) return;
  if(e.button===0) mouseDown=true;
  if(e.button===2) placeSelected();
});
document.addEventListener("mouseup", e=>{ if(e.button===0) mouseDown=false; });
document.addEventListener("wheel", e=>{
  if(inventoryOpen || settingsOpen || !gameStarted) return;
  selectedSlot = (selectedSlot + (e.deltaY > 0 ? 1 : -1) + hotbar.length) % hotbar.length;
  renderUI();
});

function deleteThisCopyData(){
  const ok = confirm("Delete this copy's Voxels data? This resets settings and deletes saved worlds on this browser/device.");
  if(!ok) return;

  const exactKeys = [
    "blocklite-v4-save",
    "blocklite-settings",
    "voxels-settings",
    "voxels-settings-v32",
    "voxels-world-index"
  ];

  const toDelete = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(!k) continue;
    const lower = k.toLowerCase();
    if(exactKeys.includes(k) || lower.includes("voxels") || lower.includes("blocklite")){
      toDelete.push(k);
    }
  }

  for(const k of toDelete) localStorage.removeItem(k);

  alert("Voxels data deleted. The game will reload with default settings.");
  location.reload();
}



if($("profileUsername")) $("profileUsername").oninput=e=>{ settings.profileUsername=e.target.value.slice(0,18); applyProfileUI(); };
if($("profilePicture")) $("profilePicture").onchange=e=>{ settings.profilePicture=e.target.value; applyProfileUI(); };
if($("uiStylePreset")) $("uiStylePreset").onchange=e=>{ settings.uiStylePreset=e.target.value; applyProfileUI(); };



if($("applyTexturePackBtn")) $("applyTexturePackBtn").onclick=()=>applyImportedTexturePack();
if($("resetTexturePackBtn")) $("resetTexturePackBtn").onclick=()=>resetImportedTexturePack();



if($("applyMenuAudioBtn")) $("applyMenuAudioBtn").onclick=()=>applyCustomMenuAudio();
if($("resetMenuAudioBtn")) $("resetMenuAudioBtn").onclick=()=>resetCustomMenuAudio();
if($("applyWorldAudioBtn")) $("applyWorldAudioBtn").onclick=()=>applyCustomWorldAudio();
if($("resetWorldAudioBtn")) $("resetWorldAudioBtn").onclick=()=>resetCustomWorldAudio();


document.addEventListener("contextmenu", e=>e.preventDefault());

/* Render */

function resize(){
  const dpr=Math.min(devicePixelRatio||1, settings.resolutionScale / 100);
  const w=Math.floor(innerWidth*dpr), h=Math.floor(innerHeight*dpr);
  if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; }
  gl.viewport(0,0,canvas.width,canvas.height);
}
addEventListener("resize",resize);

let fps=0,last=performance.now();

function timePresetValue(name){
  if(name==="sunrise") return 0.25;
  if(name==="day") return 0.38;
  if(name==="noon") return 0.50;
  if(name==="sunset") return 0.75;
  if(name==="night") return 0.00;
  return 0.50;
}

function nearestTimePreset(t){
  const points=[
    ["night",0.00],["sunrise",0.25],["day",0.38],["noon",0.50],["sunset",0.75]
  ];
  let best="noon", bd=99;
  for(const p of points){
    let d=Math.abs(t-p[1]);
    d=Math.min(d, 1-d);
    if(d<bd){ bd=d; best=p[0]; }
  }
  return best;
}

function sunVector(){
  // East-to-west sun path.
  // x: east/west movement, y: height above horizon, z: slight southern tilt.
  const a = settings.timeOfDay * Math.PI * 2 - Math.PI/2;
  return [Math.cos(a), Math.sin(a), -0.25];
}

function sunHeight(){
  return sunVector()[1];
}

function daylightAmount(){
  return clamp((sunHeight()+0.12)/0.92, 0, 1);
}

function sunriseSunsetAmount(){
  const h=sunHeight();
  return clamp(1 - Math.abs(h)/0.35, 0, 1);
}

function updateTimeOfDay(dt){
  if(settings.dayCycle && gameStarted){
    // At 100%, one full day lasts about 8 real minutes.
    settings.timeOfDay = (settings.timeOfDay + dt * (settings.timeSpeed/100) / 480) % 1;
  }
}

function drawSky(t){
  const day=daylightAmount();
  const horizon=sunriseSunsetAmount();
  const night=1-day;
  const warm=(settings.skyWarmth-100)/100;
  const superBoost=settings.superGraphics ? 0.08 : 0.0;

  // Blue near noon, black at night, colorful at sunrise/sunset.
  const noonSky=[0.42+superBoost,0.66+superBoost*0.35,0.96+superBoost*0.2];
  const nightSky=[0.004,0.006,0.018];
  const sunsetSky=[0.95+warm*0.08,0.34+warm*0.04,0.12];

  let sky=[
    lerp(nightSky[0], noonSky[0], day),
    lerp(nightSky[1], noonSky[1], day),
    lerp(nightSky[2], noonSky[2], day)
  ];

  sky[0]=lerp(sky[0], sunsetSky[0], horizon*0.72);
  sky[1]=lerp(sky[1], sunsetSky[1], horizon*0.62);
  sky[2]=lerp(sky[2], sunsetSky[2], horizon*0.42);

  gl.clearColor(sky[0],sky[1],sky[2],1);
  gl.useProgram(program);
  gl.uniform3f(skyLoc, sky[0],sky[1],sky[2]);
  gl.uniform1f(fogLoc, settings.fog ? 1 : 0);
  gl.uniform1f(brightLoc, (settings.brightness / 100) * (0.25 + day*0.85) * (settings.superGraphics ? 1.08 : 1.0));
  gl.uniform1f(contrastLoc, (settings.lightingContrast / 100) * (settings.superGraphics ? 1.08 : 1.0));
  gl.uniform1f(fogDensityLoc, settings.fogDensity / 100);
  gl.uniform1f(textureContrastLoc, settings.textureContrast / 100);
  gl.uniform1f(textureSaturationLoc, settings.textureSaturation / 100);
  const sv=sunVector();
  gl.uniform1f(superShadowsLoc, settings.superGraphics && settings.superShadows && day>0.05 ? 1 : 0);
  gl.uniform1f(superReflectionsLoc, settings.superGraphics && settings.superReflections ? day : 0);
  gl.uniform1f(superBloomLoc, settings.superGraphics && settings.superBloom ? 1 : 0);
  gl.uniform1f(superIntensityLoc, settings.superIntensity / 100);
  gl.uniform3f(sunDirLoc, sv[0], Math.max(0.02, sv[1]), sv[2]);
  return sky;
}

function drawMesh(proj, view){
  gl.useProgram(program);
  gl.uniformMatrix4fv(projLoc,false,proj);
  gl.uniformMatrix4fv(viewLoc,false,view);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlas);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const stride=6*4;
  gl.enableVertexAttribArray(posLoc); gl.vertexAttribPointer(posLoc,3,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(uvLoc); gl.vertexAttribPointer(uvLoc,2,gl.FLOAT,false,stride,3*4);
  gl.enableVertexAttribArray(shadeLoc); gl.vertexAttribPointer(shadeLoc,1,gl.FLOAT,false,stride,5*4);
  gl.drawArrays(gl.TRIANGLES,0,vertexCount);
}

function drawCracks(proj, view){
  if(crackVertexCount<=0) return;
  gl.useProgram(crackProgram);
  gl.uniformMatrix4fv(cProjLoc,false,proj);
  gl.uniformMatrix4fv(cViewLoc,false,view);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, crackTex);
  gl.bindBuffer(gl.ARRAY_BUFFER, crackBuffer);
  const stride=6*4;
  gl.enableVertexAttribArray(cPosLoc); gl.vertexAttribPointer(cPosLoc,3,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(cUvLoc); gl.vertexAttribPointer(cUvLoc,2,gl.FLOAT,false,stride,3*4);
  gl.enableVertexAttribArray(cShadeLoc); gl.vertexAttribPointer(cShadeLoc,1,gl.FLOAT,false,stride,5*4);
  gl.disable(gl.CULL_FACE);
  gl.drawArrays(gl.TRIANGLES,0,crackVertexCount);
  gl.enable(gl.CULL_FACE);
}


function updateSkyFX(now){}


function skinColors(){
  if(settings.skinPreset==="builder") return {shirt:[0.95,0.58,0.18,1], pants:[0.18,0.28,0.62,1], skin:[0.86,0.58,0.36,1]};
  if(settings.skinPreset==="explorer") return {shirt:[0.20,0.55,0.25,1], pants:[0.32,0.22,0.12,1], skin:[0.78,0.52,0.34,1]};
  if(settings.skinPreset==="shadow") return {shirt:[0.05,0.05,0.07,1], pants:[0.02,0.02,0.03,1], skin:[0.45,0.45,0.50,1]};
  if(settings.skinPreset==="royal") return {shirt:[0.35,0.12,0.70,1], pants:[0.12,0.10,0.20,1], skin:[0.86,0.60,0.40,1]};
  return {shirt:[0.20,0.45,0.95,1], pants:[0.12,0.16,0.26,1], skin:[0.88,0.62,0.42,1]};
}

function pushBox(verts, cx, cy, cz, sx, sy, sz, color){
  const x0=cx-sx/2, x1=cx+sx/2, y0=cy-sy/2, y1=cy+sy/2, z0=cz-sz/2, z1=cz+sz/2;
  const faces=[
    [[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],
    [[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0]],
    [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],
    [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],
    [[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[x0,y0,z1]],
    [[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0]]
  ];
  for(const f of faces){
    for(const i of [0,1,2,0,2,3]){
      const p=f[i];
      verts.push(p[0],p[1],p[2],color[0],color[1],color[2],color[3]);
    }
  }
}

function drawPlayerModel(proj, view){
  if(settings.cameraMode===0 || !gameStarted || typeof skyProgram === "undefined") return;
  const c=skinColors();
  const verts=[];
  const x=player.x, y=player.y, z=player.z;
  pushBox(verts,x,y+1.55,z,0.55,0.45,0.55,c.skin);
  pushBox(verts,x,y+1.05,z,0.70,0.72,0.36,c.shirt);
  pushBox(verts,x-0.20,y+0.42,z,0.25,0.82,0.28,c.pants);
  pushBox(verts,x+0.20,y+0.42,z,0.25,0.82,0.28,c.pants);
  pushBox(verts,x-0.48,y+1.04,z,0.20,0.70,0.24,c.skin);
  pushBox(verts,x+0.48,y+1.04,z,0.20,0.70,0.24,c.skin);

  gl.useProgram(skyProgram);
  gl.uniformMatrix4fv(skyProjLoc,false,proj);
  gl.uniformMatrix4fv(skyViewLoc,false,view);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
  const stride=7*4;
  gl.enableVertexAttribArray(skyPosLoc);
  gl.vertexAttribPointer(skyPosLoc,3,gl.FLOAT,false,stride,0);
  gl.enableVertexAttribArray(skyColorLoc);
  gl.vertexAttribPointer(skyColorLoc,4,gl.FLOAT,false,stride,3*4);
  gl.disable(gl.CULL_FACE);
  gl.drawArrays(gl.TRIANGLES,0,verts.length/7);
  gl.enable(gl.CULL_FACE);
}

function renderFrame(now, panorama=false){
  resize();
  const t=now/1000;
  drawSky(t);
  const aspect=canvas.width/canvas.height;
  const proj=mat4Perspective((settings.fov || 75) * Math.PI / 180,aspect,0.05,180);

  let eye, center;
  if(panorama && settings.panorama){
    const spin=(settings.panoramaSpeed || 100)/100;
    const yaw=t*0.16*spin;
    let px=WORLD_X/2, pz=WORLD_Z/2, py=findSurfaceY(px,pz)+9;
    if(settings.panoramaPreset==="mountains"){ px=WORLD_X/2+36; pz=WORLD_Z/2-32; py=findSurfaceY(px,pz)+26; }
    if(settings.panoramaPreset==="desert"){ px=WORLD_X/2-44; pz=WORLD_Z/2+28; py=findSurfaceY(px,pz)+13; }
    if(settings.panoramaPreset==="flat"){ px=WORLD_X/2; pz=WORLD_Z/2; py=findSurfaceY(px,pz)+5; }
    if(settings.panoramaPreset==="classic"){ px=WORLD_X/2; pz=WORLD_Z/2; py=findSurfaceY(px,pz)+10; }
    const orbit = settings.panoramaPreset==="flat" ? 20 : 14;
    eye=[px + Math.sin(t*0.07*spin)*orbit, py, pz + Math.cos(t*0.07*spin)*orbit];
    center=[px + Math.sin(yaw)*32, eye[1]-(settings.panoramaPreset==="mountains" ? 8 : 4.5), pz + Math.cos(yaw)*32];
  } else {
    const f=getForward();
    const headY=player.y+(keys[settings.binds.crouch] && !settings.creative ? 1.05 : 1.55);
    eye=[player.x,headY,player.z];
    center=[eye[0]+f[0],eye[1]+f[1],eye[2]+f[2]];
  }
  const view=mat4LookAt(eye,center,[0,1,0]);
  drawSkyObjects(proj, view);
  drawMesh(proj, view);
  if(!panorama) drawCracks(proj, view);
}


function updateMotionBlur(dt){
  if(!motionBlurLayer) return;
  lookMotion=Math.max(0, lookMotion - dt*5.5);
  if(!settings.motionBlur || !gameStarted || settingsOpen || inventoryOpen){
    motionBlurLayer.classList.remove("active");
    motionBlurLayer.style.backdropFilter="blur(0px)";
    motionBlurLayer.style.webkitBackdropFilter="blur(0px)";
    return;
  }
  const amount=lookMotion * (settings.motionBlurStrength/100);
  if(amount>0.025){
    const px=(amount*7.5).toFixed(2);
    motionBlurLayer.classList.add("active");
    motionBlurLayer.style.backdropFilter=`blur(${px}px)`;
    motionBlurLayer.style.webkitBackdropFilter=`blur(${px}px)`;
    motionBlurLayer.style.opacity=Math.min(0.42, amount*0.55).toFixed(2);
  } else {
    motionBlurLayer.classList.remove("active");
    motionBlurLayer.style.backdropFilter="blur(0px)";
    motionBlurLayer.style.webkitBackdropFilter="blur(0px)";
  }
}

function loop(now){
  const dt=Math.min((now-last)/1000,0.05); last=now; fps=lerp(fps,1/Math.max(dt,0.001),0.05);

  if(gameStarted) {
    updateTimeOfDay(dt);
    updatePlayer(dt);
    updateBreaking(dt);
  } else {
    resetBreak();
  }

  if(dirtyMesh) buildMesh();

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

  renderFrame(now, menuVisible());
  updateSkyFX(now);

  tempTimer=Math.max(0,tempTimer-dt);
  const sel=hotbar[selectedSlot];
  const selName=sel ? BLOCKS[sel].name : "Empty";
  const mode=settings.creative ? "Creative" : "Survival";
  const stance=(keys[settings.binds.crouch] && !settings.creative) ? "Crouch" : ((keys[settings.binds.sprint] && !settings.creative) ? "Sprint" : (flying ? "Fly" : "Walk"));
  statsEl.textContent=`FPS ${fps.toFixed(0)} · ${mode} · XYZ ${player.x.toFixed(1)}, ${player.y.toFixed(1)}, ${player.z.toFixed(1)} · ${stance} · ${settings.preset} · ${selName}${tempTimer>0?" · "+tempMessage:""}`;

  updateMenuMusic();
applyProfileUI();

loadCustomTextureStorage().then(()=>{
  if(settings.customTexturePackEnabled){
    settings.texturePack="custom";
    rebuildBlockTextures();
    renderSettings();
  }
});

loadCustomAudioStorage().then(()=>{ updateMenuMusic(); });
requestAnimationFrame(loop);
}

/* Boot */

loadSettings();
sanitizeSettings();
settings.cameraMode=0; // v16 forced first-person
safeBootMenuWorld();
resetInventory();
renderUI();
renderHealth();
renderSettings();
setupTabs();
updateSkyFX(0);
buildMesh();
updateMenuMusic();
requestAnimationFrame(loop);
