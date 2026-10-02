(() => {
    const scene = document.querySelector('#accident-scene');
    if (!scene) return;
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
    const enterConstellation = () => {
        clearTransition();
        stopDrag();
        document.body.classList.remove('is-accident-scene', 'is-next-scene', 'is-door-scene',
            'is-door-room', 'is-falling', 'is-falling-settled', 'is-entering-next-scene');
        document.body.classList.add('is-constellation-scene');
        window.mizukoExperience.setScene('constellation');
        return true;
    };
    const step = (direction) => {
        clearTransition();
        if (page === 1 && direction < 0) return window.mizukoNavigation.goTo('door-4');
        if (page === 4 && direction > 0) return enterConstellation();
        showPage(page + direction);
        return true;
    };
    scene.addEventListener('click', (event) => {
        const keyword = event.target.closest('.accident-keyword');
        if (!keyword || transitioning || window.mizukoExperience.getScene() !== 'accident') return;
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
    window.mizukoAccidentExperience = { enterScene, enterConstellation, step, getCursorMode };
    window.addEventListener('mizuko:scenechange', (event) => {
        if (event.detail.scene !== 'accident') {
            clearTransition(); stopDrag(); document.body.classList.remove('is-accident-scene');
        }
        if (event.detail.scene !== 'constellation') document.body.classList.remove('is-constellation-scene');
    });
    if (window.mizukoExperience.getScene() === 'accident') enterScene(params.get('accidentPage') || savedPage);
    if (window.mizukoExperience.getScene() === 'constellation') enterConstellation();
})();
