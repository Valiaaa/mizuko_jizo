(() => {
    const room = document.querySelector('#door-room-3');
    if (!room) return;
    const stage = room.querySelector('.fracture-stage');
    const plate = stage.querySelector('.fracture-plate');
    const art = stage.querySelector('.fracture-art');
    const echo = stage.querySelector('.fracture-echo');
    const text = stage.querySelector('.fracture-copy img');
    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const back = stage.querySelector('.fracture-return');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const root = 'assets/Page5.3_分裂_asset/';
    const descriptions = [
        '从一个地点转移到另一个地点。从一张皮换到另一张皮。从一束灯光游移进另一束灯光。从一种笑容切换到另一种笑容。只是一种掩饰？不，你错了。这才是幸福。有时候，选择让人感到痛苦，没有选择才是最幸福的，不是吗？不必因为自己选择的未来而整夜失眠，我可以说，那全都是命运的错。',
        '我已经决定了，这不能叫作放弃，而是叫作取舍。可以舍弃的东西很多，譬如我的尊严、我不切实际的童年幻梦——当然，还有你。虽然，我从来不是一个很富有的人，但就连一无所有的我仍有可以献祭出来的东西。那可怜的孩子，如同水流一般逝于指尖，此般轻巧的死亡，已是我全部所有。',
        '你为何要来找我？来戳穿我的谎言，指责我的懦弱，或者更糟，告诉我，其实你爱我。——那么那一晚呢？那一晚对你来说是什么意义？我对你来说，又是什么意义？然而，这不是我欲听的话。赛璐珈糖果般晃眼的美梦，一睁开眼却是——黑。色。的。明。天。',
        '是恨你的。想要忘记你。想要超越你。想要我能够活下去的，这样的恨意。'
    ];
    const images = Array.from({ length: 4 }, (_, i) => {
        const background = new Image(), copy = new Image();
        background.src = `${root}scene${i + 1}.jpg`;
        copy.src = `${root}text${i + 1}.png`;
        return { background, copy, ready: Promise.all([background.decode(), copy.decode()]) };
    });
    // Keep loading failures handled even when a later scene has not been opened yet.
    images.forEach(item => item.ready.catch(() => {}));
    let index = 0, active = false, busy = false, version = 0, frame = 0;
    let particles = [], started = 0, mode = 'in', width = 0, height = 0, wheelTotal = 0, touchY = null;
    function resize() {
        width = plate.clientWidth; height = plate.clientHeight;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = width * ratio; canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    function sample(image) {
        const buffer = document.createElement('canvas');
        buffer.width = 960; buffer.height = 540;
        const c = buffer.getContext('2d', { willReadFrequently: true });
        c.drawImage(image, 0, 0, 960, 540);
        const figure = document.createElement('canvas'); figure.width = 960; figure.height = 540;
        const f = figure.getContext('2d', { willReadFrequently: true });
        const outlines = [
            [[.63,.30],[.66,.30],[.67,.33],[.70,.34],[.73,.34],[.77,.38],[.80,.46],[.81,.64],[.80,.80],[.78,.84],[.80,.90],[.91,.92],[.91,.97],[.80,.99],[.56,.99],[.56,.93],[.61,.90],[.62,.84],[.63,.75],[.63,.59],[.63,.43],[.62,.33]],
            [[.64,.67],[.73,.67],[.78,.70],[.80,.75],[.81,.82],[.84,.87],[.85,.93],[.82,.97],[.66,.98],[.55,.95],[.51,.90],[.53,.87],[.58,.85],[.60,.80],[.61,.73]],
            [[.62,.52],[.66,.51],[.68,.55],[.72,.53],[.74,.56],[.73,.61],[.76,.64],[.74,.68],[.77,.72],[.79,.79],[.79,.85],[.86,.90],[.86,.96],[.82,1],[.52,1],[.51,.95],[.55,.88],[.58,.81],[.59,.74],[.61,.68],[.59,.64],[.60,.60]],
            [[.67,.739],[.73,.74],[.77,.77],[.78,.82],[.77,.88],[.73,.92],[.62,.95],[.55,.95],[.54,.92],[.57,.89],[.61,.87],[.61,.81],[.63,.77]]
        ];
        const outline = outlines[index];
        // The broad visual plate stays aligned; the particle sampler uses only the silhouette.
        art.style.clipPath = echo.style.clipPath = 'polygon(49% 27%,94% 27%,94% 100%,49% 100%)';
        f.beginPath(); outline.forEach(([x,y],i)=>i?f.lineTo(x*960,y*540):f.moveTo(x*960,y*540)); f.closePath(); f.clip();
        f.drawImage(images[index].background, 0, 0, 960, 540);
        const ink = f.getImageData(0,0,960,540);
        const reference = document.createElement('canvas'); reference.width=960; reference.height=540;
        const r = reference.getContext('2d', {willReadFrequently:true}); r.drawImage(images[3].background,0,0,960,540);
        const baseline=r.getImageData(0,0,960,540).data;
        for(let n=0;n<ink.data.length;n+=4) {
            // Remove unchanged architecture (including the window visible through the silhouette bounds).
            if(index<3 && Math.max(Math.abs(ink.data[n]-baseline[n]),Math.abs(ink.data[n+1]-baseline[n+1]),Math.abs(ink.data[n+2]-baseline[n+2]))<38) ink.data[n+3]=0;
        }
        f.putImageData(ink,0,0); c.drawImage(figure,0,0);
        const pixels = c.getImageData(0, 0, 960, 540).data;
        const sx = width / 960;
        const ox = 0, oy = 0;
        particles = [];
        for (let y = 0; y < 540; y += 2) for (let x = 0; x < 960; x += 2) {
            const n = (y * 960 + x) * 4;
            if (pixels[n + 3] < 50 || pixels[n] > 180) continue;
            particles.push({ x: ox + x * sx, y: oy + y * sx,
                dx: (Math.random() - .35) * 150, dy: (Math.random() - .5) * 110,
                delay: Math.random() * .25, size: Math.max(.6, sx * 1.15), alpha: pixels[n + 3] / 255 });
        }
    }
    function draw(now) {
        if (!active || document.hidden) { frame = 0; return; }
        const elapsed = Math.min(1, (now - started) / 1500);
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
            const t = Math.max(0, Math.min(1, (elapsed - p.delay) / .75));
            const scatter = mode === 'out' ? t * t : (1 - t) * (1 - t);
            ctx.globalAlpha = p.alpha * (mode === 'out' ? 1 - t : Math.sin(t * Math.PI));
            ctx.fillStyle = '#27221f';
            const drift = Math.sin(now * .0018 + p.y) * scatter * 5;
            ctx.fillRect(p.x + p.dx * scatter + drift, p.y + p.dy * scatter, p.size + scatter, p.size + scatter);
        }
        ctx.globalAlpha = 1;
        if (elapsed < 1) frame = requestAnimationFrame(draw);
        else { ctx.clearRect(0, 0, width, height); frame = 0; }
    }
    function dust(direction) {
        cancelAnimationFrame(frame);
        sample(images[index].copy);
        if (reduced.matches) return;
        mode = direction; started = performance.now();
        frame = requestAnimationFrame(draw);
    }
    const pause = ms => new Promise(resolve => setTimeout(resolve, reduced.matches ? 0 : ms));
    async function show(value, initial = false) {
        if (!active || busy || value < 0 || value > 3) return;
        busy = true;
        const token = ++version;
        try { await Promise.all([images[value].ready, images[3].ready]); } catch { busy = false; return; }
        if (token !== version || !active) return;
        if (!initial) {
            stage.classList.remove('is-restless', 'is-present');
            stage.classList.add('is-dispersing'); dust('out');
            await pause(1500);
            if (token !== version || !active) return;
        }
        stage.classList.remove('is-present', 'is-restless');
        stage.classList.add('is-dispersing');
        index = value; stage.dataset.page = String(index + 1);
        art.style.backgroundImage = `url("${images[index].background.src}")`;
        echo.style.backgroundImage = art.style.backgroundImage;
        text.src = images[index].copy.src; text.alt = descriptions[index];
        back.hidden = true;
        resize(); dust('in');
        // Let the new transparent frame paint before starting the shared reveal.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (token !== version || !active) return;
        stage.classList.remove('is-dispersing'); stage.classList.add('is-present');
        await pause(1800);
        if (token === version) { busy = false; stage.classList.add('is-restless'); back.hidden = index !== 3; }
    }
    function step(direction) {
        if (busy) return;
        if (index === 3 && direction > 0) return;
        show(index + direction);
    }
    room.addEventListener('wheel', event => {
        if (!active) return;
        event.preventDefault();
        if (busy) { wheelTotal = 0; return; }
        wheelTotal += event.deltaY;
        if (Math.abs(wheelTotal) > 90) { step(Math.sign(wheelTotal)); wheelTotal = 0; }
    }, { passive: false });
    room.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    room.addEventListener('touchend', e => {
        if (touchY === null || e.target.closest('button')) return;
        const delta = touchY - e.changedTouches[0].clientY; touchY = null;
        if (Math.abs(delta) > 45) step(Math.sign(delta));
    });
    room.addEventListener('keydown', e => {
        const direction = ['ArrowDown','PageDown'].includes(e.key) ? 1 : ['ArrowUp','PageUp'].includes(e.key) ? -1 : 0;
        if (direction && active) { e.preventDefault(); step(direction); }
    });
    window.addEventListener('resize', resize);
    function sync(scene) {
        active = scene === 'door-3'; version++; busy = false; wheelTotal = 0;
        cancelAnimationFrame(frame); ctx.clearRect(0, 0, width, height);
        stage.classList.remove('is-dispersing', 'is-restless', 'is-present');
        if (active) show(0, true);
    }
    window.addEventListener('mizuko:scenechange', e => sync(e.detail.scene));
    sync(window.mizukoExperience.getScene());
})();
