import { useRef, useEffect } from "react";
import { SpriteState } from "@/types/blocks";

interface StageProps {
  spriteState: SpriteState;
}

const STAGE_W = 480;
const STAGE_H = 360;

function stageToCanvas(x: number, y: number) {
  return {
    cx: x + STAGE_W / 2,
    cy: STAGE_H / 2 - y,
  };
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  grad.addColorStop(0, "#87CEEB");
  grad.addColorStop(0.6, "#B0E0FF");
  grad.addColorStop(0.6, "#7EC850");
  grad.addColorStop(1, "#5BA832");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);

  ctx.fillStyle = "#FFFEF0";
  ctx.beginPath();
  ctx.ellipse(80, 60, 55, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(105, 50, 40, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(350, 80, 60, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(380, 68, 45, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5BA832";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const bx = 50 + i * 70;
    ctx.beginPath();
    ctx.moveTo(bx, 216);
    ctx.bezierCurveTo(bx - 5, 196, bx + 5, 200, bx, 180);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, 200);
    ctx.bezierCurveTo(bx - 12, 192, bx - 15, 198, bx - 8, 205);
    ctx.stroke();
  }
}

function drawDog(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  direction: number,
  colorEffect: number
) {
  ctx.save();
  ctx.translate(cx, cy);
  const rot = ((direction - 90) * Math.PI) / 180;
  ctx.rotate(rot);

  const h = colorEffect;
  const fur = `hsl(${34 + h}, 85%, 62%)`;
  const furDark = `hsl(${28 + h}, 75%, 42%)`;
  const furLight = `hsl(${40 + h}, 70%, 82%)`;
  const earInner = `hsl(${15 + h}, 70%, 72%)`;

  // --- tail (curled up behind body) ---
  ctx.strokeStyle = fur;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.bezierCurveTo(26, 18, 34, 4, 22, -4);
  ctx.bezierCurveTo(14, -10, 8, -4, 14, 2);
  ctx.stroke();
  ctx.lineWidth = 1;

  // --- body ---
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(0, 12, 17, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = furDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  // belly patch
  ctx.fillStyle = furLight;
  ctx.beginPath();
  ctx.ellipse(0, 12, 9, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- front legs ---
  for (const side of [-1, 1]) {
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.ellipse(side * 13, 26, 5, 9, side * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = furDark;
    ctx.lineWidth = 1;
    ctx.stroke();
    // paw
    ctx.fillStyle = furLight;
    ctx.beginPath();
    ctx.ellipse(side * 13, 34, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- floppy ears (drawn before head so head overlaps) ---
  for (const side of [-1, 1]) {
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.ellipse(side * 17, -8, 8, 13, side * 0.45, 0, Math.PI * 2);
    ctx.fill();
    // inner ear
    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.ellipse(side * 17, -7, 5, 9, side * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- head ---
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.arc(0, -10, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = furDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  // --- snout ---
  ctx.fillStyle = furLight;
  ctx.beginPath();
  ctx.ellipse(0, -4, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = furDark;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // nose
  ctx.fillStyle = "#2D1B00";
  ctx.beginPath();
  ctx.ellipse(0, -7, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // nostril highlights
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.arc(-1.5, -8, 1, 0, Math.PI * 2);
  ctx.fill();

  // mouth
  ctx.strokeStyle = furDark;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.lineTo(0, -1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-4, -1, 4, 0, Math.PI * 0.7);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, -1, 4, Math.PI * 0.3, Math.PI);
  ctx.stroke();

  // --- eyes ---
  for (const side of [-1, 1]) {
    // white sclera
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(side * 8, -16, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // iris
    ctx.fillStyle = "#3D2000";
    ctx.beginPath();
    ctx.arc(side * 8, -16, 3, 0, Math.PI * 2);
    ctx.fill();
    // pupil shine
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(side * 8 + 1, -17, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // eyebrow dots (expressive)
  ctx.fillStyle = furDark;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 8, -22, 4, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string) {
  const padding = 10;
  const tailSize = 10;
  ctx.font = "bold 13px Nunito, sans-serif";
  const metrics = ctx.measureText(text);
  const bw = metrics.width + padding * 2;
  const bh = 32;

  let bx = cx - bw / 2;
  const by = cy - 60 - bh;

  bx = Math.max(4, Math.min(bx, STAGE_W - bw - 4));

  ctx.fillStyle = "white";
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - tailSize / 2, by + bh);
  ctx.lineTo(cx, by + bh + tailSize);
  ctx.lineTo(cx + tailSize / 2, by + bh);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#333";
  ctx.fillText(text, bx + padding, by + bh / 2 + 5);
}

export function Stage({ spriteState }: StageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    drawBackground(ctx);

    if (spriteState.visible) {
      const { cx, cy } = stageToCanvas(spriteState.x, spriteState.y);
      drawDog(ctx, cx, cy, spriteState.direction, spriteState.colorEffect);

      if (spriteState.speech) {
        drawSpeechBubble(ctx, cx, cy - 10, spriteState.speech);
      }
    }
  }, [spriteState]);

  return (
    <div className="relative" data-testid="stage-canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={STAGE_W}
        height={STAGE_H}
        data-testid="stage-canvas"
        className="rounded-lg shadow-xl border-2 border-white/20 block"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}
