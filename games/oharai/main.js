// =============================================
//  3D 100面ダイス × 100個 シミュレーター
//  Three.js + Cannon-es
// =============================================
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// --- Config ---
const DICE_COUNT = 100;
const BOARD_SIZE = 50;
const WALL_HEIGHT = 4;
const DICE_RADIUS = 1.4;
const GRAVITY = -60;
const SLEEP_SPEED_LIMIT = 0.8;
const SLEEP_TIME_LIMIT = 0.3;

// --- DOM ---
const canvas = document.getElementById('dice-canvas');
const rollBtn = document.getElementById('roll-btn');
const statusText = document.getElementById('status-text');
const resultsPanel = document.getElementById('results-panel');
const actionBtns = document.getElementById('action-btns');
const screenshotBtn = document.getElementById('screenshot-btn');
const shareBtn = document.getElementById('share-btn');
const resultsGrid = document.getElementById('results-grid');

// --- Three.js Scene ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a12);
scene.fog = new THREE.FogExp2(0x0a0a12, 0.007);

// Camera – overhead angled view
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 55, 35);
camera.lookAt(0, 0, 0);

// --- Lighting (盤面ライトアップ) ---
const ambientLight = new THREE.AmbientLight(0x334455, 0.15);
scene.add(ambientLight);

// メインライト（上方から盤面全体を照らす）
const dirLight = new THREE.DirectionalLight(0xffe4a0, 0.2);
dirLight.position.set(10, 50, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -BOARD_SIZE;
dirLight.shadow.camera.right = BOARD_SIZE;
dirLight.shadow.camera.top = BOARD_SIZE;
dirLight.shadow.camera.bottom = -BOARD_SIZE;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
scene.add(dirLight);

// フィルライト（影を柔らかくする）
const fillLight = new THREE.DirectionalLight(0x8899bb, 0);
fillLight.position.set(-15, 30, -10);
scene.add(fillLight);

// 盤面中央のスポットライト（メイン — 丸い光の円を作る）
// decay:0 で距離減衰を無効化（Three.js r162 物理ベースライティング対策）
const spotLight = new THREE.SpotLight(0xffe8a0, 0, 0, Math.PI / 8, 0.85, 0);
spotLight.position.set(0, 55, 0);
spotLight.target.position.set(0, 0, 0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(1024, 1024);
scene.add(spotLight);
scene.add(spotLight.target);

// サブスポットライト（広めに盤面全体をカバー）
const spotLight2 = new THREE.SpotLight(0xffdfa0, 0, 0, Math.PI / 3, 0.4, 0);
spotLight2.position.set(0, 50, 5);
spotLight2.target.position.set(0, 0, 0);
scene.add(spotLight2);
scene.add(spotLight2.target);

// バックライト
const rimLight = new THREE.PointLight(0x445577, 0, 0, 0);
rimLight.position.set(0, 25, -25);
scene.add(rimLight);

// 四隅のアクセントライト
const bh = BOARD_SIZE / 2;
const cornerColors = [0xcc7733, 0x335588, 0xcc7733, 0x335588];
const cornerPositions = [
  [-bh, 12, -bh], [bh, 12, -bh], [-bh, 12, bh], [bh, 12, bh]
];
const cornerLights = [];
cornerPositions.forEach((pos, i) => {
  const cl = new THREE.PointLight(cornerColors[i], 0, 0, 0);
  cl.position.set(...pos);
  scene.add(cl);
  cornerLights.push(cl);
});

// --- ライト目標強度 ---
const LIGHT_TARGETS = {
  ambient: 0.8,
  dir: 0.6,
  fill: 0.3,
  spot: 5.0,
  spot2: 0.6,
  rim: 3.0,
  corner: 4.0,
};
let lightsAreOn = false;

// --- ライト点灯アニメーション ---
function lightsOn() {
  return new Promise(resolve => {
    if (lightsAreOn) { resolve(); return; }
    lightsAreOn = true;
    const duration = 400; // ms
    const start = performance.now();
    function tick() {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out quad
      const e = 1 - (1 - t) * (1 - t);
      ambientLight.intensity = LIGHT_TARGETS.ambient * e;
      dirLight.intensity = LIGHT_TARGETS.dir * e;
      fillLight.intensity = LIGHT_TARGETS.fill * e;
      spotLight.intensity = LIGHT_TARGETS.spot * e;
      spotLight2.intensity = LIGHT_TARGETS.spot2 * e;
      rimLight.intensity = LIGHT_TARGETS.rim * e;
      cornerLights.forEach(cl => cl.intensity = LIGHT_TARGETS.corner * e);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });
}

// --- Physics World ---
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, GRAVITY, 0),
  allowSleep: true,
});
world.defaultContactMaterial.friction = 0.4;
world.defaultContactMaterial.restitution = 0.5;

// --- Board (ground plane) ---
const boardGeo = new THREE.BoxGeometry(BOARD_SIZE, 0.5, BOARD_SIZE);
const boardMat = new THREE.MeshStandardMaterial({
  color: 0x064a20,
  roughness: 0.65,
  metalness: 0.1,
});
const boardMesh = new THREE.Mesh(boardGeo, boardMat);
boardMesh.position.y = -0.25;
boardMesh.receiveShadow = true;
scene.add(boardMesh);

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(new CANNON.Vec3(BOARD_SIZE / 2, 0.25, BOARD_SIZE / 2)),
});
groundBody.position.set(0, -0.25, 0);
world.addBody(groundBody);

// --- Walls ---
const wallMeshes = [];
const wallBodies = [];
function createWall(x, y, z, sx, sy, sz) {
  const geo = new THREE.BoxGeometry(sx * 2, sy * 2, sz * 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x3a2218,
    roughness: 0.35,
    metalness: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  wallMeshes.push(mesh);

  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Box(new CANNON.Vec3(sx, sy, sz)),
  });
  body.position.set(x, y, z);
  world.addBody(body);
  wallBodies.push(body);
}

const hw = BOARD_SIZE / 2;
const wt = 0.5; // wall thickness
createWall(hw + wt, WALL_HEIGHT / 2, 0, wt, WALL_HEIGHT / 2, hw + wt);
createWall(-hw - wt, WALL_HEIGHT / 2, 0, wt, WALL_HEIGHT / 2, hw + wt);
createWall(0, WALL_HEIGHT / 2, hw + wt, hw + wt, WALL_HEIGHT / 2, wt);
createWall(0, WALL_HEIGHT / 2, -hw - wt, hw + wt, WALL_HEIGHT / 2, wt);

// --- Dice Geometry (icosphere subdivided – looks like d100) ---
const diceBaseGeo = new THREE.IcosahedronGeometry(DICE_RADIUS, 2);

// Create grayscale textures for dice (3 tones)
function createDiceTexture(lightness) {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');

  // Background
  ctx.fillStyle = `hsl(0, 0%, ${lightness}%)`;
  ctx.fillRect(0, 0, size, size);

  // Subtle noise/grain
  for (let i = 0; i < 600; i++) {
    const nx = Math.random() * size;
    const ny = Math.random() * size;
    const shade = lightness + (Math.random() - 0.5) * 8;
    ctx.fillStyle = `hsl(0, 0%, ${shade}%)`;
    ctx.fillRect(nx, ny, 1.5, 1.5);
  }

  return new THREE.CanvasTexture(c);
}

// --- Dice Storage ---
const diceData = []; // { mesh, body, result }

function createDice(index) {
  // 3 tones: pure black(2%), near-black gray(12%), gray-white(45%)
  const tones = [0, 12, 45];
  const lightness = tones[Math.floor(Math.random() * tones.length)];
  const texture = createDiceTexture(lightness);

  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.2 + Math.random() * 0.15,
    metalness: 0.3 + Math.random() * 0.2,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(diceBaseGeo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // Physics body – sphere collider
  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Sphere(DICE_RADIUS),
    sleepSpeedLimit: SLEEP_SPEED_LIMIT,
    sleepTimeLimit: SLEEP_TIME_LIMIT,
    linearDamping: 0.4,
    angularDamping: 0.45,
  });
  world.addBody(body);

  return { mesh, body, result: null };
}

// --- Spawn Dice ---
function spawnDice() {
  // Clear previous
  for (const d of diceData) {
    scene.remove(d.mesh);
    world.removeBody(d.body);
    d.mesh.geometry !== diceBaseGeo && d.mesh.geometry.dispose();
    d.mesh.material.dispose();
  }
  diceData.length = 0;

  // Shuffle lightness order
  const indices = Array.from({ length: DICE_COUNT }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  for (let i = 0; i < DICE_COUNT; i++) {
    const d = createDice(indices[i]);
    diceData.push(d);

    // Position: grid-like with randomness, above the board
    const cols = 10;
    const row = Math.floor(i / cols);
    const col = i % cols;
    const spread = BOARD_SIZE * 0.6;
    const startX = -spread / 2;
    const startZ = -spread / 2;
    const cellSize = spread / cols;

    d.body.position.set(
      startX + col * cellSize + (Math.random() - 0.5) * cellSize * 0.6,
      12 + Math.random() * 10,
      startZ + row * cellSize + (Math.random() - 0.5) * cellSize * 0.6
    );

    // Random rotation and angular velocity for dramatic rolling
    d.body.quaternion.setFromEuler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    d.body.angularVelocity.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30
    );
    d.body.velocity.set(
      (Math.random() - 0.5) * 18,
      -Math.random() * 5,
      (Math.random() - 0.5) * 18
    );
  }
}

// --- 落下閾値 ---
const FALL_THRESHOLD = -20;

// --- Check if all dice have settled (sleeping or fallen off) ---
function allDiceSettled() {
  return diceData.every(d =>
    d.body.sleepState === CANNON.Body.SLEEPING || d.body.position.y < FALL_THRESHOLD
  );
}

// --- Check if any dice fell off the board ---
function checkDiceFallen() {
  return diceData.some(d => d.body.position.y < FALL_THRESHOLD);
}

// --- Generate Results ---
let debugMode = null; // null | 'crit' | 'fumble' | 'explosion' | 'neutral' | 'fallen'

function generateResults() {
  const results = [];
  if (debugMode === 'crit') {
    // クリティカル多め（15個クリティカル、3個ファンブル）
    for (let i = 0; i < 15; i++) results.push(Math.floor(Math.random() * 5) + 1);
    for (let i = 0; i < 3; i++) results.push(Math.floor(Math.random() * 5) + 96);
    for (let i = 0; i < DICE_COUNT - 18; i++) results.push(Math.floor(Math.random() * 90) + 6);
  } else if (debugMode === 'fumble') {
    // ファンブル多め（3個クリティカル、15個ファンブル）
    for (let i = 0; i < 3; i++) results.push(Math.floor(Math.random() * 5) + 1);
    for (let i = 0; i < 15; i++) results.push(Math.floor(Math.random() * 5) + 96);
    for (let i = 0; i < DICE_COUNT - 18; i++) results.push(Math.floor(Math.random() * 90) + 6);
  } else if (debugMode === 'explosion') {
    // 爆発（ファンブル12個以上）
    for (let i = 0; i < 2; i++) results.push(Math.floor(Math.random() * 5) + 1);
    for (let i = 0; i < 12; i++) results.push(Math.floor(Math.random() * 5) + 96);
    for (let i = 0; i < DICE_COUNT - 14; i++) results.push(Math.floor(Math.random() * 90) + 6);
  } else if (debugMode === 'neutral') {
    // 同数（クリファン各5個）
    for (let i = 0; i < 5; i++) results.push(Math.floor(Math.random() * 5) + 1);
    for (let i = 0; i < 5; i++) results.push(Math.floor(Math.random() * 5) + 96);
    for (let i = 0; i < DICE_COUNT - 10; i++) results.push(Math.floor(Math.random() * 90) + 6);
  } else {
    for (let i = 0; i < DICE_COUNT; i++) {
      results.push(Math.floor(Math.random() * 100) + 1);
    }
  }
  // シャッフル
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  debugMode = null; // 使い捨て
  return results;
}

// --- Display Results ---
function displayResults(results) {
  resultsGrid.innerHTML = '';
  resultsPanel.classList.add('visible');

  // モバイル縦画面: results-panelを画面下部に押し込んで演出用スペースを確保
  if (window.innerWidth <= 600) {
    // ビューポートの上52%をメッセージ＋stats用に空ける
    resultsPanel.style.height = '48vh';
    resultsPanel.style.maxHeight = '48vh';
    resultsPanel.style.overflowY = 'hidden';
  }

  results.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = 'dice-cell';
    cell.textContent = val;
    cell.style.animationDelay = `${i * 20}ms`;

    if (val >= 1 && val <= 5) {
      cell.classList.add('critical');
    } else if (val >= 96 && val <= 100) {
      cell.classList.add('fumble');
    }

    resultsGrid.appendChild(cell);
  });
}

// --- Hide Results ---
function hideResults() {
  resultsPanel.classList.remove('visible');
  // モバイル用スタイルリセット
  resultsPanel.style.height = '';
  resultsPanel.style.maxHeight = '';
  resultsPanel.style.overflowY = '';
  resultsGrid.innerHTML = '';
  actionBtns.classList.remove('visible');
  // 演出オーバーレイをクリア
  document.querySelectorAll('.celebration-overlay, .disappointment-overlay, .neutral-overlay, .stats-overlay, .explosion-overlay, .explosion-flash, .fallen-overlay').forEach(el => el.remove());
}

// --- 最終結果を保持（共有用） ---
let lastCritCount = 0;
let lastFumbleCount = 0;
let lastAvg = '0';
let lastResults = [];
let lastResultType = 'neutral'; // 'celebration' | 'disappointment' | 'neutral' | 'explosion' | 'fallen'

// --- スクリーンショット撮影 ---
async function takeScreenshot() {
  // 最新フレームをレンダリング（preserveDrawingBufferで読み取り可能）
  renderer.render(scene, camera);

  // アニメーション要素を最終状態に強制（html2canvas対策）
  const app = document.getElementById('app');
  app.classList.add('screenshot-mode');

  try {
    const { default: html2canvas } = await import('https://esm.sh/html2canvas@1.4.1');
    const capturedCanvas = await html2canvas(app, {
      backgroundColor: '#0a0a12',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // 16:9 にクロップ（中央基準）
    const srcW = capturedCanvas.width;
    const srcH = capturedCanvas.height;
    const targetRatio = 16 / 9;
    const currentRatio = srcW / srcH;

    let cropX = 0, cropY = 0, cropW = srcW, cropH = srcH;
    if (currentRatio > targetRatio) {
      // 横長すぎ → 左右をトリミング
      cropW = Math.round(srcH * targetRatio);
      cropX = Math.round((srcW - cropW) / 2);
    } else {
      // 縦長すぎ → 上下をトリミング
      cropH = Math.round(srcW / targetRatio);
      cropY = Math.round((srcH - cropH) / 2);
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = cropW;
    finalCanvas.height = cropH;
    const fCtx = finalCanvas.getContext('2d');
    fCtx.drawImage(capturedCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // ダウンロード
    const link = document.createElement('a');
    link.download = `oharai_${Date.now()}.png`;
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
  } finally {
    app.classList.remove('screenshot-mode');
  }
}

// --- X(Twitter)共有 ---
function shareToX() {
  let text;
  if (lastResultType === 'fallen') {
    text = [
      '🎲 お祓いシミュレーター 結果',
      '',
      '🎲⬇️ ダイス落ちた・・・',
      '',
      '#お祓いシミュレーター',
    ].join('\n');
  } else {
    text = [
      '🎲 お祓いシミュレーター 結果',
      `✨ クリティカル(1-5): ${lastCritCount}個`,
      `💀 ファンブル(96-100): ${lastFumbleCount}個`,
      `📊 平均値: ${lastAvg}`,
      '',
      lastCritCount > lastFumbleCount ? '🎉 お祓い成功！' :
        lastFumbleCount > lastCritCount ? '💀 お祓い失敗…' : '🤷 まあまあやね',
      '',
      '#お祓いシミュレーター',
    ].join('\n');
  }

  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// --- 絵文字サイズヘルパー（スマホでスケールダウン） ---
function emojiScale(baseMin, baseMax) {
  const w = window.innerWidth;
  // モバイルでは大幅縮小: statsの視認性を確保
  const factor = w <= 480 ? 0.22 : w <= 600 ? 0.30 : w <= 900 ? 0.55 : 1.0;
  return `${(baseMin + Math.random() * (baseMax - baseMin)) * factor}rem`;
}

// --- モバイル判定ヘルパー ---
const isMobileView = () => window.innerWidth <= 600;

// --- 統計情報の派手なオーバーレイ表示 ---
function showStatsOverlay(critCount, fumbleCount, avg) {
  document.querySelectorAll('.stats-overlay').forEach(el => el.remove());

  const overlay = document.createElement('div');
  overlay.className = 'stats-overlay';
  document.getElementById('app').appendChild(overlay);

  const isMobile = window.innerWidth <= 600;

  const container = document.createElement('div');
  container.className = 'stats-container';
  if (isMobile) {
    // gridで [クリティカル|VS|ファンブル] + [平均値] を強制制御
    // flexWrap:nowrap でCSSの flex-wrap:wrap との競合を解消
    Object.assign(container.style, {
      display: 'grid',
      flexWrap: 'nowrap',
      gridTemplateColumns: '1fr auto 1fr',
      gridTemplateRows: 'auto auto',
      width: '100%',
      padding: isMobile && window.innerWidth <= 480 ? '8px 4px' : '10px 8px',
      gap: '4px 3px',
      borderRadius: '0',
      boxSizing: 'border-box',
    });
  }

  // 全サイズ共通: flex-startにしてrAFでメッセージ下に動的配置
  Object.assign(overlay.style, {
    alignItems: 'flex-start',
    paddingTop: '0',
  });
  requestAnimationFrame(() => {
    const app = document.getElementById('app');
    if (!app) return;
    const appRect = app.getBoundingClientRect();
    const msg = document.querySelector('.result-message');
    let statsTop;
    if (msg) {
      const msgRect = msg.getBoundingClientRect();
      statsTop = msgRect.bottom - appRect.top + (isMobile ? 10 : 20);
    } else {
      const uiOverlay = document.getElementById('overlay');
      const btnBottom = uiOverlay ? uiOverlay.getBoundingClientRect().bottom - appRect.top : 150;
      statsTop = btnBottom + (isMobile ? 50 : 60);
    }
    overlay.style.paddingTop = `${statsTop}px`;
  });
  overlay.appendChild(container);

  const boxPad = isMobile ? (window.innerWidth <= 480 ? '6px 4px' : '8px 6px') : null;
  const countSize = isMobile ? (window.innerWidth <= 480 ? '1.5rem' : '1.8rem') : null;
  const labelSize = isMobile ? (window.innerWidth <= 480 ? '0.52rem' : '0.6rem') : null;
  const unitSize = isMobile ? (window.innerWidth <= 480 ? '0.58rem' : '0.65rem') : null;

  // クリティカル
  const critBox = document.createElement('div');
  critBox.className = 'stats-box stats-critical';
  critBox.innerHTML = `<div class="stats-label">✨ クリティカル<br><small>(1-5)</small></div><div class="stats-count">${critCount}</div><div class="stats-unit">個</div>`;
  if (isMobile) {
    Object.assign(critBox.style, { padding: boxPad, minWidth: '0' });
    critBox.style.gridRow = '1';
    critBox.querySelector('.stats-count').style.fontSize = countSize;
    critBox.querySelector('.stats-label').style.fontSize = labelSize;
    critBox.querySelector('.stats-unit').style.fontSize = unitSize;
  }
  container.appendChild(critBox);

  // VS
  const vs = document.createElement('div');
  vs.className = 'stats-vs';
  vs.textContent = 'VS';
  if (isMobile) {
    Object.assign(vs.style, {
      gridRow: '1',
      alignSelf: 'center',
      fontSize: window.innerWidth <= 480 ? '0.72rem' : '0.85rem',
      padding: '0 2px',
      textAlign: 'center',
    });
  }
  container.appendChild(vs);

  // ファンブル
  const fumbleBox = document.createElement('div');
  fumbleBox.className = 'stats-box stats-fumble';
  fumbleBox.innerHTML = `<div class="stats-label">💀 ファンブル<br><small>(96-100)</small></div><div class="stats-count">${fumbleCount}</div><div class="stats-unit">個</div>`;
  if (isMobile) {
    Object.assign(fumbleBox.style, { padding: boxPad, minWidth: '0' });
    fumbleBox.style.gridRow = '1';
    fumbleBox.querySelector('.stats-count').style.fontSize = countSize;
    fumbleBox.querySelector('.stats-label').style.fontSize = labelSize;
    fumbleBox.querySelector('.stats-unit').style.fontSize = unitSize;
  }
  container.appendChild(fumbleBox);

  // 平均値
  const avgBox = document.createElement('div');
  avgBox.className = 'stats-avg';
  avgBox.innerHTML = `<span class="stats-avg-label">平均値</span><span class="stats-avg-value">${avg}</span>`;
  if (isMobile) {
    Object.assign(avgBox.style, {
      gridColumn: '1 / -1',
      gridRow: '2',
      textAlign: 'center',
      marginTop: '2px',
    });
    avgBox.querySelector('.stats-avg-value').style.fontSize = window.innerWidth <= 480 ? '1rem' : '1.2rem';
    avgBox.querySelector('.stats-avg-label').style.fontSize = window.innerWidth <= 480 ? '0.62rem' : '0.72rem';
  }
  container.appendChild(avgBox);
}

// --- リザルトメッセージ動的配置ヘルパー（全サイズ対応） ---
function applyMobileMsgStyle(msg) {
  const w = window.innerWidth;

  // モバイル: コンパクトなスタイルを適用
  if (w <= 600) {
    const fs = w <= 480 ? `${w * 0.038}px` : `${w * 0.042}px`;
    Object.assign(msg.style, {
      fontSize: fs,
      whiteSpace: 'normal',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      textAlign: 'center',
      width: '100%',
      left: '0',
      right: '0',
      top: '20%',
      padding: '0 16px',
      letterSpacing: '0',
      boxSizing: 'border-box',
      transform: 'scale(0)',
      animation: 'messagePopInMobile 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards',
    });
  }

  // 全サイズ共通: ボタン行の下端に基づいて動的配置
  requestAnimationFrame(() => {
    const app = document.getElementById('app');
    const uiOverlay = document.getElementById('overlay');
    if (!app || !uiOverlay) return;

    const appRect = app.getBoundingClientRect();
    const btnBottom = uiOverlay.getBoundingClientRect().bottom - appRect.top;
    const gap = w <= 600 ? 12 : 10;
    msg.style.top = `${btnBottom + gap}px`;
  });
}

// --- おめでとう演出（紙吹雪 + 🎉）---
function showCelebration() {
  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  document.getElementById('app').appendChild(overlay);

  // 紙吹雪パーティクル
  const confettiColors = ['#ffd700', '#ff6b35', '#ff1493', '#00ff88', '#00bfff', '#fff'];
  for (let i = 0; i < 80; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    particle.style.animationDelay = `${Math.random() * 2}s`;
    particle.style.animationDuration = `${2 + Math.random() * 2}s`;
    particle.style.width = `${6 + Math.random() * 8}px`;
    particle.style.height = `${4 + Math.random() * 6}px`;
    overlay.appendChild(particle);
  }

  // 🎉 絵文字バースト（モバイルでは個数・配置範囲を制限）
  const emojis = ['🎉', '🎊', '✨', '🏆', '⭐'];
  const emojiCount = isMobileView() ? 5 : 12;
  for (let i = 0; i < emojiCount; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'celebration-emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${10 + Math.random() * 80}%`;
    // モバイル: 画面上部のみ（stats領域を避ける）
    emoji.style.top = isMobileView() ? `${5 + Math.random() * 20}%` : `${20 + Math.random() * 40}%`;
    emoji.style.animationDelay = `${Math.random() * 1}s`;
    emoji.style.fontSize = emojiScale(2, 5);
    overlay.appendChild(emoji);
  }

  // メッセージ
  const msg = document.createElement('div');
  msg.className = 'result-message celebration-message';
  msg.textContent = '🎉 クリティカルの方が多い！ 🎉';
  applyMobileMsgStyle(msg);
  overlay.appendChild(msg);
}

// --- がっかり演出（紫の雨 + 💀）---
function showDisappointment() {
  const overlay = document.createElement('div');
  overlay.className = 'disappointment-overlay';
  document.getElementById('app').appendChild(overlay);

  // 紫の雨パーティクル
  for (let i = 0; i < 50; i++) {
    const drop = document.createElement('div');
    drop.className = 'purple-rain';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    drop.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    drop.style.opacity = 0.3 + Math.random() * 0.5;
    overlay.appendChild(drop);
  }

  // 💀 絵文字（モバイルでは個数・配置範囲を制限）
  const emojis = ['💀', '😱', '👻', '💔', '😭'];
  const emojiCount = isMobileView() ? 4 : 8;
  for (let i = 0; i < emojiCount; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'disappointment-emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${10 + Math.random() * 80}%`;
    emoji.style.top = isMobileView() ? `${5 + Math.random() * 20}%` : `${20 + Math.random() * 40}%`;
    emoji.style.animationDelay = `${Math.random() * 1.5}s`;
    emoji.style.fontSize = emojiScale(2, 4);
    overlay.appendChild(emoji);
  }

  // メッセージ
  const msg = document.createElement('div');
  msg.className = 'result-message disappointment-message';
  msg.textContent = '💀 ファンブルの方が多い… 💀';
  applyMobileMsgStyle(msg);
  overlay.appendChild(msg);
}

// --- まあまあ演出（クリファン同数）---
function showNeutral() {
  const overlay = document.createElement('div');
  overlay.className = 'neutral-overlay';
  document.getElementById('app').appendChild(overlay);

  // 星がゆっくり降る
  for (let i = 0; i < 40; i++) {
    const star = document.createElement('div');
    star.className = 'neutral-star';
    star.textContent = '⭐';
    star.style.left = `${Math.random() * 100}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    star.style.animationDuration = `${3 + Math.random() * 3}s`;
    star.style.fontSize = emojiScale(0.8, 2);
    star.style.opacity = 0.3 + Math.random() * 0.5;
    overlay.appendChild(star);
  }

  // 🤷 絵文字
  const emojis = ['🤷', '🤔', '😐', '⚖️', '😶'];
  const emojiCount = isMobileView() ? 3 : 6;
  for (let i = 0; i < emojiCount; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'neutral-emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${15 + Math.random() * 70}%`;
    emoji.style.top = isMobileView() ? `${5 + Math.random() * 20}%` : `${25 + Math.random() * 35}%`;
    emoji.style.animationDelay = `${Math.random() * 2}s`;
    emoji.style.fontSize = emojiScale(2, 4);
    overlay.appendChild(emoji);
  }

  // メッセージ
  const msg = document.createElement('div');
  msg.className = 'result-message neutral-message';
  msg.textContent = '🤷 まあまあやね 🤷';
  applyMobileMsgStyle(msg);
  overlay.appendChild(msg);
}

// --- ダイス落下演出 ---
function showDiceFallen() {
  const overlay = document.createElement('div');
  overlay.className = 'fallen-overlay';
  document.getElementById('app').appendChild(overlay);

  // 落下パーティクル（ダイスが転がり落ちるイメージ）
  for (let i = 0; i < 35; i++) {
    const particle = document.createElement('div');
    particle.className = 'fallen-particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 3}s`;
    particle.style.animationDuration = `${2 + Math.random() * 2}s`;
    particle.style.opacity = 0.3 + Math.random() * 0.5;
    overlay.appendChild(particle);
  }

  // 絵文字
  const emojis = ['🎲', '⬇️', '💨', '😅', '🫠'];
  const emojiCount = isMobileView() ? 4 : 8;
  for (let i = 0; i < emojiCount; i++) {
    const emoji = document.createElement('div');
    emoji.className = 'fallen-emoji';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${10 + Math.random() * 80}%`;
    emoji.style.top = isMobileView() ? `${5 + Math.random() * 20}%` : `${20 + Math.random() * 40}%`;
    emoji.style.animationDelay = `${Math.random() * 1.5}s`;
    emoji.style.fontSize = emojiScale(2, 4);
    overlay.appendChild(emoji);
  }

  // メッセージ
  const msg = document.createElement('div');
  msg.className = 'result-message fallen-message';
  msg.textContent = 'ごめん、ダイス落ちた・・・';
  applyMobileMsgStyle(msg);
  overlay.appendChild(msg);
}

// --- 爆発演出（ファンブル10超え）---
function showExplosion() {
  // カメラシェイク激しく
  shakeIntensity = 8;

  // 地面を消して奈落にする（ダイスが落ちていく）
  world.removeBody(groundBody);

  // ダイスを爆発させる（物理ボディに上方への力を加える）
  for (const d of diceData) {
    d.body.wakeUp();
    d.body.velocity.set(
      (Math.random() - 0.5) * 40,
      20 + Math.random() * 30,
      (Math.random() - 0.5) * 40
    );
    d.body.angularVelocity.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50
    );
  }

  // 赤フラッシュオーバーレイ
  const flash = document.createElement('div');
  flash.className = 'explosion-flash';
  document.getElementById('app').appendChild(flash);

  // 爆発パーティクル
  const overlay = document.createElement('div');
  overlay.className = 'explosion-overlay';
  document.getElementById('app').appendChild(overlay);

  const explosionEmojis = ['💥', '🔥', '☄️', '💣', '🌋'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'explosion-particle';
    p.textContent = explosionEmojis[Math.floor(Math.random() * explosionEmojis.length)];
    p.style.left = `${30 + Math.random() * 40}%`;
    p.style.top = `${30 + Math.random() * 40}%`;
    p.style.fontSize = emojiScale(2, 6);
    p.style.setProperty('--dx', `${(Math.random() - 0.5) * 800}px`);
    p.style.setProperty('--dy', `${(Math.random() - 0.5) * 800}px`);
    p.style.animationDelay = `${Math.random() * 0.3}s`;
    overlay.appendChild(p);
  }

  // メッセージ
  const msg = document.createElement('div');
  msg.className = 'result-message explosion-message';
  msg.textContent = '💥 ファンブル多すぎ！💥';
  applyMobileMsgStyle(msg);
  overlay.appendChild(msg);

  // UIを吹き飛ばす（段階的に）
  // 1. ボタン類を先に吹き飛ばす
  setTimeout(() => {
    const overlayUI = document.getElementById('overlay');
    if (overlayUI) overlayUI.classList.add('explode-fly');
  }, 800);

  // 2. 統計オーバーレイ（クリティカル・ファンブル数・平均値）を遅めに
  setTimeout(() => {
    document.querySelectorAll('.stats-overlay').forEach(el => el.classList.add('explode-fly'));
  }, 2000);

  // 3. ダイス出目パネルはさらに遅く
  setTimeout(() => {
    const resultsPanel = document.getElementById('results-panel');
    if (resultsPanel) resultsPanel.classList.add('explode-fly-down');
  }, 3000);

  // Canvasを揺らすCSSアニメーション
  canvas.classList.add('explode-shake');

  // 1秒後にボード・壁・ダイスを消して深淵だけ残す
  setTimeout(() => {
    // ボードを消す
    scene.remove(boardMesh);
    // 壁を消す
    wallMeshes.forEach(m => scene.remove(m));
    wallBodies.forEach(b => world.removeBody(b));
    // ダイスを消す
    for (const d of diceData) {
      scene.remove(d.mesh);
      world.removeBody(d.body);
    }
    diceData.length = 0;
    // ライトを消して深淵
    ambientLight.intensity = 0.05;
    dirLight.intensity = 0;
    fillLight.intensity = 0;
    spotLight.intensity = 0;
    spotLight2.intensity = 0;
    rimLight.intensity = 0;
    cornerLights.forEach(cl => cl.intensity = 0);
    // フォグを濃くして完全な闇
    scene.fog = new THREE.FogExp2(0x000000, 0.05);
    scene.background = new THREE.Color(0x000000);
  }, 1200);

  // 10秒後にボタンだけ申し訳なさそうに復帰
  setTimeout(() => {
    // フラッシュのみ削除（爆発メッセージ・パーティクルは残す）
    document.querySelectorAll('.explosion-flash').forEach(el => el.remove());

    // overlayのみ吹き飛ばし解除（ボタンだけ復活）
    const overlayUI = document.getElementById('overlay');
    if (overlayUI) overlayUI.classList.remove('explode-fly');
    canvas.classList.remove('explode-shake');

    // リザルトパネル・統計をクリア（action-btnsはvisibleのまま維持）
    resultsPanel.classList.remove('visible', 'explode-fly-down');
    resultsGrid.innerHTML = '';
    document.querySelectorAll('.celebration-overlay, .disappointment-overlay, .neutral-overlay, .stats-overlay').forEach(el => el.remove());

    // ボタン復帰
    rollBtn.disabled = false;
    rolling = false;
    statusText.textContent = '';
  }, 10000);
}

// --- Camera Shake ---
let shakeIntensity = 0;
const cameraBasePos = camera.position.clone();

function updateCameraShake() {
  if (shakeIntensity > 0.01) {
    camera.position.x = cameraBasePos.x + (Math.random() - 0.5) * shakeIntensity;
    camera.position.y = cameraBasePos.y + (Math.random() - 0.5) * shakeIntensity * 0.5;
    camera.position.z = cameraBasePos.z + (Math.random() - 0.5) * shakeIntensity;
    shakeIntensity *= 0.96;
  } else {
    camera.position.copy(cameraBasePos);
    shakeIntensity = 0;
  }
}

// --- Roll State Machine ---
let rolling = false;
let settleCheckTimer = 0;
const SETTLE_CHECK_INTERVAL = 0.5; // seconds

async function roll() {
  rollBtn.disabled = true;
  rolling = true;
  hideResults();

  // 爆発後の環境復帰（ボード・壁がなければ復元）
  if (!scene.children.includes(boardMesh)) {
    scene.add(boardMesh);
    world.addBody(groundBody);
    groundBody.position.set(0, -0.25, 0);
    wallMeshes.forEach(m => scene.add(m));
    wallBodies.forEach(b => world.addBody(b));
    lightsAreOn = false;
    scene.fog = new THREE.FogExp2(0x0a0a12, 0.007);
    scene.background = new THREE.Color(0x0a0a12);
  }

  // ライト点灯演出（初回のみアニメーション）
  statusText.textContent = '';
  await lightsOn();
  await sleep(1000);

  statusText.textContent = 'ダイスを振っています...';
  spawnDice();
  shakeIntensity = 1.5;

  // Wait for all dice to settle
  await new Promise(resolve => {
    function check() {
      if (allDiceSettled()) {
        resolve();
      } else {
        setTimeout(check, 300);
      }
    }
    setTimeout(check, 1500); // minimum roll time
  });

  // --- ダイス落下チェック ---
  const diceFell = debugMode === 'fallen' ? true : checkDiceFallen();
  if (debugMode === 'fallen') debugMode = null;

  if (diceFell) {
    // 落下時: 結果を出さず落下演出のみ
    statusText.textContent = '';
    lastResultType = 'fallen';
    lastCritCount = 0;
    lastFumbleCount = 0;
    lastAvg = '0';
    lastResults = [];

    await sleep(500);
    showDiceFallen();

    // アクションボタン表示
    actionBtns.classList.add('visible');
    rolling = false;
    rollBtn.disabled = false;
    return;
  }

  // Generate and display results
  statusText.textContent = '結果を集計中...';
  await sleep(500);

  const results = generateResults();
  displayResults(results);

  // Count criticals and fumbles + average
  const critCount = results.filter(v => v >= 1 && v <= 5).length;
  const fumbleCount = results.filter(v => v >= 96 && v <= 100).length;
  const avg = (results.reduce((a, b) => a + b, 0) / results.length).toFixed(1);
  statusText.textContent = '';

  // 共有用に保持
  lastCritCount = critCount;
  lastFumbleCount = fumbleCount;
  lastAvg = avg;
  lastResults = results;

  // 統計情報を派手に表示
  showStatsOverlay(critCount, fumbleCount, avg);

  // 演出トリガー
  await sleep(800);
  if (fumbleCount >= 10) {
    lastResultType = 'explosion';
    showExplosion();
  } else if (critCount > fumbleCount) {
    lastResultType = 'celebration';
    showCelebration();
  } else if (fumbleCount > critCount) {
    lastResultType = 'disappointment';
    showDisappointment();
  } else {
    lastResultType = 'neutral';
    showNeutral();
  }

  // アクションボタン表示
  actionBtns.classList.add('visible');

  rolling = false;
  if (fumbleCount < 10) rollBtn.disabled = false;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Button Handlers ---
rollBtn.addEventListener('click', () => {
  if (!rolling) roll();
});
screenshotBtn.addEventListener('click', takeScreenshot);
shareBtn.addEventListener('click', () => {
  takeScreenshot(); // スクショもダウンロード
  shareToX();
});

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
const clock = new THREE.Clock();
const fixedTimeStep = 1 / 60;
const maxSubSteps = 3;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  world.step(fixedTimeStep, dt, maxSubSteps);

  // Sync Three.js meshes with physics bodies
  for (const d of diceData) {
    d.mesh.position.copy(d.body.position);
    d.mesh.quaternion.copy(d.body.quaternion);
  }

  updateCameraShake();
  renderer.render(scene, camera);
}

animate();

// Initial status
statusText.textContent = 'ボタンを押してダイスを振ろう';

// --- デバッグパネル (?debug=1 で表示) ---
if (new URLSearchParams(location.search).has('debug')) {
  const dp = document.getElementById('debug-panel');
  if (dp) dp.style.display = '';
}

function debugRoll(mode) {
  if (rolling) return;
  debugMode = mode;
  roll();
}

document.getElementById('debug-crit')?.addEventListener('click', () => debugRoll('crit'));
document.getElementById('debug-fumble')?.addEventListener('click', () => debugRoll('fumble'));
document.getElementById('debug-explosion')?.addEventListener('click', () => debugRoll('explosion'));
document.getElementById('debug-neutral')?.addEventListener('click', () => debugRoll('neutral'));
document.getElementById('debug-normal')?.addEventListener('click', () => debugRoll(null));
document.getElementById('debug-fallen')?.addEventListener('click', () => debugRoll('fallen'));

