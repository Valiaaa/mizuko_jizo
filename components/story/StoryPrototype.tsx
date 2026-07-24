"use client";

import { useRef, useState, type PointerEvent } from "react";
import { CursorArea } from "@/components/cursor/CursorProvider";
import { chapters } from "@/content/story";

export function StoryPrototype() {
  const [discovered, setDiscovered] = useState(false);
  const [stonePosition, setStonePosition] = useState({ x: 0, y: 0 });
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = {
      x: event.clientX - stonePosition.x,
      y: event.clientY - stonePosition.y,
    };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragOrigin.current) return;
    setStonePosition({
      x: event.clientX - dragOrigin.current.x,
      y: event.clientY - dragOrigin.current.y,
    });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    dragOrigin.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <main className="prototype">
      <section className="hero" aria-labelledby="story-title">
        <div className="hero__grain" aria-hidden="true" />
        <p className="eyebrow">An interactive novel · 交互小说</p>
        <h1 id="story-title">
          水子
          <span>地藏</span>
        </h1>
        <p className="hero__intro">
          故事会在点击、寻找与拖动之间展开。这里是项目的第一块地基：
          一套不会在状态切换时跳位的鼠标，以及可持续扩展的章节结构。
        </p>

        <div className="interaction-stage" aria-label="鼠标交互测试区">
          <button
            className="seal"
            type="button"
            data-cursor="hand"
            aria-pressed={discovered}
            onClick={() => setDiscovered((value) => !value)}
          >
            <span>{discovered ? "已发现" : "点击"}</span>
          </button>

          <CursorArea state="hand" className="drag-stone" onPointerDown={startDrag}>
            <div
              className="drag-stone__body"
              style={{
                transform: `translate3d(${stonePosition.x}px, ${stonePosition.y}px, 0)`,
              }}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <span>拖动</span>
            </div>
          </CursorArea>

          <div className={`whisper${discovered ? " is-visible" : ""}`} aria-live="polite">
            “有些名字，只在被触碰之后才会出现。”
          </div>
        </div>

        <a className="hero__continue" href="#chapters" data-cursor="hand">
          查看章节结构
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="chapters" id="chapters" aria-labelledby="chapters-title">
        <header className="section-heading">
          <p className="eyebrow">Story architecture</p>
          <h2 id="chapters-title">章节是一组独立场景</h2>
          <p>每章拥有自己的画面、互动与节奏；共享鼠标、声音、转场、进度和无障碍基础。</p>
        </header>

        <ol className="chapter-list">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <article className="chapter-card" data-cursor="hand">
                <span className="chapter-card__number">{chapter.number}</span>
                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.titleEn}</p>
                </div>
                <span className="chapter-card__interaction">
                  {chapter.interaction === "drag" ? "拖动" : "点击"}
                </span>
              </article>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
