(() => {
    const scene = document.querySelector('#accident-scene');
    if (!scene) return;
    // Restore the clearing scene after the final accident keyword.
    const pauseAfterAccident = false;
    const ending = scene.querySelector('.accident-ending');
    const stage = scene.querySelector('.accident-stage');
    const dissolve = scene.querySelector('.accident-dissolve');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let dissolveFrame = 0;
    const panels = [...scene.querySelectorAll('.accident-panel')];
    const cursor = document.querySelector('.custom-cursor');
    const params = new URLSearchParams(location.search);
    const storageKey = window.mizukoNavigation.testMode ? 'mizuko-accident-test-page' : 'mizuko-accident-page';
    let savedPage = 1;
    try { savedPage = Number(localStorage.getItem(storageKey)) || 1; } catch {}
    let page = 1;
    let dragging = null;
    let transitionTimer = 0;
    let transitioning = false;
    const setCursor = (mode) => {
        for (const name of ['hand', 'grabbing', 'eye', 'key', 'pointer']) {
            cursor?.classList.toggle(`is-${name}`, mode === name);
        }
    };
    const getCursorMode = (x, y) => {
        if (transitioning) return 'eye';
        if (dragging) return 'grabbing';
        return document.elementFromPoint(x, y)?.closest('.accident-debris') ? 'hand' : 'default';
    };
    const stopDrag = () => {
        if (!dragging) return;
        const { stone, pointerId } = dragging;
        dragging = null;
        stone.classList.remove('is-dragging');
        if (stone.hasPointerCapture(pointerId)) stone.releasePointerCapture(pointerId);
        setCursor('default');
    };
    const showPage = (value) => {
        stopDrag();
        ending.hidden = true;
        stage.inert = false;
        stage.setAttribute('aria-hidden', 'false');
        scene.classList.remove('is-ended');
        page = Math.max(1, Math.min(4, Number(value) || 1));
        panels.forEach((panel, index) => {
            const active = index + 1 === page;
            panel.classList.toggle('is-active', active);
            panel.setAttribute('aria-hidden', String(!active));
            panel.inert = !active;
        });
        scene.dataset.page = String(page);
        try { localStorage.setItem(storageKey, String(page)); } catch {}
        if (window.mizukoNavigation.testMode) {
            const url = new URL(location.href);
            url.searchParams.set('accidentPage', String(page));
            history.replaceState({}, '', url);
        }
    };
    const clearTransition = () => {
        clearTimeout(transitionTimer);
        cancelAnimationFrame(dissolveFrame);
        dissolveFrame = 0;
        dissolve.hidden = true;
        scene.classList.remove('is-dissolving');
        transitioning = false;
        scene.querySelectorAll('.is-chosen').forEach(e => e.classList.remove('is-chosen'));
        setCursor('default');
    };
    const enterScene = (initialPage = 1) => {
        clearTransition();
        document.body.classList.remove('is-next-scene', 'is-door-scene', 'is-door-room',
            'is-hell-story', 'is-hell-accusing', 'is-falling', 'is-falling-settled',
            'is-entering-next-scene', 'is-constellation-scene');
        document.body.classList.add('is-accident-scene');
        window.mizukoExperience.setScene('accident');
        showPage(initialPage);
        return true;
    };
    // Sample the visible text and moved debris so the particles match the final frame.
    const sampleEnding = () => {
        const width = innerWidth, height = innerHeight;
        const ratio = Math.min(1, 1000 / width);
        dissolve.width = Math.ceil(width * ratio);
        dissolve.height = Math.ceil(height * ratio);
        const ctx = dissolve.getContext('2d', { willReadFrequently: true });
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const panel = panels[page - 1];
        panel.querySelectorAll('.accident-debris img').forEach(image => {
            if (!image.complete || !image.naturalWidth) return;
            const rect = image.getBoundingClientRect();
            ctx.drawImage(image, rect.left, rect.top, rect.width, rect.height);
        });
        const walker = document.createTreeWalker(panel.querySelector('.accident-copy'), NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        while (walker.nextNode()) {
            const node = walker.currentNode;
            const style = getComputedStyle(node.parentElement);
            ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            ctx.fillStyle = style.color;
            for (let i = 0; i < node.length; i++) {
                if (!node.textContent[i].trim()) continue;
                range.setStart(node, i); range.setEnd(node, i + 1);
                const rect = range.getBoundingClientRect();
                ctx.fillText(node.textContent[i], rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
        }
        const pixels = ctx.getImageData(0, 0, dissolve.width, dissolve.height).data;
        const particles = [];
        for (let y = 0; y < dissolve.height; y += 3) for (let x = 0; x < dissolve.width; x += 3) {
            const n = (y * dissolve.width + x) * 4;
            if (pixels[n + 3] < 30 || Math.min(pixels[n], pixels[n + 1], pixels[n + 2]) > 240) continue;
            particles.push({ x: x / ratio, y: y / ratio, alpha: pixels[n + 3] / 255,
                color: `rgb(${pixels[n]},${pixels[n+1]},${pixels[n+2]})`,
                dx: (Math.random() - .4) * 190, dy: -25 - Math.random() * 110,
                size: 2 / ratio, delay: Math.random() * .22 });
        }
        return { ctx, particles, width, height };
    };
    const showEnding = (immediate = false) => {
        if (scene.classList.contains('is-ended') || scene.classList.contains('is-dissolving')) return true;
        clearTransition();
        stopDrag();
        transitioning = true;
        stage.inert = true;
        stage.setAttribute('aria-hidden', 'true');
        const finish = () => {
            clearTransition();
            scene.classList.add('is-ended');
            ending.hidden = false;
            ending.focus({ preventScroll: true });
        };
        if (immediate || reducedMotion.matches) { finish(); return true; }
        let sample;
        try { sample = sampleEnding(); } catch { finish(); return true; }
        const { ctx, particles, width, height } = sample;
        dissolve.hidden = false;
        scene.classList.add('is-dissolving');
        const start = performance.now();
        const draw = now => {
            const progress = Math.min(1, (now - start) / 1600);
            ctx.clearRect(0, 0, width, height);
            for (const p of particles) {
                const t = Math.max(0, Math.min(1, (progress - p.delay) / (1 - p.delay)));
                ctx.globalAlpha = p.alpha * (1 - t) ** 1.5;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x + p.dx * t * t, p.y + p.dy * t, p.size * (1 - t * .6), p.size * (1 - t * .6));
            }
            ctx.globalAlpha = 1;
            if (progress < 1) dissolveFrame = requestAnimationFrame(draw);
            else finish();
        };
        dissolveFrame = requestAnimationFrame(draw);
        return true;
    };
    const enterEnding = () => {
        // Reuse the white ending surface without painting an accident panel.
        enterScene(4);
        return showEnding(true);
    };
    const enterConstellation = () => {
        if (pauseAfterAccident) {
            if (window.mizukoExperience.getScene() !== 'accident') enterScene(4);
            return showEnding();
        }
        clearTransition();
        stopDrag();
        document.body.classList.remove('is-accident-scene', 'is-next-scene', 'is-door-scene',
            'is-door-room', 'is-falling', 'is-falling-settled', 'is-entering-next-scene');
        document.body.classList.add('is-constellation-scene');
        window.mizukoExperience.setScene('constellation');
        return true;
    };
    const step = (direction) => {
        if (transitioning) return false;
        clearTransition();
        if (page === 1 && direction < 0) return window.mizukoNavigation.goTo('door-4');
        if (page === 4 && direction > 0) return enterConstellation();
        showPage(page + direction);
        return true;
    };
    scene.addEventListener('click', (event) => {
        const keyword = event.target.closest('.accident-keyword');
        if (!keyword || scene.classList.contains('is-ended') || transitioning || window.mizukoExperience.getScene() !== 'accident') return;
        transitioning = true;
        keyword.classList.add('is-chosen');
        setCursor('eye');
        transitionTimer = setTimeout(() => {
            if (page === 4) enterConstellation();
            else { clearTransition(); showPage(page + 1); }
        }, 500);
    });
    scene.addEventListener('pointerdown', (event) => {
        const stone = event.target.closest('.accident-debris');
        if (!stone || event.button !== 0 || transitioning) return;
        event.preventDefault();
        dragging = { stone, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
            x: Number(stone.dataset.x) || 0, y: Number(stone.dataset.y) || 0 };
        stone.setPointerCapture(event.pointerId);
        stone.classList.add('is-dragging');
        setCursor('grabbing');
    });
    scene.addEventListener('pointermove', (event) => {
        if (!dragging || event.pointerId !== dragging.pointerId) return;
        const { stone, startX, startY, x, y } = dragging;
        const dx = x + event.clientX - startX;
        const dy = y + event.clientY - startY;
        stone.dataset.x = String(dx);
        stone.dataset.y = String(dy);
        stone.style.setProperty('--drag-x', `${dx}px`);
        stone.style.setProperty('--drag-y', `${dy}px`);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => scene.addEventListener(type, stopDrag));
    scene.addEventListener('keydown', (event) => {
        const stone = event.target.closest('.accident-debris');
        if (!stone || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const delta = event.shiftKey ? 40 : 12;
        const dx = (Number(stone.dataset.x) || 0) + (event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0);
        const dy = (Number(stone.dataset.y) || 0) + (event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0);
        stone.dataset.x = String(dx); stone.dataset.y = String(dy);
        stone.style.setProperty('--drag-x', `${dx}px`); stone.style.setProperty('--drag-y', `${dy}px`);
    });
    window.mizukoAccidentExperience = { enterScene, enterConstellation, enterEnding, step, getCursorMode };
    window.addEventListener('mizuko:scenechange', (event) => {
        if (event.detail.scene !== 'accident') {
            clearTransition(); stopDrag(); document.body.classList.remove('is-accident-scene');
        }
        if (event.detail.scene !== 'constellation') document.body.classList.remove('is-constellation-scene');
    });
    if (window.mizukoExperience.getScene() === 'accident') enterScene(params.get('accidentPage') || savedPage);
    if (window.mizukoExperience.getScene() === 'constellation') enterConstellation();
})();
