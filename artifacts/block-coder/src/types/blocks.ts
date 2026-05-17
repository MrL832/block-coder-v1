export type BlockCategory =
  | "Motion"
  | "Looks"
  | "Events"
  | "Control";

export type BlockType =
  | "event_whenflagclicked"
  | "motion_movesteps"
  | "motion_turndegrees"
  | "motion_gotoxy"
  | "motion_glidesecstoxy"
  | "looks_sayforsecs"
  | "looks_setcoloreffectto"
  | "control_waitsecs"
  | "control_repeat"
  | "control_if"
  | "control_stop";

export interface BlockDef {
  type: BlockType;
  category: BlockCategory;
  label: string;
  hasInner?: boolean;
  inputs?: BlockInputDef[];
}

export interface BlockInputDef {
  name: string;
  type: "number" | "text" | "dropdown";
  defaultValue: string | number;
  options?: string[];
}

export interface BlockInstance {
  id: string;
  type: BlockType;
  values: Record<string, string | number>;
  children?: BlockInstance[];
}

export interface SpriteState {
  x: number;
  y: number;
  direction: number;
  speech: string | null;
  colorEffect: number;
  visible: boolean;
}

export const CATEGORY_COLORS: Record<BlockCategory, string> = {
  Motion: "#4C97FF",
  Looks: "#9966FF",
  Events: "#FFAB19",
  Control: "#FF8C1A",
};

export const BLOCK_CATALOG: BlockDef[] = [
  {
    type: "event_whenflagclicked",
    category: "Events",
    label: "When flag clicked",
  },
  {
    type: "motion_movesteps",
    category: "Motion",
    label: "Move {steps} steps",
    inputs: [{ name: "steps", type: "number", defaultValue: 10 }],
  },
  {
    type: "motion_turndegrees",
    category: "Motion",
    label: "Turn {degrees} degrees",
    inputs: [{ name: "degrees", type: "number", defaultValue: 15 }],
  },
  {
    type: "motion_gotoxy",
    category: "Motion",
    label: "Go to x:{x} y:{y}",
    inputs: [
      { name: "x", type: "number", defaultValue: 0 },
      { name: "y", type: "number", defaultValue: 0 },
    ],
  },
  {
    type: "motion_glidesecstoxy",
    category: "Motion",
    label: "Glide {secs} secs to x:{x} y:{y}",
    inputs: [
      { name: "secs", type: "number", defaultValue: 1 },
      { name: "x", type: "number", defaultValue: 0 },
      { name: "y", type: "number", defaultValue: 0 },
    ],
  },
  {
    type: "looks_sayforsecs",
    category: "Looks",
    label: "Say {text} for {secs} seconds",
    inputs: [
      { name: "text", type: "text", defaultValue: "Hello!" },
      { name: "secs", type: "number", defaultValue: 2 },
    ],
  },
  {
    type: "looks_setcoloreffectto",
    category: "Looks",
    label: "Set color effect to {effect} {value}",
    inputs: [
      {
        name: "effect",
        type: "dropdown",
        defaultValue: "hue",
        options: ["hue", "brightness", "ghost"],
      },
      { name: "value", type: "number", defaultValue: 50 },
    ],
  },
  {
    type: "control_waitsecs",
    category: "Control",
    label: "Wait {secs} seconds",
    inputs: [{ name: "secs", type: "number", defaultValue: 1 }],
  },
  {
    type: "control_repeat",
    category: "Control",
    label: "Repeat {times} times",
    hasInner: true,
    inputs: [{ name: "times", type: "number", defaultValue: 10 }],
  },
  {
    type: "control_if",
    category: "Control",
    label: "If {condition} then",
    hasInner: true,
    inputs: [
      {
        name: "condition",
        type: "dropdown",
        defaultValue: "x > 0",
        options: [
          "x > 0",
          "x < 0",
          "y > 0",
          "y < 0",
          "touching edge",
          "always true",
          "always false",
        ],
      },
    ],
  },
  {
    type: "control_stop",
    category: "Control",
    label: "Stop {option}",
    inputs: [
      {
        name: "option",
        type: "dropdown",
        defaultValue: "all",
        options: ["all", "this script"],
      },
    ],
  },
];
