import { useState } from "react";
import {
  BlockCategory,
  BLOCK_CATALOG,
  CATEGORY_COLORS,
  BlockInstance,
  BlockDef,
} from "@/types/blocks";

const CATEGORIES: BlockCategory[] = [
  "Events",
  "Motion",
  "Looks",
  "Control",
  "Operators",
  "Variables",
  "Sound",
];

let paletteDragId = 1000;

function defToInstance(def: BlockDef): BlockInstance {
  const values: Record<string, string | number> = {};
  for (const inp of def.inputs ?? []) {
    values[inp.name] = inp.defaultValue;
  }
  return {
    id: `palette-${paletteDragId++}`,
    type: def.type,
    values,
    children: def.hasInner ? [] : undefined,
  };
}

interface PaletteBlockProps {
  def: BlockDef;
}

function PaletteBlock({ def }: PaletteBlockProps) {
  const color = CATEGORY_COLORS[def.category];
  const instance = defToInstance(def);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/x-block-palette", def.type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const labelText = def.label.replace(/\{[^}]+\}/g, (match) => {
    const name = match.slice(1, -1);
    const inp = def.inputs?.find((i) => i.name === name);
    return String(inp?.defaultValue ?? "...");
  });

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      data-testid={`palette-block-${def.type}`}
      className="select-none cursor-grab active:cursor-grabbing rounded-lg px-3 py-2 transition-all duration-150 hover:brightness-110 hover:scale-[1.02] active:scale-95"
      style={{
        background: color,
        color: "white",
        fontWeight: 700,
        fontSize: "13px",
        boxShadow: `0 2px 0 ${adjustColor(color, -30)}, 0 2px 4px rgba(0,0,0,0.15)`,
        fontFamily: "Nunito, sans-serif",
      }}
      title={`Drag to script area`}
    >
      {def.type === "event_whenflagclicked" && (
        <span className="mr-1 text-sm">▶</span>
      )}
      {labelText}
    </div>
  );
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function BlockPalette() {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>("Events");

  const filtered = BLOCK_CATALOG.filter((b) => b.category === activeCategory);

  return (
    <div
      className="flex flex-col border-r border-gray-200 bg-white overflow-hidden shrink-0"
      style={{ width: "220px" }}
      data-testid="block-palette"
    >
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Blocks</p>
      </div>

      <div className="flex flex-col gap-0.5 p-2 border-b border-gray-100 overflow-y-auto" style={{ maxHeight: "240px" }}>
        {CATEGORIES.map((cat) => {
          const color = CATEGORY_COLORS[cat];
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              data-testid={`category-tab-${cat}`}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 text-left"
              style={{
                background: isActive ? color : "transparent",
                color: isActive ? "white" : "#555",
                fontWeight: isActive ? 700 : 600,
                fontSize: "13px",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: color, boxShadow: isActive ? "none" : `0 0 0 1px ${color}` }}
              />
              {cat}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filtered.map((def) => (
          <PaletteBlock key={def.type} def={def} />
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center mt-4">No blocks in this category yet</p>
        )}
      </div>
    </div>
  );
}
