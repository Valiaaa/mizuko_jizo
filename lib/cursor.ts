import grabCursor from "@/mouse/Mouse_HandGrab.png";
import handCursor from "@/mouse/Mouse_HandNormal.png";
import keyCursor from "@/mouse/Mouse_Key.png";
import normalCursor from "@/mouse/Mouse_Normal.png";

export const cursorStates = ["normal", "hand", "grab", "key"] as const;

export type CursorState = (typeof cursorStates)[number];

type CursorDefinition = {
  label: string;
  src: string;
  width: number;
  hotspot: { x: number; y: number };
};

/**
 * The hotspot is expressed in final CSS pixels, not source-image pixels.
 * Every state uses a point near its upper-left tip, so swapping artwork never
 * changes the interaction anchor. Tune these values only after testing the
 * cursor at its final display size.
 */
export const cursorDefinitions: Record<CursorState, CursorDefinition> = {
  normal: {
    label: "普通",
    src: normalCursor.src,
    width: 44,
    hotspot: { x: 12, y: 4 },
  },
  hand: {
    label: "可点击",
    src: handCursor.src,
    width: 64,
    hotspot: { x: 4, y: 2 },
  },
  grab: {
    label: "拖动中",
    src: grabCursor.src,
    width: 64,
    hotspot: { x: 3, y: 3 },
  },
  key: {
    label: "钥匙",
    src: keyCursor.src,
    width: 48,
    hotspot: { x: 4, y: 3 },
  },
};

export function isCursorState(value: string | undefined): value is CursorState {
  return cursorStates.includes(value as CursorState);
}
