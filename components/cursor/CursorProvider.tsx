"use client";

import {
  createContext,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  cursorDefinitions,
  cursorStates,
  isCursorState,
  type CursorState,
} from "@/lib/cursor";

type CursorContextValue = {
  state: CursorState;
  setState: (state: CursorState) => void;
};

const CursorContext = createContext<CursorContextValue | null>(null);

function stateFromTarget(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "normal";

  const cursorTarget = target.closest<HTMLElement>("[data-cursor]");
  const requestedState = cursorTarget?.dataset.cursor;

  if (isCursorState(requestedState)) return requestedState;
  if (target.closest("button, a, [role='button'], input, textarea, select"))
    return "hand";
  return "normal";
}

export function CursorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CursorState>("normal");
  const [visible, setVisible] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const hoveredStateRef = useRef<CursorState>("normal");

  useEffect(() => {
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updatePointerMode = () => setFinePointer(pointerQuery.matches);

    updatePointerMode();
    pointerQuery.addEventListener("change", updatePointerMode);

    return () => pointerQuery.removeEventListener("change", updatePointerMode);
  }, []);

  useEffect(() => {
    if (!finePointer) return;

    const onMove = (event: PointerEvent) => {
      cursorRef.current?.style.setProperty(
        "transform",
        `translate3d(${event.clientX}px, ${event.clientY}px, 0)`,
      );
      setVisible(true);
    };
    const onOver = (event: PointerEvent) => {
      const nextState = stateFromTarget(event.target);
      hoveredStateRef.current = nextState;
      if (event.buttons === 0) setState(nextState);
    };
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const nextState = stateFromTarget(event.target);
      hoveredStateRef.current = nextState;
      setState(nextState === "key" ? "key" : "grab");
    };
    const onUp = () => setState(hoveredStateRef.current);
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [finePointer]);

  const setCursorState = useCallback((nextState: CursorState) => {
    hoveredStateRef.current = nextState;
    setState(nextState);
  }, []);

  return (
    <CursorContext.Provider value={{ state, setState: setCursorState }}>
      <div className={finePointer ? "custom-cursor-enabled" : undefined}>{children}</div>
      {finePointer ? (
        <div
          ref={cursorRef}
          className={`custom-cursor${visible ? " is-visible" : ""}`}
          aria-hidden="true"
        >
          {cursorStates.map((cursorState) => {
            const definition = cursorDefinitions[cursorState];
            return (
              // Cursor artwork is intentionally rendered at its exact CSS size.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={cursorState}
                className={`custom-cursor__image${
                  cursorState === state ? " is-active" : ""
                }`}
                src={definition.src}
                alt=""
                style={{
                  width: definition.width,
                  transform: `translate(${-definition.hotspot.x}px, ${-definition.hotspot.y}px)`,
                }}
              />
            );
          })}
        </div>
      ) : null}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) throw new Error("useCursor must be used inside CursorProvider");
  return context;
}

export function CursorArea({
  state,
  children,
  className,
  onPointerDown,
}: {
  state: CursorState;
  children: ReactNode;
  className?: string;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className={className} data-cursor={state} onPointerDown={onPointerDown}>
      {children}
    </div>
  );
}
