import { Trash2 } from "lucide-react";
import { BlockDef, BlockInstance, BLOCK_CATALOG, CATEGORY_COLORS } from "@/types/blocks";
import { ScriptArea } from "@/components/ScriptArea";

interface BlockComponentProps {
  instance: BlockInstance;
  onDelete?: () => void;
  onInnerChange?: (children: BlockInstance[]) => void;
  onValueChange?: (name: string, value: string | number) => void;
  isPaletteItem?: boolean;
  onDragStartFromScript?: (e: React.DragEvent, id: string) => void;
}

function parseLabelParts(def: BlockDef) {
  if (!def.inputs || def.inputs.length === 0) return [{ type: "text" as const, value: def.label }];

  const parts: Array<{ type: "text" | "input"; value: string }> = [];
  let remaining = def.label;

  for (const input of def.inputs) {
    const placeholder = `{${input.name}}`;
    const idx = remaining.indexOf(placeholder);
    if (idx === -1) continue;
    if (idx > 0) {
      parts.push({ type: "text", value: remaining.slice(0, idx) });
    }
    parts.push({ type: "input", value: input.name });
    remaining = remaining.slice(idx + placeholder.length);
  }

  if (remaining) {
    parts.push({ type: "text", value: remaining });
  }

  return parts;
}

export function BlockComponent({
  instance,
  onDelete,
  onInnerChange,
  onValueChange,
  isPaletteItem = false,
  onDragStartFromScript,
}: BlockComponentProps) {
  const def = BLOCK_CATALOG.find((b) => b.type === instance.type);
  if (!def) return null;

  const color = CATEGORY_COLORS[def.category];
  const parts = parseLabelParts(def);

  const handleDragStart = (e: React.DragEvent) => {
    if (isPaletteItem) {
      e.dataTransfer.setData("application/x-block-palette", instance.type);
      e.dataTransfer.effectAllowed = "copy";
    } else {
      e.dataTransfer.setData("application/x-block-script-id", instance.id);
      e.dataTransfer.effectAllowed = "move";
      if (onDragStartFromScript) onDragStartFromScript(e, instance.id);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.85)",
    border: "none",
    borderRadius: "6px",
    padding: "1px 6px",
    fontWeight: 700,
    color: "#1a1a1a",
    minWidth: "36px",
    width: "auto",
    fontFamily: "Nunito, sans-serif",
    fontSize: "13px",
    outline: "none",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
    display: "inline-block",
  };

  const isFirstBlock = instance.type === "event_whenflagclicked";

  return (
    <div
      data-testid={`block-${instance.type}-${instance.id}`}
      style={{ userSelect: "none" }}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        className="group relative flex items-stretch rounded-lg transition-all duration-150"
        style={{
          background: color,
          boxShadow: `0 3px 0 ${adjustColor(color, -30)}, 0 2px 6px rgba(0,0,0,0.2)`,
          cursor: "grab",
        }}
      >
        {isFirstBlock && (
          <div
            className="absolute -top-3 left-4 w-8 h-4 rounded-sm flex items-center justify-center text-white text-xs font-black"
            style={{ background: color, boxShadow: "0 -2px 4px rgba(0,0,0,0.2)" }}
          >
            ▶
          </div>
        )}

        <div
          className="flex flex-wrap items-center gap-1 px-3 py-2 flex-1 min-h-[40px]"
          style={{ fontSize: "13px", fontWeight: 700, color: "white" }}
        >
          {parts.map((part, i) => {
            if (part.type === "text") {
              return (
                <span key={i} style={{ whiteSpace: "pre" }}>
                  {part.value}
                </span>
              );
            }
            const inputDef = def.inputs?.find((inp) => inp.name === part.value);
            if (!inputDef) return null;

            const currentValue = instance.values[inputDef.name] ?? inputDef.defaultValue;

            if (inputDef.type === "dropdown") {
              return (
                <select
                  key={i}
                  value={String(currentValue)}
                  disabled={isPaletteItem}
                  onChange={(e) =>
                    !isPaletteItem && onValueChange && onValueChange(inputDef.name, e.target.value)
                  }
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    ...inputStyle,
                    cursor: isPaletteItem ? "default" : "pointer",
                    minWidth: "80px",
                    opacity: isPaletteItem ? 0.8 : 1,
                  }}
                >
                  {inputDef.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            }

            const strVal = String(currentValue);
            const approxWidth = Math.max(36, strVal.length * 9 + 12);

            return (
              <input
                key={i}
                type={inputDef.type === "number" ? "number" : "text"}
                value={strVal}
                onChange={(e) => {
                  if (!isPaletteItem && onValueChange) {
                    const val =
                      inputDef.type === "number" ? Number(e.target.value) : e.target.value;
                    onValueChange(inputDef.name, val);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                readOnly={isPaletteItem}
                style={{ ...inputStyle, width: `${approxWidth}px` }}
              />
            );
          })}
        </div>

        {!isPaletteItem && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onDelete();
              }
            }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity px-2 flex items-center text-white/70 hover:text-white"
            title="Delete block"
            aria-label="Delete block"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {def.hasInner && (
        <div
          style={{
            borderLeft: `4px solid ${adjustColor(color, -20)}`,
            background: "rgba(0,0,0,0.08)",
            marginLeft: "16px",
            minHeight: "40px",
            borderRadius: "0 0 4px 4px",
          }}
        >
          <ScriptArea
            blocks={instance.children ?? []}
            onChange={(children) => onInnerChange && onInnerChange(children)}
            isInner
            parentColor={color}
          />
        </div>
      )}

      {def.hasInner && (
        <div
          style={{
            background: color,
            height: "10px",
            borderRadius: "0 0 6px 6px",
            boxShadow: `0 3px 0 ${adjustColor(color, -30)}`,
          }}
        />
      )}
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
