import { useState, useCallback, useEffect, useRef } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { BlockPalette } from "@/components/BlockPalette";
import { ScriptArea } from "@/components/ScriptArea";
import { Stage } from "@/components/Stage";
import { useExecutionEngine } from "@/hooks/useExecutionEngine";
import { BlockDef, BlockInstance, BLOCK_CATALOG } from "@/types/blocks";
import { Play, Square, RotateCcw, Undo2, Redo2 } from "lucide-react";

let idCounter = 1;
function makeId() {
  return `block-${Date.now()}-${idCounter++}`;
}

function createInstanceFromDef(def: BlockDef): BlockInstance {
  const values: Record<string, string | number> = {};
  for (const inp of def.inputs ?? []) {
    values[inp.name] = inp.defaultValue;
  }
  return {
    id: makeId(),
    type: def.type,
    values,
    children: def.hasInner ? [] : undefined,
  };
}

const MAX_HISTORY = 50;

function useScriptHistory() {
  const pastRef = useRef<BlockInstance[][]>([]);
  const futureRef = useRef<BlockInstance[][]>([]);
  const [present, setPresent] = useState<BlockInstance[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const sync = () => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  };

  const set = useCallback((next: BlockInstance[] | ((p: BlockInstance[]) => BlockInstance[])) => {
    setPresent((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      pastRef.current = [...pastRef.current.slice(-(MAX_HISTORY - 1)), prev];
      futureRef.current = [];
      sync();
      return resolved;
    });
  }, []);

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    setPresent((prev) => {
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [prev, ...futureRef.current];
      sync();
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    setPresent((prev) => {
      const next = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current, prev];
      sync();
      return next;
    });
  }, []);

  return { present, set, undo, redo, canUndo, canRedo };
}

export default function BlockCoder() {
  const { present: scriptBlocks, set: setScriptBlocks, undo, redo, canUndo, canRedo } = useScriptHistory();
  const { spriteState, runScript, stopExecution, resetSprite, isRunning } = useExecutionEngine();

  const handleRun = () => runScript(scriptBlocks);
  const handleStop = () => stopExecution();
  const handleReset = () => resetSprite();

  const hasFlag = scriptBlocks.some((b) => b.type === "event_whenflagclicked");

  const handleAddBlock = useCallback((def: BlockDef) => {
    const block = createInstanceFromDef(def);
    setScriptBlocks((prev) => [...prev, block]);
  }, [setScriptBlocks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100dvh", fontFamily: "Nunito, sans-serif" }}
    >
      <header className="flex items-center px-4 py-2 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-base"
            style={{ background: "linear-gradient(135deg, #4C97FF 0%, #9966FF 100%)" }}
          >
            B
          </div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Block Coder</h1>
        </div>
        <p className="ml-4 text-sm text-gray-400 font-semibold hidden md:block">
          Snap blocks together to make the dog move!
        </p>
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-400 font-semibold">
          <span className="w-2 h-2 rounded-full" style={{ background: "#59C059" }} />
          Ready
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={18} minSize={14} maxSize={28}>
            <BlockPalette onAddBlock={handleAddBlock} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={38} minSize={28} maxSize={55}>
            <div
              className="h-full flex flex-col items-center justify-center p-4 gap-4"
              style={{ background: "#1a1a2e" }}
            >
              <Stage spriteState={spriteState} />

              <div className="w-full max-w-[480px] bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3">
                <button
                  onClick={handleRun}
                  disabled={isRunning || !hasFlag}
                  data-testid="button-run"
                  aria-label="Run script"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 focus:ring-offset-transparent"
                  style={{
                    background: isRunning ? "#555" : "#59C059",
                    boxShadow: isRunning ? "none" : "0 3px 0 #3a8a3a",
                    color: "white",
                  }}
                  title={!hasFlag ? 'Add a "When flag clicked" block first' : "Run script"}
                >
                  <Play size={18} className="fill-white text-white" />
                </button>

                <button
                  onClick={handleStop}
                  disabled={!isRunning}
                  data-testid="button-stop"
                  aria-label="Stop script"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 focus:ring-offset-transparent"
                  style={{
                    background: "#FF6680",
                    boxShadow: isRunning ? "0 3px 0 #cc3355" : "none",
                    color: "white",
                  }}
                  title="Stop"
                >
                  <Square size={16} className="fill-white text-white" />
                </button>

                <button
                  onClick={handleReset}
                  data-testid="button-reset"
                  aria-label="Reset sprite"
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-transparent"
                  style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                  title="Reset sprite position"
                >
                  <RotateCcw size={16} />
                </button>

                <div className="flex-1" />

                <div
                  className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.3)", color: "#7BEEFF" }}
                  data-testid="sprite-coordinates"
                >
                  x:{Math.round(spriteState.x)} y:{Math.round(spriteState.y)} dir:{Math.round(spriteState.direction)}°
                </div>
              </div>

              {!hasFlag && scriptBlocks.length > 0 && (
                <div className="text-xs text-yellow-300 bg-yellow-500/20 rounded-lg px-3 py-2 font-semibold w-full max-w-[480px] text-center">
                  Add a "When flag clicked" block to run your script
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={44} minSize={28}>
            <div className="h-full flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Script
                </span>
                {scriptBlocks.length > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: "#4C97FF" }}
                  >
                    {scriptBlocks.length} block{scriptBlocks.length !== 1 ? "s" : ""}
                  </span>
                )}

                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    aria-label="Undo"
                    title="Undo (Ctrl+Z)"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    aria-label="Redo"
                    title="Redo (Ctrl+Y)"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <Redo2 size={14} />
                  </button>
                </div>

                {scriptBlocks.length > 0 && (
                  <button
                    className="ml-auto text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors focus:outline-none focus:text-red-500"
                    onClick={() => setScriptBlocks([])}
                    aria-label="Clear all blocks"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <ScriptArea blocks={scriptBlocks} onChange={setScriptBlocks} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
