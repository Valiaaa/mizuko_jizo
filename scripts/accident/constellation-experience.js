(() => {
    const scene = document.querySelector('#constellation-scene');
    if (!scene) return;
    const body = scene.querySelector('.night-body-small');
    const objects = [...scene.querySelectorAll('.night-object')];
    const objectLayer = scene.querySelector('.night-objects');
    const ceramic = scene.querySelector('.night-ceramic');
    const copy = scene.querySelector('.night-copy');
    const continueButton = scene.querySelector('.night-continue');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const cursor = document.querySelector('.custom-cursor');
    let active = false, phase = 'clearing', drag = null, timer = 0;
    const masks = new WeakMap();
    let bodyMask = null;
    const makeMask = (image, crop) => {
        const [x, y, width, height] = crop || [0, 0, image.naturalWidth, image.naturalHeight];
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = Math.max(1, Math.round(96 * height / width));
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
        return { width: canvas.width, height: canvas.height,
            pixels: context.getImageData(0, 0, canvas.width, canvas.height).data };
    };
    const opaqueAt = (mask, x, y) => {
        if (x < 0 || y < 0 || x >= 1 || y >= 1) return false;
        return mask.pixels[(Math.floor(y * mask.height) * mask.width + Math.floor(x * mask.width)) * 4 + 3] > 32;
    };
    const setCursor = mode => {
        for (const name of ['hand','grabbing','eye','key','pointer','pointing']) cursor?.classList.toggle(`is-${name}`, mode === name);
    };
    const getCursorMode = (x,y) => {
        if (drag) return 'grabbing';
        if (phase === 'complete') return 'eye';
        const target = document.elementFromPoint(x,y);
        if (target?.closest('.night-object') && phase === 'clearing') return 'hand';
        if (target?.closest('.night-body-small:not(:disabled)')) return 'eye';
        return 'default';
    };
    const checkClear = () => {
        if (!bodyMask || objects.some(item => !masks.has(item))) return;
        const b = body.getBoundingClientRect();
        const visibleBody = [];
        for (let y = 0; y < bodyMask.height; y++) {
            for (let x = 0; x < bodyMask.width; x++) {
                const u = (x + .5) / bodyMask.width, v = (y + .5) / bodyMask.height;
                if (opaqueAt(bodyMask, u, v)) visibleBody.push([b.left + u * b.width, b.top + v * b.height]);
            }
        }
        // Transparent image margins must not keep an uncovered body locked.
        const tolerance = Math.max(3, visibleBody.length * .005);
        const clear = objects.every(item => {
            const r = item.getBoundingClientRect(), mask = masks.get(item);
            let covered = 0;
            for (const [x, y] of visibleBody) {
                if (opaqueAt(mask, (x - r.left) / r.width, (y - r.top) / r.height) && ++covered > tolerance) return false;
            }
            return true;
        });
        body.disabled = !clear;
        scene.classList.toggle('is-cleared', clear);
    };
    const stopDrag = () => {
        if (!drag) return;
        const { item, id } = drag; drag = null;
        item.classList.remove('is-dragging');
        if (item.hasPointerCapture(id)) item.releasePointerCapture(id);
        if (active && phase === 'clearing') checkClear();
        setCursor('default');
    };
    const syncTestState = state => {
        if (!window.mizukoNavigation.testMode) return;
        const url = new URL(location.href);
        url.searchParams.set('nightState', state);
        history.replaceState({}, '', url);
    };
    const openReading = () => {
        if (!active || phase !== 'complete') return;
        phase = 'reading'; scene.dataset.phase = phase;
        continueButton.hidden = true;
        scene.classList.add('is-reading'); copy.setAttribute('aria-hidden', 'false');
        copy.focus({preventScroll:true});
        syncTestState('reading'); setCursor('default');
        scene.scrollTo({top: scene.clientHeight - 2, behavior: reduced.matches ? 'instant' : 'smooth'});

    };
    continueButton.addEventListener('click', openReading);
    const revealCeramic = () => {
        phase = 'revealing'; scene.dataset.phase = phase;
        ceramic.onload = () => {
            if (!active || phase !== 'revealing') return;
            ceramic.onload = null;
            scene.classList.add('is-ceramic-visible');
            timer = setTimeout(() => {
                if (!active || phase !== 'revealing') return;
                phase = 'complete'; scene.dataset.phase = phase;
                scene.classList.add('is-complete'); continueButton.hidden = false;
                syncTestState('complete');
            }, reduced.matches ? 0 : 1250);
        };
        ceramic.src = 'assets/Page4_地狱_asset/mizuko.png';
        if (ceramic.complete && ceramic.naturalWidth) ceramic.onload?.();
    };
    const reset = () => {
        clearTimeout(timer); stopDrag();
        phase = 'clearing';
        scene.scrollTop = 0;
        scene.classList.remove('is-cleared','is-expanding','is-night','is-complete','is-reading','is-ceramic-visible');
        scene.dataset.phase = phase;
        objectLayer.inert = false;
        body.disabled = true;
        copy.setAttribute('aria-hidden','true'); continueButton.hidden = true;
        ceramic.onload = null; ceramic.removeAttribute('src');
        objects.forEach(item => {
            item.dataset.x = '0'; item.dataset.y = '0';
            item.style.setProperty('--drag-x','0px'); item.style.setProperty('--drag-y','0px');
        });
        setCursor('default');
    };
    body.addEventListener('click', () => {
        if (!active || body.disabled || phase !== 'clearing') return;
        phase = 'expanding'; scene.dataset.phase = phase;
        objectLayer.inert = true;
        scene.classList.add('is-expanding'); setCursor('eye');
        timer = setTimeout(() => {
            if (!active) return;
            phase = 'stars'; scene.dataset.phase = phase; scene.classList.add('is-night');
            timer = setTimeout(() => { if (active && phase === 'stars') revealCeramic(); }, reduced.matches ? 0 : 1450);
            setCursor('default');
        }, reduced.matches ? 0 : 1400);
    });
    scene.addEventListener('pointerdown', e => {
        const item = e.target.closest('.night-object');
        if (!active || phase !== 'clearing' || !item || e.button !== 0) return;
        e.preventDefault();
        drag = { item, id:e.pointerId, sx:e.clientX, sy:e.clientY,
            x:Number(item.dataset.x)||0, y:Number(item.dataset.y)||0 };
        item.setPointerCapture(e.pointerId); item.classList.add('is-dragging'); setCursor('grabbing');
    });
    scene.addEventListener('pointermove', e => {
        if (!drag || drag.id !== e.pointerId) return;
        const {item,sx,sy,x,y}=drag;
        const dx=x+e.clientX-sx, dy=y+e.clientY-sy;
        item.dataset.x=String(dx); item.dataset.y=String(dy);
        item.style.setProperty('--drag-x',`${dx}px`); item.style.setProperty('--drag-y',`${dy}px`);
        checkClear();
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>scene.addEventListener(type,stopDrag));
    scene.addEventListener('keydown', e => {
        const item=e.target.closest('.night-object');
        if (!item || phase !== 'clearing' || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const amount=e.shiftKey?40:12;
        const x=(Number(item.dataset.x)||0)+(e.key==='ArrowRight'?amount:e.key==='ArrowLeft'?-amount:0);
        const y=(Number(item.dataset.y)||0)+(e.key==='ArrowDown'?amount:e.key==='ArrowUp'?-amount:0);
        item.dataset.x=String(x);item.dataset.y=String(y);
        item.style.setProperty('--drag-x',`${x}px`);item.style.setProperty('--drag-y',`${y}px`);checkClear();
    });
    scene.addEventListener('wheel', e => { if(active && phase !== 'reading') e.preventDefault(); }, {passive:false});
    scene.addEventListener('touchmove', e => { if(active && phase !== 'reading' && !drag) e.preventDefault(); }, {passive:false});
    scene.addEventListener('keydown', e => {
        if(active && phase !== 'reading' && ['ArrowDown','PageDown','End',' '].includes(e.key) && e.target !== continueButton) e.preventDefault();
    });
    window.addEventListener('resize',()=>{if(active&&phase==='clearing')checkClear();});
    window.addEventListener('mizuko:scenechange',e=>{
        active=e.detail.scene==='constellation';reset();
    });
    const testStates = ['clearing', 'cleared', 'complete', 'reading'];
    const enterTestState = value => {
        if (!active || !window.mizukoNavigation.testMode) return false;
        const state = testStates.includes(value) ? value : 'clearing';
        reset();
        if (state === 'cleared') {
            objects.forEach((item, i) => {
                const r = item.getBoundingClientRect();
                const x = scene.clientWidth * (i % 2 ? .88 : .12) - (r.left + r.width / 2);
                const y = scene.clientHeight * (.08 + Math.floor(i / 2) * .105) - (r.top + r.height / 2);
                item.dataset.x = String(x); item.dataset.y = String(y);
                item.style.setProperty('--drag-x', `${x}px`); item.style.setProperty('--drag-y', `${y}px`);
            });
            body.disabled = false; scene.classList.add('is-cleared');
        } else if (state === 'complete' || state === 'reading') {
            scene.classList.add('is-expanding', 'is-night');
            objectLayer.inert = true; body.disabled = true; revealCeramic();
            if (state === 'reading') {
                clearTimeout(timer); ceramic.onload = null;
                scene.classList.add('is-ceramic-visible', 'is-complete');
                phase = 'complete'; openReading();
            }
        }
        syncTestState(state); setCursor('default');
        return true;
    };
    const stepTest = direction => {
        if (!window.mizukoNavigation.testMode) return false;
        const state = phase === 'reading' ? 'reading' : phase === 'complete' ? 'complete' : scene.classList.contains('is-cleared') ? 'cleared' : 'clearing';
        const index = testStates.indexOf(state) + direction;
        if (index < 0) return window.mizukoNavigation.goTo('accident', { page: 4 });
        if (index >= testStates.length) return false;
        return enterTestState(testStates[index]);
    };
    window.mizukoConstellationExperience={getCursorMode, enterTestState, stepTest};
    active=window.mizukoExperience.getScene()==='constellation';reset();
    if (active && window.mizukoNavigation.testMode) enterTestState(new URLSearchParams(location.search).get('nightState'));
    Promise.all([body.querySelector('img').decode(), scene.querySelector('.night-body-large img').decode(), ...objects.map(item => item.querySelector('img').decode())]).then(() => {
        bodyMask = makeMask(body.querySelector('img'), [1271, 1080, 1248, 335]);
        objects.forEach(item => masks.set(item, makeMask(item.querySelector('img'))));
        if (active && phase === 'clearing') checkClear();
    });
})();
