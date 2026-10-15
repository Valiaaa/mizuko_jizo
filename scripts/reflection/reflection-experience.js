(() => {
    const room = document.querySelector('#door-room-4');
    if (!room) return;
    const depth = room.querySelector('.reflection-depth');
    const rings = [...room.querySelectorAll('.reflection-depth__rings')];
    const ending = room.querySelector('.reflection-depth__text--last');
    const cursor = document.querySelector('.custom-cursor');
    const tear = room.querySelector('.reflection-depth__tear img');
    const texts = [...room.querySelectorAll('.reflection-depth__text')];
    let active = false;
    let scrollFrame = 0;
    const setEndingEye = (enabled) => {
        document.body.classList.toggle('is-reflection-eye', enabled);
        if (enabled) {
            cursor?.classList.remove('is-pointer', 'is-hand', 'is-grabbing');
            cursor?.classList.add('is-eye');
        } else if (!document.body.classList.contains('is-hell-eye-cursor')) {
            cursor?.classList.remove('is-eye');
        }
    };

    const observer = new IntersectionObserver((entries) => {
        if (!active) return;
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
    }, { root: room, threshold: 0.12 });

    const updateDepth = () => {
        scrollFrame = 0;
        if (!active) return;
        const range = room.scrollHeight - room.clientHeight;
        const progress = range > 0 ? room.scrollTop / range : 0;
        const visibility = Math.min(1, Math.max(0, progress / 0.5));
        depth.style.setProperty('--tear-opacity', String(visibility * 0.45));

    };

    const setActive = (isActive) => {
        active = isActive;
        setEndingEye(false);
        document.body.classList.toggle('is-reflection-falling', active);
        window.cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
        observer.disconnect();
        depth.style.setProperty('--tear-opacity', '0');
        tear.removeAttribute('src');
        if (active) {
            room.scrollTop = 0;
            tear.src = 'assets/Page6_Falling2_asset/rotate_anim.gif';
            rings.forEach((image) => image.src = 'assets/Page3_Falling_asset/Falling_BgLoop.gif');
            texts.forEach((text) => {
                text.classList.remove('is-visible');
                observer.observe(text);
            });
            updateDepth();
        } else {
            rings.forEach((image) => image.removeAttribute('src'));
        }
    };

    room.addEventListener('scroll', () => {
        if (active && !scrollFrame) scrollFrame = window.requestAnimationFrame(updateDepth);
    }, { passive: true });
    ending.addEventListener('pointerenter', () => setEndingEye(true));
    ending.addEventListener('pointerleave', () => setEndingEye(false));
    ending.addEventListener('focus', () => setEndingEye(true));
    ending.addEventListener('blur', () => setEndingEye(false));
    ending.addEventListener('click', () => window.mizukoNavigation.goTo('accident'));
    window.addEventListener('resize', () => {
        if (active) updateDepth();
    });
    window.addEventListener('mizuko:scenechange', (event) => {
        setActive(event.detail.scene === 'door-4');
    });
    setActive(window.mizukoExperience?.getScene() === 'door-4');
})();
