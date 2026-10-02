(() => {
    const scene = document.querySelector('#constellation-scene');
    if (!scene) return;
    const body = scene.querySelector('.night-body-small');
    const objects = [...scene.querySelectorAll('.night-object')];
    const objectLayer = scene.querySelector('.night-objects');
    const stars = [...scene.querySelectorAll('.night-star')];
    const targets = scene.querySelector('.night-star-targets');
    const lines = scene.querySelector('.night-lines');
    const ceramic = scene.querySelector('.night-ceramic');
    const copy = scene.querySelector('.night-copy');
    const cursor = document.querySelector('.custom-cursor');
    let active = false, phase = 'clearing', connected = 0, drag = null, timer = 0;
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
        const target = document.elementFromPoint(x,y);
        if (target?.closest('.night-object') && phase === 'clearing') return 'hand';
        if (phase === 'stars' && target?.closest('.night-star.is-next')) return 'pointing';
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
    const updateStars = () => {
        stars.forEach((star, i) => {
            star.classList.toggle('is-next', i === connected);
            star.classList.toggle('is-connected', i < connected);
            star.setAttribute('aria-disabled', String(i !== connected));
            star.tabIndex = i === connected ? 0 : -1;
        });
    };
    const syncTestState = state => {
        if (!window.mizukoNavigation.testMode) return;
        const url = new URL(location.href);
        url.searchParams.set('nightState', state);
        history.replaceState({}, '', url);
    };
    const revealCeramic = () => {
        phase = 'complete'; scene.dataset.phase = phase;
        targets.inert = true;
        ceramic.onload = () => {
            if (!active || phase !== 'complete') return;
            scene.classList.add('is-complete'); copy.setAttribute('aria-hidden', 'false');
        };
        ceramic.src = 'assets/Page7_车祸_asset/ceramic-turntable.gif';
        if (ceramic.complete && ceramic.naturalWidth) ceramic.onload();
    };
    const reset = () => {
        clearTimeout(timer); stopDrag();
        phase = 'clearing'; connected = 0;
        scene.scrollTop = 0;
        scene.classList.remove('is-cleared','is-expanding','is-night','is-complete','is-reading');
        scene.dataset.phase = phase;
        scene.dataset.connected = '0';
        objectLayer.inert = false;
        body.disabled = true; targets.inert = true;
        copy.setAttribute('aria-hidden','true');
        lines.removeAttribute('src'); ceramic.onload = null; ceramic.removeAttribute('src');
        objects.forEach(item => {
            item.dataset.x = '0'; item.dataset.y = '0';
            item.style.setProperty('--drag-x','0px'); item.style.setProperty('--drag-y','0px');
        });
        updateStars(); setCursor('default');
    };
    body.addEventListener('click', () => {
        if (!active || body.disabled || phase !== 'clearing') return;
        phase = 'expanding'; scene.dataset.phase = phase;
        objectLayer.inert = true;
        scene.classList.add('is-expanding'); targets.inert = true; setCursor('eye');
        timer = setTimeout(() => {
            if (!active) return;
            phase = 'stars'; scene.dataset.phase = phase;
            scene.classList.add('is-night'); targets.inert = false; syncTestState('stars');
            setCursor('default');
        }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 550);
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
    stars.forEach((star,index)=>star.addEventListener('click',()=>{
        if (!active || phase!=='stars' || index!==connected) return;
        connected++;
        setCursor('default');
        lines.src=`assets/Page7_车祸_asset/constellation(progressive)/constellation${connected}.png`;
        scene.dataset.connected=String(connected); updateStars();
        if (connected===stars.length) {
            syncTestState('complete'); revealCeramic();
        }
    }));
    targets.addEventListener('pointerover', e => {
        if (phase === 'stars' && e.target.closest('.night-star.is-next')) setCursor('pointing');
    });
    targets.addEventListener('pointerout', e => {
        if (e.target.closest('.night-star')) setCursor('default');
    });
    scene.addEventListener('scroll',()=>{
        if (phase==='complete' && scene.scrollTop>scene.clientHeight*.25) scene.classList.add('is-reading');
    },{passive:true});
    window.addEventListener('resize',()=>{if(active&&phase==='clearing')checkClear();});
    window.addEventListener('mizuko:scenechange',e=>{
        active=e.detail.scene==='constellation';reset();
    });
    const testStates = ['clearing', 'cleared', 'stars', 'complete'];
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
        } else if (state === 'stars' || state === 'complete') {
            // A test jump should show a settled frame, not replay the body animation.
            const previous = scene.style.display;
            scene.style.display = 'none';
            scene.classList.add('is-expanding', 'is-night');
            void scene.offsetHeight;
            scene.style.display = previous;
            objectLayer.inert = true; body.disabled = true;
            phase = 'stars'; scene.dataset.phase = phase; targets.inert = false;
            if (state === 'complete') {
                connected = stars.length; scene.dataset.connected = String(connected);
                lines.src = `assets/Page7_车祸_asset/constellation(progressive)/constellation${connected}.png`;
                updateStars(); revealCeramic();
            }
        }
        syncTestState(state); setCursor('default');
        return true;
    };
    const stepTest = direction => {
        if (!window.mizukoNavigation.testMode) return false;
        const state = phase === 'complete' ? 'complete' : phase === 'stars' ? 'stars' : scene.classList.contains('is-cleared') ? 'cleared' : 'clearing';
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
