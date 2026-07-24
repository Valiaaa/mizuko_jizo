"use client";

import { CSSProperties, PointerEvent, useEffect, useMemo, useRef, useState } from "react";

type LayerObject = {
  id: string;
  file: string;
  x: number;
  y: number;
  width: number;
  rotate?: number;
  z?: number;
};

type DragState = Record<string, { dx: number; dy: number; removed?: boolean }>;

const STORAGE_KEY = "mizuko-room-progress-v1";

const objects = {
  beetle: ["LO-beatle.png", 9],
  cake: ["LO-cake.png", 25],
  frame: ["LO_frame.png", 25],
  clock: ["LO-clock.png", 27],
  suit: ["LO-suit.png", 30],
  vase: ["LO-vase.png", 24],
  suanpan: ["LO-suanpan.png", 41],
  computer: ["LO-computer.png", 35],
  statue: ["LO-statue.png", 26],
  cup: ["LO-cup.png", 24],
  lamp: ["LO-lamp.png", 25],
  flower1: ["LO-flower1.png", 34],
  flower2: ["LO-flower2.png", 31],
  flower3: ["LO-flower3.png", 31],
  keyboard: ["LO-keyboard.png", 39],
  tv: ["LO-tv.png", 34],
  cup2: ["LO-cup2.png", 18],
  ant: ["LO_ant.png", 16],
} as const;

const item = (
  id: keyof typeof objects,
  x: number,
  y: number,
  width = objects[id][1],
  rotate = 0,
  z = 1,
): LayerObject => ({
  id,
  file: objects[id][0],
  x,
  y,
  width,
  rotate,
  z,
});

// Every phase owns its complete layout. We can tune these lists one phase at a
// time without changing the interaction code.
const PHASES: LayerObject[][] = [
  [item("beetle", 78, 30, 7, 12)],
  [
    item("cake", -3, 48, 25, -2),
    item("frame", 79, 53, 24, 11),
    item("beetle", 88, 27, 7, 12),
  ],
  [
    item("cake", -4, 53, 23, -2),
    item("frame", 80, 58, 23, 10),
    item("clock", 24, 13, 25, -3),
    item("suit", 61, 15, 27, 19),
    item("vase", 54, 35, 19, -4),
    item("suanpan", 24, 67, 40, -2),
    item("beetle", 88, 26, 7, 12),
  ],
  [
    item("cake", -4, 55, 22, -2),
    item("frame", 81, 58, 22, 10),
    item("clock", -2, 5, 25, -4),
    item("suit", 66, 5, 27, 18),
    item("vase", 88, 4, 18, 3),
    item("suanpan", 7, 68, 39, -2),
    item("computer", 22, 17, 31, -6),
    item("statue", 42, 1, 24, -2),
    item("cup", 50, 56, 20, 0),
    item("lamp", 60, 34, 20, 10),
    item("beetle", 87, 28, 7, 12),
  ],
  [
    item("computer", -7, 11, 31, -5, 3),
    item("clock", 4, 65, 28, -7, 3),
    item("suanpan", -10, 72, 38, -2),
    item("flower1", 15, -7, 35, -14, 2),
    item("flower2", 25, 3, 34, 9, 2),
    item("flower3", 54, -8, 32, 7, 2),
    item("keyboard", 45, -6, 31, 7, 2),
    item("ant", 38, 38, 16, 7, 5),
    item("tv", 40, 48, 34, 6, 4),
    item("statue", 76, 14, 25, 5, 3),
    item("lamp", 67, 45, 22, 8, 3),
    item("cup", 88, 47, 20, -2, 3),
    item("suit", 78, -5, 28, 15, 2),
    item("vase", 84, 58, 21, 7, 2),
    item("frame", 60, 67, 25, -9, 2),
    item("cake", -4, 58, 22, -2),
    item("cup2", 29, 66, 18, 12, 3),
    item("beetle", 72, 22, 8, 10, 5),
  ],
];

function loadProgress(): { phase: number; drag: DragState } {
  if (typeof window === "undefined") return { phase: 0, drag: {} };
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      phase: Math.min(Math.max(Number(saved.phase) || 0, 0), 5),
      drag: saved.drag && typeof saved.drag === "object" ? saved.drag : {},
    };
  } catch {
    return { phase: 0, drag: {} };
  }
}

export default function Home() {
  const [phase, setPhase] = useState(0);
  const [drag, setDrag] = useState<DragState>({});
  const [ready, setReady] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const progress = loadProgress();
    setPhase(progress.phase);
    setDrag(progress.drag);
    setReady(true);

    for (let index = 1; index <= 6; index += 1) {
      const image = new Image();
      image.src = `/assets/rooms/room${index}.png`;
    }

    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ phase, drag }));
  }, [phase, drag, ready]);

  const currentObjects = useMemo(
    () => (phase === 5 ? PHASES[4] : PHASES[Math.min(phase, 4)]),
    [phase],
  );
  const draggable = phase === 5;

  const advance = () => {
    if (transitioning || phase >= 5) return;
    setTransitioning(true);
    transitionTimer.current = setTimeout(() => {
      setPhase((value) => Math.min(value + 1, 5));
      setTransitioning(false);
    }, 620);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advance();
    }
  };

  return (
    <main className={`experience ${draggable ? "is-drag-phase" : ""}`}>
      <div
        className="room-stage"
        role={draggable ? undefined : "button"}
        tabIndex={draggable ? -1 : 0}
        aria-label={draggable ? "最终房间场景" : `房间场景 ${phase + 1}，点击进入下一阶段`}
        onClick={advance}
        onKeyDown={handleKeyDown}
        style={
          {
            "--room-image": `url("/assets/rooms/room${phase + 1}.png")`,
          } as CSSProperties
        }
      >
        <div className="room-image" aria-hidden="true" />
        <div className="layer-field" aria-label={draggable ? "可拖动的遮挡物" : "房间遮挡物"}>
          {currentObjects.map((object) => (
            <Layer
              key={object.id}
              object={object}
              draggable={draggable}
              position={drag[object.id]}
              onChange={(next) =>
                setDrag((current) => ({ ...current, [object.id]: next }))
              }
            />
          ))}
        </div>
      </div>

      <div
        className={`scene-transition ${transitioning ? "is-active" : ""}`}
        aria-hidden="true"
      />
      <p className="phase-indicator" aria-live="polite">
        {String(phase + 1).padStart(2, "0")} / 06
      </p>
    </main>
  );
}

function Layer({
  object,
  draggable,
  position,
  onChange,
}: {
  object: LayerObject;
  draggable: boolean;
  position?: DragState[string];
  onChange: (next: DragState[string]) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{
    id: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  if (position?.removed) return null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!draggable) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position?.dx ?? 0,
      originY: position?.dy ?? 0,
    };
    event.currentTarget.dataset.grabbing = "true";
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointer.current || pointer.current.id !== event.pointerId) return;
    onChange({
      dx: pointer.current.originX + event.clientX - pointer.current.startX,
      dy: pointer.current.originY + event.clientY - pointer.current.startY,
    });
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (!pointer.current) return;
    pointer.current = null;
    delete event.currentTarget.dataset.grabbing;

    requestAnimationFrame(() => {
      const rect = elementRef.current?.getBoundingClientRect();
      if (
        rect &&
        (rect.right < 0 ||
          rect.left > window.innerWidth ||
          rect.bottom < 0 ||
          rect.top > window.innerHeight)
      ) {
        onChange({ dx: position?.dx ?? 0, dy: position?.dy ?? 0, removed: true });
      }
    });
  };

  return (
    <div
      ref={elementRef}
      className={`layer-object ${draggable ? "is-draggable" : ""}`}
      data-object={object.id}
      aria-label={draggable ? `拖动遮挡物：${object.id}` : undefined}
      style={
        {
          left: `${object.x}%`,
          top: `${object.y}%`,
          width: `${object.width}%`,
          zIndex: object.z ?? 1,
          "--object-rotation": `${object.rotate ?? 0}deg`,
          "--drag-x": `${position?.dx ?? 0}px`,
          "--drag-y": `${position?.dy ?? 0}px`,
        } as CSSProperties
      }
      onClick={(event) => event.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      <img src={`/assets/objects/${object.file}`} alt="" draggable={false} />
    </div>
  );
}
