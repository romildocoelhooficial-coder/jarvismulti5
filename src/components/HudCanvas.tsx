import React, { useEffect, useRef } from 'react';
import { AssistantStatus } from '../types';
import { Palette } from '../constants/theme';

interface HudCanvasProps {
  status: AssistantStatus;
  palette: Palette;
  speechLevel: number;
  micLevel: number;
  statusText: string;
  assistantName: string;
}

// 3D Point definition
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Base 3D human head landmarks normalized (-1 to 1)
const HEAD_NODES: { [key: string]: Point3D[] } = {
  // Forehead & Crown
  crown: [
    { x: 0, y: -0.95, z: -0.2 },
    { x: -0.35, y: -0.85, z: -0.1 },
    { x: 0.35, y: -0.85, z: -0.1 },
    { x: -0.55, y: -0.65, z: -0.05 },
    { x: 0.55, y: -0.65, z: -0.05 },
  ],
  // Eyebrows
  browLeft: [
    { x: -0.52, y: -0.38, z: 0.42 },
    { x: -0.38, y: -0.45, z: 0.52 },
    { x: -0.22, y: -0.44, z: 0.58 },
    { x: -0.08, y: -0.38, z: 0.55 },
  ],
  browRight: [
    { x: 0.08, y: -0.38, z: 0.55 },
    { x: 0.22, y: -0.44, z: 0.58 },
    { x: 0.38, y: -0.45, z: 0.52 },
    { x: 0.52, y: -0.38, z: 0.42 },
  ],
  // Left Eye Loop
  eyeLeft: [
    { x: -0.44, y: -0.26, z: 0.45 },
    { x: -0.32, y: -0.32, z: 0.48 },
    { x: -0.18, y: -0.30, z: 0.50 },
    { x: -0.12, y: -0.25, z: 0.49 },
    { x: -0.20, y: -0.20, z: 0.48 },
    { x: -0.35, y: -0.20, z: 0.46 },
  ],
  // Right Eye Loop
  eyeRight: [
    { x: 0.12, y: -0.25, z: 0.49 },
    { x: 0.18, y: -0.30, z: 0.50 },
    { x: 0.32, y: -0.32, z: 0.48 },
    { x: 0.44, y: -0.26, z: 0.45 },
    { x: 0.35, y: -0.20, z: 0.46 },
    { x: 0.20, y: -0.20, z: 0.48 },
  ],
  // Nose Bridge & Base
  nose: [
    { x: 0, y: -0.32, z: 0.57 },
    { x: 0, y: -0.18, z: 0.65 },
    { x: 0, y: -0.05, z: 0.75 },
    { x: -0.12, y: 0.04, z: 0.63 },
    { x: 0, y: 0.06, z: 0.72 },
    { x: 0.12, y: 0.04, z: 0.63 },
  ],
  // Upper Lip
  lipUpper: [
    { x: -0.26, y: 0.18, z: 0.55 },
    { x: -0.14, y: 0.14, z: 0.64 },
    { x: 0, y: 0.16, z: 0.67 },
    { x: 0.14, y: 0.14, z: 0.64 },
    { x: 0.26, y: 0.18, z: 0.55 },
  ],
  // Lower Lip (moves with speech / jaw)
  lipLower: [
    { x: -0.26, y: 0.18, z: 0.55 },
    { x: -0.15, y: 0.28, z: 0.62 },
    { x: 0, y: 0.30, z: 0.65 },
    { x: 0.15, y: 0.28, z: 0.62 },
    { x: 0.26, y: 0.18, z: 0.55 },
  ],
  // Cheeks & Jawline
  jaw: [
    { x: -0.62, y: -0.10, z: 0.15 },
    { x: -0.58, y: 0.15, z: 0.22 },
    { x: -0.46, y: 0.42, z: 0.35 },
    { x: -0.28, y: 0.65, z: 0.45 },
    { x: 0, y: 0.75, z: 0.52 }, // Chin
    { x: 0.28, y: 0.65, z: 0.45 },
    { x: 0.46, y: 0.42, z: 0.35 },
    { x: 0.58, y: 0.15, z: 0.22 },
    { x: 0.62, y: -0.10, z: 0.15 },
  ],
  // Cranium Silhouette sweeping back
  cranium: [
    { x: -0.62, y: -0.10, z: 0.15 },
    { x: -0.65, y: -0.38, z: -0.15 },
    { x: -0.55, y: -0.65, z: -0.25 },
    { x: 0, y: -0.92, z: -0.35 },
    { x: 0.55, y: -0.65, z: -0.25 },
    { x: 0.65, y: -0.38, z: -0.15 },
    { x: 0.62, y: -0.10, z: 0.15 },
  ],
};

export const HudCanvas: React.FC<HudCanvasProps> = ({
  status,
  palette,
  speechLevel,
  micLevel,
  statusText,
  assistantName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation state refs
  const stateRef = useRef({
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    blink: 0,
    blinkTimer: 0,
    ringRot1: 0,
    ringRot2: 0,
    lastTime: performance.now(),
    jawOpen: 0,
    browLift: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      const st = stateRef.current;
      const dt = Math.min((now - st.lastTime) / 1000, 0.1);
      st.lastTime = now;

      // Update HUD ring rotations
      const ringSpeed = status === 'THINKING' ? 1.6 : status === 'SPEAKING' ? 1.0 : 0.35;
      st.ringRot1 += dt * ringSpeed;
      st.ringRot2 -= dt * (ringSpeed * 0.7);

      // Saccades and gaze targets based on status
      st.blinkTimer += dt;
      if (st.blinkTimer > 3.8 + Math.random() * 2.5) {
        st.blink = 1.0;
        st.blinkTimer = 0;
      }
      if (st.blink > 0) {
        st.blink = Math.max(0, st.blink - dt * 6.5);
      }

      // Sleeping drops eyelids completely
      if (status === 'SLEEPING') {
        st.blink = 0.95;
      }

      if (status === 'THINKING') {
        st.targetYaw = 0.22;
        st.targetPitch = -0.12;
        st.browLift = -0.05; // slight furrow
      } else if (status === 'LISTENING') {
        st.targetYaw = Math.sin(now * 0.0012) * 0.05;
        st.targetPitch = 0.04;
        st.browLift = 0.08; // engaged lift
      } else if (status === 'SPEAKING') {
        st.targetYaw = Math.sin(now * 0.0018) * 0.08;
        st.targetPitch = Math.sin(now * 0.0035) * 0.04; // nodding with speech
        st.browLift = Math.sin(now * 0.005) * 0.06;
      } else if (status === 'SLEEPING') {
        st.targetYaw = 0;
        st.targetPitch = 0.15; // head tilted down slightly
        st.browLift = 0;
      } else {
        // Idle wandering saccades
        if (Math.random() < 0.01) {
          st.targetYaw = (Math.random() - 0.5) * 0.18;
          st.targetPitch = (Math.random() - 0.5) * 0.12;
        }
      }

      // Smooth lerp to target gaze
      st.yaw += (st.targetYaw - st.yaw) * (dt * 3.5);
      st.pitch += (st.targetPitch - st.pitch) * (dt * 3.5);

      // Lip-sync jaw opening
      const targetJaw = status === 'SPEAKING' ? speechLevel : 0;
      st.jawOpen += (targetJaw - st.jawOpen) * (dt * 15.0);

      // Drawing
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - 15;
      const scale = Math.min(w, h) * 0.28;

      // 1. Arc Reactor / HUD Concentric Rings
      ctx.save();
      ctx.translate(cx, cy);

      // Aura glow
      const auraIntensity = status === 'SPEAKING'
        ? 0.35 + speechLevel * 0.35
        : status === 'LISTENING'
        ? 0.35 + micLevel * 0.35
        : status === 'THINKING'
        ? 0.4
        : 0.18;

      const grad = ctx.createRadialGradient(0, 0, scale * 0.2, 0, 0, scale * 1.4);
      grad.addColorStop(0, `${palette.PRI}33`);
      grad.addColorStop(0.5, `${palette.PRI}${Math.floor(auraIntensity * 120).toString(16).padStart(2, '0')}`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, scale * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Outer dashed Ring 1
      ctx.save();
      ctx.rotate(st.ringRot1);
      ctx.strokeStyle = `${palette.PRI}44`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12, 24, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, scale * 1.15, 0, Math.PI * 2);
      ctx.stroke();

      // Compass tick marks
      ctx.setLineDash([]);
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const len = i % 6 === 0 ? 12 : 5;
        const r1 = scale * 1.15;
        const r2 = r1 + (i % 6 === 0 ? len : len);
        ctx.strokeStyle = i % 6 === 0 ? palette.PRI : `${palette.PRI}55`;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
        ctx.stroke();
      }
      ctx.restore();

      // Inner Counter-rotating Ring 2
      ctx.save();
      ctx.rotate(st.ringRot2);
      ctx.strokeStyle = `${palette.PRI}55`;
      ctx.lineWidth = 2;
      ctx.setLineDash([30, 20, 6, 20]);
      ctx.beginPath();
      ctx.arc(0, 0, scale * 0.98, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Inner segmented target arc
      ctx.strokeStyle = `${palette.PRI}33`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, scale * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore(); // restore translated center

      // 2. 3D Holographic Head Avatar
      // Project 3D points to 2D screen coordinates
      const project = (p: Point3D, isJaw = false, isBrow = false, isEye = false) => {
        let x = p.x;
        let y = p.y;
        let z = p.z;

        // Apply facial deformations
        if (isBrow) {
          y += st.browLift;
        }
        if (isJaw) {
          y += st.jawOpen * 0.28;
          z -= st.jawOpen * 0.05;
        }
        if (isEye && st.blink > 0) {
          y += st.blink * 0.08 * (p.y < -0.25 ? 1 : -0.5);
        }

        // Apply 3D Rotations (Yaw around Y, Pitch around X)
        // Yaw
        const cosY = Math.cos(st.yaw), sinY = Math.sin(st.yaw);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Pitch
        const cosP = Math.cos(st.pitch), sinP = Math.sin(st.pitch);
        const y2 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;

        // Perspective camera projection
        const fov = 3.5;
        const pz = z2 + fov;
        const px = cx + (x1 / pz) * scale * 2.2;
        const py = cy + (y2 / pz) * scale * 2.2;
        const alpha = Math.max(0.15, Math.min(1.0, 0.45 + (z2 + 0.6) * 0.45));

        return { px, py, alpha };
      };

      // Draw feature curves with holographic glow
      const drawPolyline = (points: Point3D[], isClosed = false, isJaw = false, isBrow = false, isEye = false) => {
        if (points.length < 2) return;
        const projected = points.map(pt => project(pt, isJaw, isBrow, isEye));

        ctx.beginPath();
        ctx.moveTo(projected[0].px, projected[0].py);
        for (let i = 1; i < projected.length; i++) {
          ctx.lineTo(projected[i].px, projected[i].py);
        }
        if (isClosed) {
          ctx.closePath();
        }

        const avgAlpha = projected.reduce((acc, p) => acc + p.alpha, 0) / projected.length;
        ctx.strokeStyle = `${palette.PRI}${Math.floor(avgAlpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = isEye || isBrow ? 2.0 : 1.5;
        ctx.stroke();

        // Subtle glowing dots at nodes
        for (const pt of projected) {
          ctx.fillStyle = `${palette.WHITE}${Math.floor(pt.alpha * 200).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // Connect facial mesh lines
      drawPolyline(HEAD_NODES.browLeft, false, false, true, false);
      drawPolyline(HEAD_NODES.browRight, false, false, true, false);
      drawPolyline(HEAD_NODES.eyeLeft, true, false, false, true);
      drawPolyline(HEAD_NODES.eyeRight, true, false, false, true);
      drawPolyline(HEAD_NODES.nose, false, false, false, false);
      drawPolyline(HEAD_NODES.lipUpper, false, false, false, false);
      drawPolyline(HEAD_NODES.lipLower, false, true, false, false);
      drawPolyline(HEAD_NODES.jaw, false, true, false, false);
      drawPolyline(HEAD_NODES.cranium, false, false, false, false);

      // Cross-connectors to form holographic wireframe
      // Bridge between brows
      const bL = project(HEAD_NODES.browLeft[3], false, true, false);
      const bR = project(HEAD_NODES.browRight[0], false, true, false);
      ctx.strokeStyle = `${palette.PRI}55`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bL.px, bL.py);
      ctx.lineTo(bR.px, bR.py);
      ctx.stroke();

      // Nose to eyes
      const nTop = project(HEAD_NODES.nose[0]);
      const eLInner = project(HEAD_NODES.eyeLeft[3], false, false, true);
      const eRInner = project(HEAD_NODES.eyeRight[0], false, false, true);
      ctx.beginPath();
      ctx.moveTo(nTop.px, nTop.py);
      ctx.lineTo(eLInner.px, eLInner.py);
      ctx.moveTo(nTop.px, nTop.py);
      ctx.lineTo(eRInner.px, eRInner.py);
      ctx.stroke();

      // Nose to mouth
      const nBot = project(HEAD_NODES.nose[4]);
      const lipTop = project(HEAD_NODES.lipUpper[2]);
      ctx.beginPath();
      ctx.moveTo(nBot.px, nBot.py);
      ctx.lineTo(lipTop.px, lipTop.py);
      ctx.stroke();

      // Cheeks to jaw
      const jawL = project(HEAD_NODES.jaw[2], true);
      const eyeLOut = project(HEAD_NODES.eyeLeft[0], false, false, true);
      const jawR = project(HEAD_NODES.jaw[6], true);
      const eyeROut = project(HEAD_NODES.eyeRight[3], false, false, true);
      ctx.strokeStyle = `${palette.PRI}33`;
      ctx.beginPath();
      ctx.moveTo(jawL.px, jawL.py);
      ctx.lineTo(eyeLOut.px, eyeLOut.py);
      ctx.moveTo(jawR.px, jawR.py);
      ctx.lineTo(eyeROut.px, eyeROut.py);
      ctx.stroke();

      // 3. Audio Waveform at Bottom of HUD
      const numBars = 32;
      const waveWidth = Math.min(w * 0.45, 340);
      const barW = (waveWidth / numBars) * 0.7;
      const startX = cx - waveWidth / 2;
      const waveY = cy + scale * 1.25;

      const activeLevel = status === 'SPEAKING' ? speechLevel : status === 'LISTENING' ? micLevel : 0.05;

      ctx.fillStyle = palette.PRI;
      for (let i = 0; i < numBars; i++) {
        // Mirrored frequency curve
        const norm = 1 - Math.abs((i - numBars / 2) / (numBars / 2));
        const noise = Math.sin(now * 0.01 + i * 0.5) * 0.3 + 0.7;
        const barH = Math.max(3, activeLevel * norm * noise * 48);
        const bx = startX + (i / numBars) * waveWidth;

        ctx.fillStyle = i % 2 === 0 ? palette.PRI : palette.TEXT_MED;
        ctx.fillRect(bx, waveY - barH / 2, barW, barH);
      }

      // 4. Tech HUD Brackets and Corner Overlay
      const bMargin = 24;
      const bLen = 22;
      ctx.strokeStyle = `${palette.PRI}88`;
      ctx.lineWidth = 1.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bMargin, bMargin + bLen);
      ctx.lineTo(bMargin, bMargin);
      ctx.lineTo(bMargin + bLen, bMargin);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(w - bMargin - bLen, bMargin);
      ctx.lineTo(w - bMargin, bMargin);
      ctx.lineTo(w - bMargin, bMargin + bLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(bMargin, h - bMargin - bLen);
      ctx.lineTo(bMargin, h - bMargin);
      ctx.lineTo(bMargin + bLen, h - bMargin);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(w - bMargin - bLen, h - bMargin);
      ctx.lineTo(w - bMargin, h - bMargin);
      ctx.lineTo(w - bMargin, h - bMargin - bLen);
      ctx.stroke();

      // 5. Status text in HUD bottom center
      ctx.textAlign = 'center';
      ctx.font = '700 11px Orbitron, sans-serif';
      ctx.fillStyle = status === 'THINKING' ? palette.ACC : status === 'SPEAKING' ? palette.GREEN : palette.TEXT;
      ctx.letterSpacing = '3px';
      ctx.fillText(`STATUS // ${status}`, cx, cy + scale * 1.55);

      if (statusText) {
        ctx.font = '500 12px "JetBrains Mono", monospace';
        ctx.fillStyle = palette.WHITE;
        ctx.fillText(statusText, cx, cy + scale * 1.72);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [status, palette, speechLevel, micLevel, statusText, assistantName]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />
      {/* HUD scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />
    </div>
  );
};
