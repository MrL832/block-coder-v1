import { useState, useCallback } from "react";
import { BlockInstance, BLOCK_CATALOG } from "@/types/blocks";
import { BlockComponent } from "@/components/BlockComponent";

let idCounter = 1;
function makeId() {
  return `block-${Date.now()}-${idCounter++}`;
}

function createInstance(blockType: string): BlockInstance | null {
  const def = BLOCK_CATALOG.find((b) => b.type === blockType);
  if (!def) return null;
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

function removeById(blocks: BlockInstance[], id: string): [BlockInstance[], BlockInstance | null] {
  let removed: BlockInstance | null = null;
  const result: BlockInstance[] = [];
  for (const b of blocks) {
    if (b.id === id) {
      removed = b;
    } else {
      const [newChildren, r] = removeById(b.children ?? [], id);
      if (r) removed = r;
      result.push({ ...b, children: b.children !== undefined ? newChildren : undefined });
    }
  }
  return [result, removed];
}

interface ScriptAreaProps {
  blocks: BlockInstance[];
  onChange: (blocks: BlockInstance[]) => void;
  isInner?: boolean;
  parentColor?: string;
}

export function ScriptArea({ blocks, onChange, isInner = false, parentColor }: ScriptAreaProps) {
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes("application/x-block-palette")
      ? "copy"
      : "move";
    setDragOverIdx(idx);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverIdx(null);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent, insertIdx: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverIdx(null);

      const paletteType = e.dataTransfer.getData("application/x-block-palette");
      const scriptId = e.dataTransfer.getData("application/x-block-script-id");

      if (paletteType) {
        const newBlock = createInstance(paletteType);
        if (!newBlock) return;
        const next = [...blocks];
        next.splice(insertIdx, 0, newBlock);
        onChange(next);
      } else if (scriptId) {
        if (draggingId === scriptId) {
          const [without, moved] = removeById(blocks, scriptId);
          if (!moved) return;
          const targetIdx = Math.min(insertIdx, without.length);
          without.splice(targetIdx, 0, moved);
          onChange(without);
        }
      }
    },
    [blocks, onChange, draggingId]
  );

  const handleDropOnArea = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIdx(null);

    const paletteType = e.dataTransfer.getData("application/x-block-palette");
    const scriptId = e.dataTransfer.getData("application/x-block-script-id");

    if (paletteType) {
      const newBlock = createInstance(paletteType);
      if (!newBlock) return;
      onChange([...blocks, newBlock]);
    } else if (scriptId && draggingId === scriptId) {
      const [without, moved] = removeById(blocks, scriptId);
      if (!moved) return;
      onChange([...without, moved]);
    }
  };

  const deleteBlock = (id: string) => {
    const [next] = removeById(blocks, id);
    onChange(next);
  };

  const updateBlockValues = (id: string, name: string, value: string | number) => {
    const update = (list: BlockInstance[]): BlockInstance[] =>
      list.map((b) => {
        if (b.id === id) return { ...b, values: { ...b.values, [name]: value } };
        if (b.children) return { ...b, children: update(b.children) };
        return b;
      });
    onChange(update(blocks));
  };

  const updateInnerBlocks = (id: string, children: BlockInstance[]) => {
    const update = (list: BlockInstance[]): BlockInstance[] =>
      list.map((b) => {
        if (b.id === id) return { ...b, children };
        if (b.children) return { ...b, children: update(b.children) };
        return b;
      });
    onChange(update(blocks));
  };

  if (isInner) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDropOnArea}
        className="p-2 flex flex-col gap-1 min-h-[36px]"
      >
        {blocks.length === 0 && (
          <div className="text-xs text-white/50 italic px-2 py-1">Drop blocks here</div>
        )}
        {blocks.map((block, idx) => (
          <div key={block.id}>
            <div
              className="h-1 rounded"
              style={{
                background: dragOverIdx === idx ? "rgba(255,255,255,0.6)" : "transparent",
                transition: "background 0.1s",
              }}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
            />
            <BlockComponent
              instance={block}
              onDelete={() => deleteBlock(block.id)}
              onInnerChange={(children) => updateInnerBlocks(block.id, children)}
              onValueChange={(name, value) => updateBlockValues(block.id, name, value)}
              onDragStartFromScript={(_, id) => setDraggingId(id)}
            />
          </div>
        ))}
        <div
          className="h-2 rounded"
          style={{
            background:
              dragOverIdx === blocks.length ? "rgba(255,255,255,0.6)" : "transparent",
            transition: "background 0.1s",
          }}
          onDragOver={(e) => handleDragOver(e, blocks.length)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, blocks.length)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-4 relative"
      data-testid="script-drop-zone"
      style={{
        background: "radial-gradient(circle, #d0d8e8 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundColor: "#eef1f6",
        minHeight: "100%",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (dragOverIdx === null) setDragOverIdx(blocks.length);
      }}
      onDragLeave={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          setDragOverIdx(null);
        }
      }}
      onDrop={handleDropOnArea}
    >
      {blocks.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center opacity-50">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: "rgba(76, 151, 255, 0.15)" }}
            >
              🧩
            </div>
            <p className="font-bold text-gray-500 text-base">Drag blocks here</p>
            <p className="text-gray-400 text-sm mt-1">to start coding!</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {blocks.map((block, idx) => (
          <div key={block.id}>
            <div
              style={{
                height: dragOverIdx === idx ? "6px" : "3px",
                background: dragOverIdx === idx ? "#4C97FF" : "transparent",
                borderRadius: "3px",
                transition: "all 0.1s",
                margin: "1px 0",
              }}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
            />
            <BlockComponent
              instance={block}
              onDelete={() => deleteBlock(block.id)}
              onInnerChange={(children) => updateInnerBlocks(block.id, children)}
              onValueChange={(name, value) => updateBlockValues(block.id, name, value)}
              onDragStartFromScript={(_, id) => setDraggingId(id)}
            />
          </div>
        ))}

        <div
          style={{
            height: dragOverIdx === blocks.length ? "6px" : "3px",
            background: dragOverIdx === blocks.length ? "#4C97FF" : "transparent",
            borderRadius: "3px",
            transition: "all 0.1s",
            margin: "1px 0",
          }}
          onDragOver={(e) => handleDragOver(e, blocks.length)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, blocks.length)}
        />
      </div>
    </div>
  );
}
