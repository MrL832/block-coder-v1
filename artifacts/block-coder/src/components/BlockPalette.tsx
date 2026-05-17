import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  BlockCategory,
  BLOCK_CATALOG,
  CATEGORY_COLORS,
  BlockDef,
} from "@/types/blocks";

const CATEGORIES: BlockCategory[] = [
  "Events",
  "Motion",
  "Looks",
  "Control",
  "Operators",
];

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

interface PaletteBlockProps {
  def: BlockDef;
  onAdd?: (def: BlockDef) => void;
}

function PaletteBlock({ def, onAdd }: PaletteBlockProps) {
  const color = CATEGORY_COLORS[def.category];

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
      tabIndex={0}
      role="button"
      aria-label={`Add ${labelText} block`}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onAdd) {
          e.preventDefault();
          onAdd(def);
        }
      }}
      onClick={() => onAdd && onAdd(def)}
      data-testid={`palette-block-${def.type}`}
      className="select-none cursor-grab active:cursor-grabbing rounded-lg px-3 py-2 transition-all duration-150 hover:brightness-110 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1"
      style={{
        background: color,
        color: "white",
        fontWeight: 700,
        fontSize: "13px",
        boxShadow: `0 2px 0 ${adjustColor(color, -30)}, 0 2px 4px rgba(0,0,0,0.15)`,
        fontFamily: "Nunito, sans-serif",
      }}
      title="Drag to script area, or press Enter to add"
    >
      {def.type === "event_whenflagclicked" && (
        <span className="mr-1 text-sm">▶</span>
      )}
      {labelText}
    </div>
  );
}

interface BlockPaletteProps {
  onAddBlock?: (def: BlockDef) => void;
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>("Events");
  const [searchQuery, setSearchQuery] = useState("");

  const isSearching = searchQuery.trim().length > 0;

  const filteredBlocks = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.toLowerCase();
      return BLOCK_CATALOG.filter(
        (b) =>
          b.label.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }
    return BLOCK_CATALOG.filter((b) => b.category === activeCategory);
  }, [activeCategory, searchQuery, isSearching]);

  return (
    <div
      className="flex flex-col border-r border-gray-200 bg-white overflow-hidden shrink-0"
      style={{ width: "100%", height: "100%" }}
      data-testid="block-palette"
    >
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Blocks</p>
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="block-search"
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            style={{ fontFamily: "Nunito, sans-serif", fontWeight: 600 }}
          />
        </div>
      </div>

      {!isSearching && (
        <div
          className="flex flex-col gap-0.5 p-2 border-b border-gray-100 overflow-y-auto"
          style={{ maxHeight: "220px" }}
        >
          {CATEGORIES.map((cat) => {
            const color = CATEGORY_COLORS[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                data-testid={`category-tab-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150 text-left focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{
                  background: isActive ? color : "transparent",
                  color: isActive ? "white" : "#555",
                  fontWeight: isActive ? 700 : 600,
                  fontSize: "12px",
                  fontFamily: "Nunito, sans-serif",
                }}
                aria-pressed={isActive}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: color,
                    boxShadow: isActive ? "none" : `0 0 0 1px ${color}`,
                  }}
                />
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {isSearching && (
        <div className="px-3 pt-2 pb-1">
          <p className="text-xs text-gray-400 font-semibold">
            {filteredBlocks.length} result{filteredBlocks.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {filteredBlocks.map((def) => (
          <PaletteBlock key={def.type} def={def} onAdd={onAddBlock} />
        ))}
        {filteredBlocks.length === 0 && (
          <p className="text-xs text-gray-400 italic text-center mt-4">
            {isSearching ? `No blocks match "${searchQuery}"` : "No blocks in this category yet"}
          </p>
        )}
      </div>
    </div>
  );
}
