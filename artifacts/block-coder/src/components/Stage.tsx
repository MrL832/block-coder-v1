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

function drawCat(
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

  const hueShift = colorEffect;

  const bodyColor = `hsl(${28 + hueShift}, 90%, 65%)`;
  const darkColor = `hsl(${28 + hueShift}, 80%, 45%)`;
  const lightColor = `hsl(${28 + hueShift}, 60%, 80%)`;

  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.moveTo(-16, -28);
  ctx.lineTo(-12, -20);
  ctx.lineTo(-20, -18);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(16, -28);
  ctx.lineTo(12, -20);
  ctx.lineTo(20, -18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `hsl(${340 + hueShift}, 60%, 75%)`;
  ctx.beginPath();
  ctx.moveTo(-14, -26);
  ctx.lineTo(-12, -21);
  ctx.lineTo(-17, -20);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(14, -26);
  ctx.lineTo(12, -21);
  ctx.lineTo(17, -20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, -10, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(0, -6, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2D1B00";
  ctx.beginPath();
  ctx.arc(-7, -14, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(7, -14, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7BE0FF";
  ctx.beginPath();
  ctx.arc(-7, -14, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(7, -14, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(-6.5, -14.5, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7.5, -14.5, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsl(${340 + hueShift}, 60%, 75%)`;
  ctx.beginPath();
  ctx.arc(0, -8, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -4, 6, 0, Math.PI);
  ctx.stroke();

  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(side * 4, -8 + i * 3);
      ctx.lineTo(side * 18, -10 + i * 2.5);
      ctx.stroke();
    }
  }

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = lightColor;
  ctx.beginPath();
  ctx.ellipse(0, 10, 10, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const side of [-1, 1]) {
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(side * 18, 5, 8, 14, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-4, 30);
  ctx.bezierCurveTo(-6, 42, -4, 48, -2, 50);
  ctx.bezierCurveTo(-1, 52, 1, 52, 2, 50);
  ctx.bezierCurveTo(4, 48, 6, 42, 4, 30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  ctx.stroke();

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
      drawCat(ctx, cx, cy, spriteState.direction, spriteState.colorEffect);

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
