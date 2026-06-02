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
  const isRunningRef = useRef(false);
  const abortRef = useRef(false);
  const runIdRef = useRef(0);
  const spriteRef = useRef<SpriteState>({ ...INITIAL_SPRITE });
  const intervalsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  const updateSprite = useCallback((updater: (s: SpriteState) => SpriteState) => {
    setSpriteState((prev) => {
      const next = updater(prev);
      spriteRef.current = next;
      return next;
    });
  }, []);

  const clearAsync = useCallback(() => {
    for (const id of intervalsRef.current) window.clearInterval(id);
    intervalsRef.current = [];
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const sleep = useCallback((ms: number): Promise<void> => {
    const runId = runIdRef.current;
    return new Promise((resolve, reject) => {
      let elapsed = 0;
      const interval = window.setInterval(() => {
        elapsed += 50;
        if (abortRef.current || runIdRef.current !== runId) {
          window.clearInterval(interval);
          reject(new Error("aborted"));
        } else if (elapsed >= ms) {
          window.clearInterval(interval);
          resolve();
        }
      }, 50);
      intervalsRef.current.push(interval);
    });
  }, []);

  const glide = useCallback((
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    durationMs: number
  ): Promise<void> => {
    const runId = runIdRef.current;
    const dur = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const tick = () => {
        if (abortRef.current || runIdRef.current !== runId) {
          reject(new Error("aborted"));
          return;
        }
        const now = performance.now();
        const progress = dur === 0 ? 1 : Math.min((now - start) / dur, 1);
        const x = fromX + (toX - fromX) * progress;
        const y = fromY + (toY - fromY) * progress;
        updateSprite((s) => ({ ...s, x, y }));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          resolve();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    });
  }, [updateSprite]);

  const executeBlocks = useCallback(
    async function exec(blocks: BlockInstance[]): Promise<void> {
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
            const amount = Number(v.amount ?? 45);
            const clockwise = String(v.direction ?? "clockwise") !== "counterclockwise";
            const delta = clockwise ? amount : -amount;
            updateSprite((s) => ({ ...s, direction: ((s.direction + delta) % 360 + 360) % 360 }));
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
              await exec(block.children ?? []);
            }
            break;
          }

          case "control_if": {
            const condition = String(v.condition ?? "always true");
            const s = spriteRef.current;
            let result = false;
            if (condition === "x > 0") result = s.x > 0;
            else if (condition === "x < 0") result = s.x < 0;
            else if (condition === "y > 0") result = s.y > 0;
            else if (condition === "y < 0") result = s.y < 0;
            else if (condition === "touching edge")
              result = Math.abs(s.x) >= 220 || Math.abs(s.y) >= 160;
            else if (condition === "always true") result = true;
            else if (condition === "always false") result = false;
            if (result) await exec(block.children ?? []);
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
    },
    [glide, sleep, updateSprite]
  );

  const runScript = useCallback(
    async (blocks: BlockInstance[]) => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      abortRef.current = false;
      clearAsync();
      const myRunId = runIdRef.current + 1;
      runIdRef.current = myRunId;
      spriteRef.current = { ...INITIAL_SPRITE };
      setSpriteState({ ...INITIAL_SPRITE });
      setIsRunning(true);

      const flagBlock = blocks.find((b) => b.type === "event_whenflagclicked");
      if (!flagBlock) {
        isRunningRef.current = false;
        setIsRunning(false);
        return;
      }

      const startIdx = blocks.indexOf(flagBlock);
      const toRun = blocks.slice(startIdx);

      try {
        await executeBlocks(toRun);
      } catch {
      } finally {
        if (runIdRef.current === myRunId) {
          isRunningRef.current = false;
          abortRef.current = false;
          clearAsync();
          setIsRunning(false);
        }
      }
    },
    [clearAsync, executeBlocks]
  );

  const stopExecution = useCallback(() => {
    abortRef.current = true;
    isRunningRef.current = false;
    runIdRef.current += 1;
    clearAsync();
    spriteRef.current = { ...INITIAL_SPRITE };
    setSpriteState({ ...INITIAL_SPRITE });
    setIsRunning(false);
  }, [clearAsync]);

  const resetSprite = useCallback(() => {
    abortRef.current = true;
    isRunningRef.current = false;
    runIdRef.current += 1;
    clearAsync();
    spriteRef.current = { ...INITIAL_SPRITE };
    setSpriteState({ ...INITIAL_SPRITE });
    setIsRunning(false);
  }, [clearAsync]);

  return { spriteState, runScript, stopExecution, resetSprite, isRunning };
}
