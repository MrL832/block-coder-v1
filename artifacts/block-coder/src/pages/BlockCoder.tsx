import { useState } from "react";
import { BlockPalette } from "@/components/BlockPalette";
import { ScriptArea } from "@/components/ScriptArea";
import { Stage } from "@/components/Stage";
import { useExecutionEngine } from "@/hooks/useExecutionEngine";
import { BlockInstance } from "@/types/blocks";
import { Play, Square, RotateCcw } from "lucide-react";

export default function BlockCoder() {
  const [scriptBlocks, setScriptBlocks] = useState<BlockInstance[]>([]);
  const { spriteState, runScript, stopExecution, resetSprite, isRunning } =
    useExecutionEngine();

  const handleRun = () => {
    runScript(scriptBlocks);
  };

  const handleStop = () => {
    stopExecution();
  };

  const handleReset = () => {
    resetSprite();
  };

  const hasFlag = scriptBlocks.some((b) => b.type === "event_whenflagclicked");

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
          Snap blocks together to make the cat move!
        </p>
        <div className="ml-auto flex items-center gap-1 text-xs text-gray-400 font-semibold">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#59C059" }}
          />
          Ready
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <BlockPalette />

        <div
          className="shrink-0 flex flex-col border-r border-gray-200"
          style={{ width: "500px", background: "#1a1a2e" }}
        >
          <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
            <Stage spriteState={spriteState} />

            <div className="w-full bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3">
              <button
                onClick={handleRun}
                disabled={isRunning || !hasFlag}
                data-testid="button-run"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isRunning ? "#666" : "#59C059",
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
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                }}
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
                x: {Math.round(spriteState.x)} &nbsp; y: {Math.round(spriteState.y)} &nbsp; dir:{" "}
                {Math.round(spriteState.direction)}°
              </div>
            </div>

            {!hasFlag && scriptBlocks.length > 0 && (
              <div
                className="text-xs text-yellow-300 bg-yellow-500/20 rounded-lg px-3 py-2 font-semibold w-full text-center"
              >
                Add a "When flag clicked" block to run your script
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-2">
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
            {scriptBlocks.length > 0 && (
              <button
                className="ml-auto text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors"
                onClick={() => setScriptBlocks([])}
              >
                Clear all
              </button>
            )}
          </div>
          <ScriptArea blocks={scriptBlocks} onChange={setScriptBlocks} />
        </div>
      </main>
    </div>
  );
}
