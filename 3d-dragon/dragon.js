// ===== Interactive Skeletal Dragon — Realistic Anatomy =====
// Warm bone colors, proper ribcage, legs, bat-wing skeleton, realistic skull
// Mouse-following IK spine with fire breath

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const cursorEl = document.getElementById('cursor');
let W, H;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
resize();
window.addEventListener('resize', resize);

let mx = W / 2, my = H / 2, targetX = mx, targetY = my;
window.addEventListener('mousemove', e => { targetX = e.clientX; targetY = e.clientY; cursorEl.style.left = e.clientX + 'px'; cursorEl.style.top = e.clientY + 'px'; });
window.addEventListener('touchmove', e => { e.preventDefault(); targetX = e.touches[0].clientX; targetY = e.touches[0].clientY; }, { passive: false });

// ===== BONE PALETTE (warm realistic) =====
const COL = {
  bone: '#e8dcc8',   // main bone ivory
  boneLt: '#f0e6d4',   // highlight
  boneDk: '#c4ad8a',   // shadow bone
  boneLine: '#8b7355',   // outlines/cracks
  joint: '#d4c4a8',   // joint spheres
  dark: '#5c4a32',   // dark accents
  membrane: 'rgba(200,190,170,0.18)', // wing membrane
  membEdge: 'rgba(180,160,130,0.35)',
  eye: '#8b0000',   // dark red eye
  tooth: '#f5f0e5',
};

// ===== SPINE IK CHAIN =====
const SEGMENTS = 40;
const SEG_LEN = 14;
const spine = [];
for (let i = 0; i < SEGMENTS; i++) {
  spine.push({
    x: W / 2 + i * SEG_LEN, y: H / 2, angle: Math.PI,
    // Size tapers: head big, body thick, tail thin
    size: i < 5 ? 7 - i * 0.3 : (i < 20 ? 6 : Math.max(1.5, 6 - (i - 20) * 0.22))
  });
}

function updateSpine() {
  mx += (targetX - mx) * 0.1;
  my += (targetY - my) * 0.1;
  spine[0].x = mx; spine[0].y = my;
  spine[0].angle = Math.atan2(my - spine[1].y, mx - spine[1].x);
  for (let i = 1; i < SEGMENTS; i++) {
    const p = spine[i - 1], c = spine[i];
    const dx = c.x - p.x, dy = c.y - p.y;
    const a = Math.atan2(dy, dx);
    c.angle = a;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > SEG_LEN) { c.x = p.x + Math.cos(a) * SEG_LEN; c.y = p.y + Math.sin(a) * SEG_LEN; }
  }
}

// ===== Helper: draw bone segment (tube with shading) =====
function drawBoneTube(x1, y1, x2, y2, r1, r2, col) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const px = Math.cos(a + Math.PI / 2), py = Math.sin(a + Math.PI / 2);
  // Outer shape
  ctx.beginPath();
  ctx.moveTo(x1 + px * r1, y1 + py * r1);
  ctx.lineTo(x2 + px * r2, y2 + py * r2);
  ctx.lineTo(x2 - px * r2, y2 - py * r2);
  ctx.lineTo(x1 - px * r1, y1 - py * r1);
  ctx.closePath();
  ctx.fillStyle = col || COL.bone;
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Highlight stripe
  ctx.beginPath();
  ctx.moveTo(x1 + px * r1 * 0.3, y1 + py * r1 * 0.3);
  ctx.lineTo(x2 + px * r2 * 0.3, y2 + py * r2 * 0.3);
  ctx.strokeStyle = COL.boneLt;
  ctx.lineWidth = r1 * 0.5;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawJoint(x, y, r) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  grad.addColorStop(0, COL.boneLt);
  grad.addColorStop(0.6, COL.joint);
  grad.addColorStop(1, COL.boneDk);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

// ===== DRAW VERTEBRA (realistic) =====
function drawVertebra(x, y, angle, size, idx) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const w = size * 1.8, h = size * 1.2;

  // Main body
  const grad = ctx.createRadialGradient(-w * 0.2, 0, 0, 0, 0, w);
  grad.addColorStop(0, COL.boneLt);
  grad.addColorStop(0.5, COL.bone);
  grad.addColorStop(1, COL.boneDk);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Dorsal spine process
  if (idx > 2 && idx < SEGMENTS - 3) {
    const spH = size * (idx < 20 ? 1.4 : 0.8);
    ctx.fillStyle = COL.bone;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -h);
    ctx.lineTo(0, -h - spH);
    ctx.lineTo(size * 0.3, -h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.boneLine;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.restore();
}

// ===== RIBCAGE =====
function drawRibcage(time) {
  // Ribs attach to spine segments 6-18 (body area)
  for (let i = 6; i <= 18; i++) {
    const seg = spine[i];
    const t = (i - 6) / 12;
    // Rib arc size: small at ends, big in middle
    const ribLen = 30 + Math.sin(t * Math.PI) * 50;
    const wave = Math.sin(time * 2 + i * 0.4) * 2;

    ctx.save();
    ctx.translate(seg.x, seg.y);
    ctx.rotate(seg.angle);

    [-1, 1].forEach(side => {
      // Each rib is a curved bone
      const startY = 0;
      const cp1x = -ribLen * 0.15;
      const cp1y = side * ribLen * 0.5 + wave;
      const cp2x = -ribLen * 0.4;
      const cp2y = side * ribLen * 0.85 + wave;
      const endX = -ribLen * 0.2;
      const endY = side * ribLen * 0.95 + wave;

      // Rib bone
      ctx.strokeStyle = COL.boneDk;
      ctx.lineWidth = 2.5 - t * 0.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();

      // Highlight on rib
      ctx.strokeStyle = COL.boneLt;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(1, startY);
      ctx.bezierCurveTo(cp1x + 1, cp1y, cp2x + 1, cp2y, endX + 1, endY);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }

  // Sternum (connects bottom of ribs)
  ctx.strokeStyle = COL.boneDk;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 6; i <= 18; i++) {
    const seg = spine[i];
    const t = (i - 6) / 12;
    const ribLen = 30 + Math.sin(t * Math.PI) * 50;
    const bx = seg.x + Math.cos(seg.angle + Math.PI / 2) * ribLen * 0.95 * -1
      + Math.cos(seg.angle) * (-ribLen * 0.2);
    const by = seg.y + Math.sin(seg.angle + Math.PI / 2) * ribLen * 0.95 * -1
      + Math.sin(seg.angle) * (-ribLen * 0.2);
    if (i === 6) ctx.moveTo(bx, by); else ctx.lineTo(bx, by);
  }
  ctx.stroke();
}

// ===== LEGS =====
function drawLeg(attachIdx, isFront, side, time) {
  const seg = spine[attachIdx];
  const perp = seg.angle + Math.PI / 2;
  const attachX = seg.x + Math.cos(perp) * side * seg.size * 2;
  const attachY = seg.y + Math.sin(perp) * side * seg.size * 2;

  // Leg animation: slight sway
  const sway = Math.sin(time * 2.5 + attachIdx + side * 2) * 0.15;
  const legAngle = seg.angle + Math.PI / 2 * side + sway;

  // Bone lengths
  const upperLen = isFront ? 35 : 45;
  const lowerLen = isFront ? 30 : 38;
  const footLen = 18;

  // Upper bone (humerus/femur)
  const jointAngle = legAngle + (isFront ? 0.6 : 0.4) * side;
  const elbowX = attachX + Math.cos(jointAngle) * upperLen;
  const elbowY = attachY + Math.sin(jointAngle) * upperLen;

  drawBoneTube(attachX, attachY, elbowX, elbowY, 3, 2.5, COL.bone);
  drawJoint(attachX, attachY, 4); // shoulder/hip
  drawJoint(elbowX, elbowY, 3.5); // elbow/knee

  // Lower bone (radius/tibia)
  const wristAngle = jointAngle + (isFront ? 0.8 : 1.0) * side;
  const wristX = elbowX + Math.cos(wristAngle) * lowerLen;
  const wristY = elbowY + Math.sin(wristAngle) * lowerLen;

  drawBoneTube(elbowX, elbowY, wristX, wristY, 2.5, 2, COL.bone);
  drawJoint(wristX, wristY, 3);

  // Foot with claws
  const footAngle = wristAngle + 0.6 * side;
  for (let c = -1; c <= 1; c++) {
    const clawAngle = footAngle + c * 0.3;
    const tipX = wristX + Math.cos(clawAngle) * footLen;
    const tipY = wristY + Math.sin(clawAngle) * footLen;

    // Metatarsal
    drawBoneTube(wristX, wristY, tipX, tipY, 1.5, 0.5, COL.boneDk);

    // Claw
    const clawLen = 8;
    const clawA = clawAngle + 0.3 * side;
    const clawTip = { x: tipX + Math.cos(clawA) * clawLen, y: tipY + Math.sin(clawA) * clawLen };
    ctx.strokeStyle = COL.dark;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.quadraticCurveTo(tipX + Math.cos(clawA) * clawLen * 0.6, tipY + Math.sin(clawA) * clawLen * 0.6 - 3, clawTip.x, clawTip.y);
    ctx.stroke();
  }
}

// ===== PELVIS / SHOULDER GIRDLE =====
function drawGirdle(idx, size) {
  const seg = spine[idx];
  ctx.save();
  ctx.translate(seg.x, seg.y);
  ctx.rotate(seg.angle);

  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
  grad.addColorStop(0, COL.boneLt);
  grad.addColorStop(1, COL.boneDk);
  ctx.fillStyle = grad;

  // Ilium shape
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.5, size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Bone detail lines
  ctx.strokeStyle = 'rgba(139,115,85,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.quadraticCurveTo(0, -size * 0.5, size, 0);
  ctx.stroke();
  ctx.restore();
}

// ===== BAT WINGS =====
function drawWing(side, time) {
  // Wing attaches at segment 8 (shoulder area)
  const seg = spine[8];
  const perp = seg.angle + Math.PI / 2;
  const baseX = seg.x + Math.cos(perp) * side * 8;
  const baseY = seg.y + Math.sin(perp) * side * 8;

  // Wing flap animation
  const flap = Math.sin(time * 2.5) * 0.25;
  const wingSpread = -Math.PI / 2 * side + flap * side;

  // Wing bone angles relative to body
  const humerusA = seg.angle + wingSpread + Math.PI * 0.1 * side;
  const humerusLen = 55;
  const elbowX = baseX + Math.cos(humerusA) * humerusLen;
  const elbowY = baseY + Math.sin(humerusA) * humerusLen;

  // Forearm (radius/ulna)
  const radiusA = humerusA - 0.4 * side;
  const radiusLen = 60;
  const wristX = elbowX + Math.cos(radiusA) * radiusLen;
  const wristY = elbowY + Math.sin(radiusA) * radiusLen;

  // Wing finger bones (4 digits)
  const fingerAngles = [radiusA - 0.5 * side, radiusA - 0.25 * side, radiusA, radiusA + 0.3 * side];
  const fingerLengths = [90, 100, 85, 55];
  const fingerTips = fingerAngles.map((fa, fi) => ({
    x: wristX + Math.cos(fa + Math.sin(time * 1.5 + fi) * 0.05) * fingerLengths[fi],
    y: wristY + Math.sin(fa + Math.sin(time * 1.5 + fi) * 0.05) * fingerLengths[fi]
  }));

  // Draw membrane FIRST (behind bones)
  ctx.fillStyle = COL.membrane;
  ctx.strokeStyle = COL.membEdge;
  ctx.lineWidth = 0.5;

  // Membrane between fingers
  for (let fi = 0; fi < fingerTips.length - 1; fi++) {
    ctx.beginPath();
    ctx.moveTo(wristX, wristY);
    ctx.lineTo(fingerTips[fi].x, fingerTips[fi].y);
    ctx.lineTo(fingerTips[fi + 1].x, fingerTips[fi + 1].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Membrane from last finger back to body
  const bodySeg = spine[16];
  ctx.beginPath();
  ctx.moveTo(wristX, wristY);
  ctx.lineTo(fingerTips[fingerTips.length - 1].x, fingerTips[fingerTips.length - 1].y);
  ctx.lineTo(bodySeg.x + Math.cos(perp) * side * 5, bodySeg.y + Math.sin(perp) * side * 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Membrane from first finger to arm
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(wristX, wristY);
  ctx.lineTo(fingerTips[0].x, fingerTips[0].y);
  ctx.closePath();
  ctx.fill();

  // Draw wing bones (on top of membrane)
  drawBoneTube(baseX, baseY, elbowX, elbowY, 3.5, 3, COL.bone);
  drawJoint(baseX, baseY, 5);
  drawJoint(elbowX, elbowY, 4);
  drawBoneTube(elbowX, elbowY, wristX, wristY, 3, 2.5, COL.bone);
  drawJoint(wristX, wristY, 3.5);

  // Finger bones
  fingerTips.forEach((tip, fi) => {
    const r = 2 - fi * 0.3;
    drawBoneTube(wristX, wristY, tip.x, tip.y, r, 0.5, COL.boneDk);

    // Small claw at fingertip
    const da = Math.atan2(tip.y - wristY, tip.x - wristX);
    ctx.strokeStyle = COL.dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x + Math.cos(da) * 8, tip.y + Math.sin(da) * 8);
    ctx.stroke();
  });
}

// ===== DRAGON SKULL (realistic) =====
function drawSkull(x, y, angle, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const s = 2.2;
  ctx.scale(s, s);

  // === Cranium (back of skull) ===
  let grad = ctx.createRadialGradient(-6, -2, 0, -4, 0, 14);
  grad.addColorStop(0, COL.boneLt);
  grad.addColorStop(0.7, COL.bone);
  grad.addColorStop(1, COL.boneDk);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(-6, 0, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Cranial suture lines
  ctx.strokeStyle = 'rgba(139,115,85,0.25)';
  ctx.lineWidth = 0.4;
  [[-14, 0, -6, -5, 2, -2], [-10, 3, -4, 5, 0, 2]].forEach(pts => {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    ctx.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]);
    ctx.stroke();
  });

  // === Snout / upper jaw ===
  grad = ctx.createLinearGradient(0, -5, 0, 5);
  grad.addColorStop(0, COL.boneLt);
  grad.addColorStop(1, COL.boneDk);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(2, -6);
  ctx.lineTo(8, -5);
  ctx.lineTo(18, -4);
  ctx.lineTo(26, -2.5);
  ctx.lineTo(30, -1);
  ctx.lineTo(30, 1);
  ctx.lineTo(26, 3);
  ctx.lineTo(18, 4);
  ctx.lineTo(8, 4.5);
  ctx.lineTo(2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Nasal ridge
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(4, -1);
  ctx.lineTo(26, -1.5);
  ctx.stroke();

  // Nostril
  ctx.fillStyle = COL.dark;
  ctx.beginPath();
  ctx.ellipse(25, -2, 1.5, 1, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // === Lower jaw (animated) ===
  const jawOpen = 2 + Math.sin(time * 3) * 2;
  ctx.save();
  ctx.translate(0, 4);
  ctx.rotate(jawOpen * 0.02);
  grad = ctx.createLinearGradient(0, 0, 0, 6);
  grad.addColorStop(0, COL.bone);
  grad.addColorStop(1, COL.boneDk);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, 2);
  ctx.lineTo(20, 3);
  ctx.lineTo(27, 2);
  ctx.lineTo(27, 0.5);
  ctx.lineTo(18, 1);
  ctx.lineTo(8, 0.5);
  ctx.lineTo(0, -1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Lower teeth
  ctx.fillStyle = COL.tooth;
  for (let i = 0; i < 6; i++) {
    const tx = 3 + i * 3.8;
    ctx.beginPath();
    ctx.moveTo(tx, 0);
    ctx.lineTo(tx + 0.6, -3.5 - Math.sin(i * 0.8) * 1.5);
    ctx.lineTo(tx + 1.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.boneLine;
    ctx.lineWidth = 0.3;
    ctx.stroke();
  }
  ctx.restore();

  // === Upper teeth ===
  ctx.fillStyle = COL.tooth;
  for (let i = 0; i < 8; i++) {
    const tx = 4 + i * 3;
    const th = 3 + (i < 4 ? i * 1 : (7 - i) * 1.2);
    ctx.beginPath();
    ctx.moveTo(tx, 2);
    ctx.lineTo(tx + 0.5, 2 + th);
    ctx.lineTo(tx + 1, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.boneLine;
    ctx.lineWidth = 0.3;
    ctx.stroke();
  }

  // === Eye socket ===
  ctx.fillStyle = '#1a0a05';
  ctx.beginPath();
  ctx.ellipse(0, -3, 4.5, 3.5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // Glowing eye
  ctx.fillStyle = COL.eye;
  ctx.shadowColor = '#ff3300';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(0, -3, 2.2, 1.5, -0.1, 0, Math.PI * 2);
  ctx.fill();
  // Pupil slit
  ctx.fillStyle = '#1a0000';
  ctx.beginPath();
  ctx.ellipse(0, -3, 0.6, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // === Brow ridges ===
  ctx.strokeStyle = COL.boneDk;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -7);
  ctx.quadraticCurveTo(-2, -9.5, 6, -6);
  ctx.stroke();

  // === Horns ===
  // Main horn pair
  [[-8, -7, -14, -22, -6, -32], [-10, -5, -18, -17, -12, -26]].forEach((h, hi) => {
    ctx.strokeStyle = hi === 0 ? COL.boneDk : COL.bone;
    ctx.lineWidth = hi === 0 ? 3 : 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(h[0], h[1]);
    ctx.quadraticCurveTo(h[2], h[3], h[4], h[5]);
    ctx.stroke();
    // Horn highlight
    ctx.strokeStyle = COL.boneLt;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(h[0] + 1, h[1]);
    ctx.quadraticCurveTo(h[2] + 1, h[3], h[4] + 1, h[5]);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Small cheek horn
  ctx.strokeStyle = COL.boneDk;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-4, 5);
  ctx.quadraticCurveTo(-8, 10, -5, 14);
  ctx.stroke();

  // Jaw joint detail
  ctx.fillStyle = COL.joint;
  ctx.beginPath();
  ctx.arc(-2, 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.4;
  ctx.stroke();

  ctx.restore();
}

// ===== TAIL with spade tip =====
function drawTailTip(time) {
  const tail = spine[SEGMENTS - 1];
  const prev = spine[SEGMENTS - 2];
  const a = Math.atan2(tail.y - prev.y, tail.x - prev.x);
  const tx = tail.x + Math.cos(a) * 10;
  const ty = tail.y + Math.sin(a) * 10;

  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(a);
  const wave = Math.sin(time * 3) * 0.1;
  ctx.rotate(wave);

  // Spade shape
  ctx.fillStyle = COL.boneDk;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(12, -8, 20, 0);
  ctx.quadraticCurveTo(12, 8, 0, 0);
  ctx.fill();
  ctx.strokeStyle = COL.boneLine;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Central ridge
  ctx.strokeStyle = COL.bone;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(15, 0);
  ctx.stroke();
  ctx.restore();
}

// ===== FIRE PARTICLES =====
const FIRE_COLORS = ['#ff4500', '#ff6600', '#ff9500', '#ffcc00', '#ffe066', '#ff2200'];
const fireParticles = [];
function updateFire() {
  const head = spine[0];
  const mouthX = head.x + Math.cos(head.angle) * 55;
  const mouthY = head.y + Math.sin(head.angle) * 55;

  for (let i = 0; i < 5; i++) {
    const spread = (Math.random() - 0.5) * 0.5;
    const spd = 4 + Math.random() * 6;
    fireParticles.push({
      x: mouthX + (Math.random() - 0.5) * 6,
      y: mouthY + (Math.random() - 0.5) * 6,
      vx: Math.cos(head.angle + spread) * spd,
      vy: Math.sin(head.angle + spread) * spd,
      life: 1, decay: 0.02 + Math.random() * 0.02,
      size: 2 + Math.random() * 7,
      color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]
    });
  }

  for (let i = fireParticles.length - 1; i >= 0; i--) {
    const p = fireParticles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy -= 0.06;
    p.vx *= 0.98;
    p.life -= p.decay;
    p.size *= 0.97;
    if (p.life <= 0) { fireParticles.splice(i, 1); continue; }
    ctx.globalAlpha = p.life * 0.7;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  if (fireParticles.length > 250) fireParticles.splice(0, fireParticles.length - 250);

  // Glow
  const grad = ctx.createRadialGradient(mouthX, mouthY, 0, mouthX, mouthY, 50);
  grad.addColorStop(0, 'rgba(255,150,0,0.12)');
  grad.addColorStop(1, 'rgba(255,100,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(mouthX, mouthY, 50, 0, Math.PI * 2); ctx.fill();
}

// ===== SPINE SHADOW =====
function drawShadow() {
  ctx.globalAlpha = 0.03;
  ctx.fillStyle = '#000';
  for (let i = 0; i < SEGMENTS; i++) {
    const s = spine[i];
    ctx.beginPath();
    ctx.ellipse(s.x + 4, s.y + 6, s.size * 2.5, s.size * 0.8, s.angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ===== MAIN LOOP =====
let time = 0;
function render() {
  requestAnimationFrame(render);
  time += 0.016;
  updateSpine();

  // Background
  ctx.fillStyle = '#f0e8d8';
  ctx.fillRect(0, 0, W, H);

  // Subtle parchment dots
  ctx.fillStyle = 'rgba(180,160,130,0.06)';
  for (let gx = 0; gx < W; gx += 25) for (let gy = 0; gy < H; gy += 25) {
    ctx.beginPath(); ctx.arc(gx, gy, 0.8, 0, Math.PI * 2); ctx.fill();
  }

  drawShadow();

  // Wings (behind body)
  drawWing(1, time);
  drawWing(-1, time);

  // Ribcage
  drawRibcage(time);

  // Girdles (shoulder + pelvis)
  drawGirdle(7, 10);   // shoulder
  drawGirdle(20, 12);  // pelvis

  // Legs
  drawLeg(7, true, 1, time);   // front right
  drawLeg(7, true, -1, time);  // front left
  drawLeg(20, false, 1, time); // back right
  drawLeg(20, false, -1, time);// back left

  // Spine vertebrae (back to front)
  for (let i = SEGMENTS - 1; i >= 1; i--) {
    drawVertebra(spine[i].x, spine[i].y, spine[i].angle, spine[i].size, i);
  }

  // Tail tip
  drawTailTip(time);

  // Fire
  updateFire();

  // Dragon skull (on top of everything)
  drawSkull(spine[0].x, spine[0].y, spine[0].angle, time);
}

render();
