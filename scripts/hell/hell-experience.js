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
    const doorHall = doorScene?.querySelector('.door-hall');
    const doorCards = [
        ...(doorScene?.querySelectorAll('.door-card') ?? [])
    ];
    const doorReflection = doorScene?.querySelector('.door-reflection');
    const doorReflectionAnimations = [
        ...(doorReflection?.querySelectorAll(
            '.door-reflection__animation'
        ) ?? [])
    ];
    const doorReflectionAnimation = doorReflectionAnimations[0];
    const doorRooms = [
        ...(doorScene?.querySelectorAll('.door-room') ?? [])
    ];
    const doorReturnButtons = [
        ...(doorScene?.querySelectorAll('[data-return-doors]') ?? [])
    ];
    const customCursor = document.querySelector('.custom-cursor');
    const doorStorageKey = window.mizukoNavigation.testMode ?
        'mizuko-door-test-progress-v1' : 'mizuko-door-progress-v1';
    const doorStorageVersion = 1;
    const searchParams = new URLSearchParams(window.location.search);
    const initialScene = window.mizukoInitialSceneOverride;
    const visitedDoors = new Set();
    let storyPhase = 0;
    let activeDoor = null;
    let reflectionFrame = 0;
    let reflectionLastTime = null;
    let reflectionFrameBudget = 0;
    const accusation = scene.querySelector('.hell-story__accusation');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let emberTimer = null;

    const stopEmbers = () => {
        window.clearTimeout(emberTimer);
        emberTimer = null;
        accusation?.style.removeProperty('--ember-blur');
        accusation?.style.removeProperty('--ember-glow');
        accusation?.style.removeProperty('--ember-light');
    };

    const flickerEmbers = () => {
        window.clearTimeout(emberTimer);
        emberTimer = null;
        if (!accusation || reducedMotion.matches || document.hidden ||
            !document.body.classList.contains('is-hell-accusing')) {
            stopEmbers();
            return;
        }
        accusation.style.setProperty('--ember-blur', `${0.25 + Math.random() * 0.4}px`);
        accusation.style.setProperty('--ember-glow', `${4 + Math.random() * 4}px`);
        accusation.style.setProperty('--ember-light', String(0.28 + Math.random() * 0.18));
        emberTimer = window.setTimeout(flickerEmbers, 180 + Math.random() * 380);
    };

    reducedMotion.addEventListener('change', flickerEmbers);
    document.addEventListener('visibilitychange', flickerEmbers);

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

    const hasVisitedEveryDoor = () =>
        [1, 2, 3].every((door) => visitedDoors.has(door));

    const animateDoorReflection = (timestamp) => {
        if (!doorReflectionAnimation || !doorReflection) {
            return;
        }

        if (reflectionLastTime === null) {
            reflectionLastTime = timestamp;
        }

        const elapsed = Math.min(timestamp - reflectionLastTime, 250);
        const isAccelerated = doorReflection.matches(
            ':hover, :focus-visible'
        );
        const frameDuration = isAccelerated ? 70 : 90;
        let didAdvance = false;

        reflectionLastTime = timestamp;
        reflectionFrameBudget += elapsed;

        while (reflectionFrameBudget >= frameDuration) {
            reflectionFrame = (reflectionFrame + 1) % 16;
            reflectionFrameBudget -= frameDuration;
            didAdvance = true;
        }

        if (didAdvance) {
            const framePosition = (reflectionFrame / 15) * 100;
            doorReflectionAnimations.forEach((animationLayer) => {
                animationLayer.style.backgroundPosition =
                    `${framePosition}% 0`;
                animationLayer.dataset.frame = String(reflectionFrame);
            });
        }

        window.requestAnimationFrame(animateDoorReflection);
    };

    const saveDoorProgress = () => {
        try {
            window.localStorage.setItem(
                doorStorageKey,
                JSON.stringify({
                    version: doorStorageVersion,
                    visited: [...visitedDoors].sort()
                })
            );
        } catch {
            // The interaction still works when storage is unavailable.
        }
    };

    const restoreDoorProgress = () => {
        if (searchParams.get('reset') === '1') {
            try {
                window.localStorage.removeItem(doorStorageKey);
            } catch {
                // Ignore storage restrictions in embedded previews.
            }
        } else {
            try {
                const saved = JSON.parse(
                    window.localStorage.getItem(doorStorageKey)
                );

                if (
                    saved?.version === doorStorageVersion &&
                    Array.isArray(saved.visited)
                ) {
                    saved.visited.forEach((door) => {
                        const doorNumber = Number(door);

                        if ([1, 2, 3].includes(doorNumber)) {
                            visitedDoors.add(doorNumber);
                        }
                    });
                }
            } catch {
                visitedDoors.clear();
            }
        }

        const visitedOverride = searchParams.get('visited');

        if (visitedOverride !== null) {
            visitedDoors.clear();

            if (visitedOverride === 'all') {
                [1, 2, 3].forEach((door) => visitedDoors.add(door));
            } else {
                visitedOverride.split(',').forEach((door) => {
                    const doorNumber = Number(door.trim());

                    if ([1, 2, 3].includes(doorNumber)) {
                        visitedDoors.add(doorNumber);
                    }
                });
            }
            saveDoorProgress();
            const url = new URL(window.location.href);
            url.searchParams.delete('visited');
            window.history.replaceState({}, '', url);
        }
    };

    const renderDoorProgress = () => {
        doorCards.forEach((card) => {
            const doorNumber = Number(card.dataset.door);
            const isVisited = visitedDoors.has(doorNumber);
            card.classList.toggle('is-visited', isVisited);
            card.setAttribute(
                'aria-label',
                `${isVisited ? '再次进入' : '进入'}第${doorNumber}扇门`
            );
        });

        const hasFourthDoor = hasVisitedEveryDoor();
        document.body.classList.toggle('has-fourth-door', hasFourthDoor);
        doorReflection?.setAttribute(
            'aria-hidden',
            hasFourthDoor ? 'false' : 'true'
        );
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

    const showDoorHall = (options = {}) => {
        stopEmbers();
        objects.forEach(stopMotion);
        storyPhase = 3;
        document.body.classList.remove('is-hell-story', 'is-hell-accusing');
        story?.setAttribute('aria-hidden', 'true');
        scene.setAttribute('aria-hidden', 'true');
        const saveScene = options.saveScene !== false;
        activeDoor = null;
        document.body.classList.add('is-door-scene');
        document.body.classList.remove('is-door-room');
        doorScene?.setAttribute('aria-hidden', 'false');
        doorHall?.setAttribute('aria-hidden', 'false');
        if (doorHall) doorHall.inert = false;
        doorRooms.forEach((room) => {
            room.inert = true;
            room.classList.remove('is-active');
            room.setAttribute('aria-hidden', 'true');
        });
        renderDoorProgress();
        setEyeCursor(false);

        if (saveScene) {
            window.mizukoExperience?.setScene('doors');
        }
    };

    const openDoorRoom = (doorNumber, options = {}) => {
        if (![1, 2, 3, 4].includes(doorNumber)) {
            return;
        }

        if (doorNumber === 4 && !hasVisitedEveryDoor()) {
            return;
        }

        if (doorNumber <= 3) {
            visitedDoors.add(doorNumber);
            saveDoorProgress();
        }

        activeDoor = doorNumber;
        renderDoorProgress();
        document.body.classList.add('is-door-scene', 'is-door-room');
        doorScene?.setAttribute('aria-hidden', 'false');
        doorHall?.setAttribute('aria-hidden', 'true');
        if (doorHall) doorHall.inert = true;
        doorRooms.forEach((room) => {
            const isActive = Number(room.dataset.room) === doorNumber;
            room.inert = !isActive;
            room.tabIndex = -1;
            room.classList.toggle('is-active', isActive);
            room.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            if (isActive && options.saveScene !== false) room.focus({ preventScroll: true });
        });
        setEyeCursor(false);

        if (options.saveScene !== false) {
            window.mizukoExperience?.setScene(`door-${doorNumber}`);
        }
    };

    const openNarrative = () => {
        storyPhase = 1;
        objects.forEach(stopMotion);
        document.body.classList.add('is-hell-story');
        document.body.classList.remove('is-hell-accusing');
        story?.setAttribute('aria-hidden', 'false');
        storyAdvance?.setAttribute('aria-label', '继续倾听');
        setEyeCursor(true);
        window.mizukoExperience?.setScene('hell-story');
    };

    const showAccusation = () => {
        storyPhase = 2;
        document.body.classList.add('is-hell-story', 'is-hell-accusing');
        story?.setAttribute('aria-hidden', 'false');
        flickerEmbers();
        storyAdvance?.setAttribute('aria-label', '走向三扇门');
        setEyeCursor(true);
        window.mizukoExperience?.setScene('hell-accusation');
    };

    const enterDoorScene = () => {
        stopEmbers();
        storyPhase = 3;
        document.body.classList.remove(
            'is-hell-story',
            'is-hell-accusing'
        );
        story?.setAttribute('aria-hidden', 'true');
        scene.setAttribute('aria-hidden', 'true');
        showDoorHall();
    };

    const resetStory = () => {
        stopEmbers();
        storyPhase = 0;
        document.body.classList.remove(
            'is-hell-story',
            'is-hell-accusing',
            'is-door-scene',
            'is-door-room'
        );
        story?.setAttribute('aria-hidden', 'true');
        doorScene?.setAttribute('aria-hidden', 'true');
        doorRooms.forEach((room) => {
            room.inert = true;
            room.classList.remove('is-active');
            room.setAttribute('aria-hidden', 'true');
        });
        setEyeCursor(false);
    };

    const showScene = (target) => {
        const doorMatch = /^door-([1-4])$/.exec(target);
        if (target === 'door-4' && !hasVisitedEveryDoor()) return false;
        if (!['next', 'hell-story', 'hell-accusation', 'doors'].includes(target) && !doorMatch) return false;
        resetStory();
        window.mizukoFallingExperience.enterNextScene({ immediate: true });
        if (target === 'hell-story') openNarrative();
        else if (target === 'hell-accusation') showAccusation();
        else if (target === 'doors') showDoorHall();
        else if (doorMatch) openDoorRoom(Number(doorMatch[1]));
        return true;
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

    doorCards.forEach((card) => {
        card.addEventListener('click', () => {
            openDoorRoom(Number(card.dataset.door));
        });
    });

    doorReflection?.addEventListener('click', () => {
        openDoorRoom(4);
    });

    doorReturnButtons.forEach((button) => {
        button.addEventListener('pointerenter', () => setEyeCursor(true));
        button.addEventListener('pointerleave', () => setEyeCursor(false));
        button.addEventListener('focus', () => setEyeCursor(true));
        button.addEventListener('blur', () => setEyeCursor(false));
        button.addEventListener('click', (event) => {
            if (button.matches('.searching-sculpture--mizuko') &&
                event.pointerType === 'touch' &&
                !button.classList.contains('is-revealed')) {
                button.classList.add('is-revealed');
                return;
            }
            const returningDoor = activeDoor;
            showDoorHall();
            doorCards.find((card) => Number(card.dataset.door) === returningDoor)?.focus({ preventScroll: true });
        });
    });

    document.querySelectorAll('.searching-sculpture').forEach((sculpture) => {
        sculpture.addEventListener('click', (event) => {
            if (event.pointerType !== 'touch' || event.target.closest('[data-return-doors]')) return;
            sculpture.classList.toggle('is-revealed');
        });
    });

    window.addEventListener('mizuko:scenechange', (event) => {
        if (!['next', 'hell-story', 'hell-accusation'].includes(event.detail?.scene)) {
            objects.forEach(stopMotion);
        }

        if (
            event.detail?.scene === 'room' ||
            event.detail?.scene === 'falling' ||
            event.detail?.scene === 'next'
        ) {
            resetStory();
        }
    });

    if (doorReflectionAnimation) {
        doorReflectionAnimations.forEach((animationLayer) => {
            animationLayer.dataset.frame = '0';
        });
        window.requestAnimationFrame(animateDoorReflection);
    }

    restoreDoorProgress();
    renderDoorProgress();
    window.mizukoHellExperience = { showScene, hasVisitedEveryDoor };
    if (initialScene === 'door-4') {
        [1, 2, 3].forEach((door) => visitedDoors.add(door));
    }
    showScene(initialScene);
})();
