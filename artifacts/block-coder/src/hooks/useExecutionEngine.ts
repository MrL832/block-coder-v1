import { useState, useRef, useCallback } from "react";
import { BlockInstance, SpriteState } from "@/types/blocks";

const INITIAL_SPRITE: SpriteState = {
  x: 0,
  y: 0,
  direction: 90,
  speech: null,
  colorEffect: 0,
  visible: true,
};

export function useExecutionEngine() {
  const [spriteState, setSpriteState] = useState<SpriteState>({ ...INITIAL_SPRITE });
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);
  const spriteRef = useRef<SpriteState>({ ...INITIAL_SPRITE });

  const updateSprite = useCallback((updater: (s: SpriteState) => SpriteState) => {
    setSpriteState((prev) => {
      const next = updater(prev);
      spriteRef.current = next;
      return next;
    });
  }, []);

  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 50;
        if (abortRef.current) {
          clearInterval(interval);
          reject(new Error("aborted"));
        } else if (elapsed >= ms) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  };

  const glide = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    durationMs: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const tick = () => {
        if (abortRef.current) {
          reject(new Error("aborted"));
          return;
        }
        const now = performance.now();
        const progress = Math.min((now - start) / durationMs, 1);
        const x = fromX + (toX - fromX) * progress;
        const y = fromY + (toY - fromY) * progress;
        updateSprite((s) => ({ ...s, x, y }));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  };

  const executeBlocks = async (blocks: BlockInstance[]): Promise<void> => {
    for (const block of blocks) {
      if (abortRef.current) return;

      const v = block.values;

      switch (block.type) {
        case "event_whenflagclicked":
          break;

        case "motion_movesteps": {
          const steps = Number(v.steps ?? 10);
          updateSprite((s) => {
            const rad = ((s.direction - 90) * Math.PI) / 180;
            const newX = Math.max(-240, Math.min(240, s.x + steps * Math.cos(rad)));
            const newY = Math.max(-180, Math.min(180, s.y + steps * Math.sin(rad)));
            return { ...s, x: newX, y: newY };
          });
          break;
        }

        case "motion_turndegrees": {
          const deg = Number(v.degrees ?? 15);
          updateSprite((s) => ({ ...s, direction: (s.direction + deg) % 360 }));
          break;
        }

        case "motion_gotoxy": {
          const x = Number(v.x ?? 0);
          const y = Number(v.y ?? 0);
          updateSprite((s) => ({ ...s, x, y }));
          break;
        }

        case "motion_glidesecstoxy": {
          const secs = Number(v.secs ?? 1);
          const toX = Number(v.x ?? 0);
          const toY = Number(v.y ?? 0);
          const cur = spriteRef.current;
          await glide(cur.x, cur.y, toX, toY, secs * 1000);
          break;
        }

        case "looks_sayforsecs": {
          const text = String(v.text ?? "Hello!");
          const secs = Number(v.secs ?? 2);
          updateSprite((s) => ({ ...s, speech: text }));
          await sleep(secs * 1000);
          updateSprite((s) => ({ ...s, speech: null }));
          break;
        }

        case "looks_setcoloreffectto": {
          const value = Number(v.value ?? 50);
          updateSprite((s) => ({ ...s, colorEffect: value % 360 }));
          break;
        }

        case "control_waitsecs": {
          const secs = Number(v.secs ?? 1);
          await sleep(secs * 1000);
          break;
        }

        case "control_repeat": {
          const times = Number(v.times ?? 10);
          for (let i = 0; i < times; i++) {
            if (abortRef.current) return;
            await executeBlocks(block.children ?? []);
          }
          break;
        }

        case "control_if": {
          await executeBlocks(block.children ?? []);
          break;
        }

        case "operator_waitforever": {
          while (!abortRef.current) {
            if ((block.children ?? []).length === 0) {
              await sleep(100);
            } else {
              await executeBlocks(block.children ?? []);
            }
          }
          break;
        }

        case "control_stop": {
          abortRef.current = true;
          return;
        }

        default:
          break;
      }
    }
  };

  const runScript = useCallback(
    async (blocks: BlockInstance[]) => {
      if (isRunning) return;
      abortRef.current = false;
      spriteRef.current = { ...INITIAL_SPRITE };
      setSpriteState({ ...INITIAL_SPRITE });
      setIsRunning(true);

      const flagBlock = blocks.find((b) => b.type === "event_whenflagclicked");
      if (!flagBlock) {
        setIsRunning(false);
        return;
      }

      const startIdx = blocks.indexOf(flagBlock);
      const toRun = blocks.slice(startIdx);

      try {
        await executeBlocks(toRun);
      } catch {
      } finally {
        setIsRunning(false);
      }
    },
    [isRunning]
  );

  const stopExecution = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    updateSprite((s) => ({ ...s, speech: null }));
  }, [updateSprite]);

  const resetSprite = useCallback(() => {
    abortRef.current = true;
    spriteRef.current = { ...INITIAL_SPRITE };
    setSpriteState({ ...INITIAL_SPRITE });
    setIsRunning(false);
  }, []);

  return { spriteState, runScript, stopExecution, resetSprite, isRunning };
}
