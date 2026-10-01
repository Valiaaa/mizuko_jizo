(() => {
    const scene = document.querySelector('#next-scene');

    if (!scene) {
        return;
    }

    const objects = [...scene.querySelectorAll('.hell-object')];
    const mizuko = scene.querySelector('.hell-mizuko');
    const story = scene.querySelector('.hell-story');
    const storyAdvance = scene.querySelector('.hell-story__advance');
    const doorScene = document.querySelector('#door-section');
    const customCursor = document.querySelector('.custom-cursor');
    let storyPhase = 0;

    const startMotion = (item) => {
        const motion = item.querySelector('.hell-object__motion');
        const motionSource = item.dataset.motion;

        if (
            !motion ||
            !motionSource ||
            item.classList.contains('is-active')
        ) {
            return;
        }

        motion.src = '';
        motion.src = `${motionSource}?play=${Date.now()}`;
        item.classList.add('is-active');
    };

    const stopMotion = (item) => {
        const motion = item.querySelector('.hell-object__motion');

        item.classList.remove('is-active');

        if (motion) {
            motion.removeAttribute('src');
        }
    };

    objects.forEach((item) => {
        item.addEventListener('pointerenter', () => startMotion(item));
        item.addEventListener('pointerleave', () => stopMotion(item));
        item.addEventListener('focus', () => startMotion(item));
        item.addEventListener('blur', () => stopMotion(item));
    });

    const setEyeCursor = (isActive) => {
        document.body.classList.toggle(
            'is-hell-eye-cursor',
            isActive
        );
        customCursor?.classList.toggle('is-eye', isActive);
    };

    const openNarrative = () => {
        storyPhase = 1;
        objects.forEach(stopMotion);
        document.body.classList.add('is-hell-story');
        document.body.classList.remove('is-hell-accusing');
        story?.setAttribute('aria-hidden', 'false');
        storyAdvance?.setAttribute('aria-label', '继续倾听');
        setEyeCursor(true);
    };

    const showAccusation = () => {
        storyPhase = 2;
        document.body.classList.add('is-hell-accusing');
        storyAdvance?.setAttribute('aria-label', '走向三扇门');
        setEyeCursor(true);
    };

    const enterDoorScene = () => {
        storyPhase = 3;
        document.body.classList.add('is-door-scene');
        document.body.classList.remove(
            'is-hell-story',
            'is-hell-accusing'
        );
        story?.setAttribute('aria-hidden', 'true');
        scene.setAttribute('aria-hidden', 'true');
        doorScene?.setAttribute('aria-hidden', 'false');
        setEyeCursor(true);
        window.mizukoExperience?.setScene('doors');
    };

    const resetStory = () => {
        storyPhase = 0;
        document.body.classList.remove(
            'is-hell-story',
            'is-hell-accusing',
            'is-door-scene'
        );
        story?.setAttribute('aria-hidden', 'true');
        doorScene?.setAttribute('aria-hidden', 'true');
        setEyeCursor(false);
    };

    mizuko?.addEventListener('pointerenter', () => {
        setEyeCursor(true);
    });

    mizuko?.addEventListener('pointerleave', () => {
        if (storyPhase === 0) {
            setEyeCursor(false);
        }
    });

    mizuko?.addEventListener('focus', () => setEyeCursor(true));
    mizuko?.addEventListener('blur', () => {
        if (storyPhase === 0) {
            setEyeCursor(false);
        }
    });

    mizuko?.addEventListener('click', openNarrative);

    storyAdvance?.addEventListener('click', () => {
        if (storyPhase === 1) {
            showAccusation();
            return;
        }

        if (storyPhase === 2) {
            enterDoorScene();
        }
    });

    window.addEventListener('mizuko:scenechange', (event) => {
        if (event.detail?.scene !== 'next') {
            objects.forEach(stopMotion);
        }

        if (
            event.detail?.scene === 'room' ||
            event.detail?.scene === 'falling'
        ) {
            resetStory();
        }
    });
})();
