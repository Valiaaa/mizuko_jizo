(() => {
    const section = document.querySelector('#falling-section');
    const objectField = document.querySelector('.falling-object-field');
    const fallingCursor = document.querySelector('.falling-cursor');
    const abyssHole = document.querySelector('.abyss-hole');
    const nextScene = document.querySelector('#next-scene');

    if (!section || !objectField || !fallingCursor || !abyssHole) {
        return;
    }

    const assetRoot = 'assets/Page3_Falling_asset/Falling_Objects/';

    /*
     * Add `animatedFile: "your-file.gif"` to any item when its final GIF is
     * available. Until then, Hover uses the same drawing with a restrained
     * motion treatment so the interaction can already be tested.
     */
    const fallingObjects = [
        { file: 'F-computer.png', x: 4, y: 10, width: 24, rotate: -8 },
        { file: 'F-flower1.png', x: 73, y: 40, width: 22, rotate: 12 },
        { file: 'F-beetle.png', x: 12, y: 76, width: 10, rotate: -18 },
        { file: 'F-frame.png', x: 67, y: 102, width: 19, rotate: 14 },
        { file: 'F-vase.png', x: 2, y: 134, width: 18, rotate: 7 },
        { file: 'F-ant.png', x: 79, y: 160, width: 11, rotate: -12 },
        { file: 'F-clock.png', x: 20, y: 191, width: 20, rotate: 9 },
        { file: 'F-flower2.png', x: 68, y: 218, width: 21, rotate: -8 },
        { file: 'F-cup1.png', x: 7, y: 246, width: 17, rotate: -14 },
        { file: 'F-keyboard.png', x: 73, y: 270, width: 22, rotate: 17 },
        { file: 'F-buddha.png', x: 25, y: 296, width: 16, rotate: -5 },
        { file: 'F-suanpan.png', x: 55, y: 325, width: 28, rotate: 5 },
        { file: 'F-cake.png', x: 4, y: 352, width: 20, rotate: -10 },
        { file: 'F-lamp.png', x: 77, y: 377, width: 16, rotate: 8 },
        { file: 'F-tv.png', x: 25, y: 402, width: 21, rotate: 12 },
        { file: 'F-suit.png', x: 66, y: 430, width: 18, rotate: -9 },
        { file: 'F-flower3.png', x: 5, y: 456, width: 23, rotate: 7 },
        { file: 'F-cup2.png', x: 78, y: 499, width: 13, rotate: -14 }
    ];

    const fragment = document.createDocumentFragment();

    fallingObjects.forEach((object, index) => {
        const item = document.createElement('figure');
        const image = document.createElement('img');
        item.className = 'falling-object';
        item.style.setProperty('--object-x', `${object.x}%`);
        item.style.setProperty('--object-y', `${object.y}vh`);
        item.style.setProperty('--object-width', `${object.width}vw`);
        item.style.setProperty('--object-rotation', `${object.rotate}deg`);
        item.style.setProperty('--drift-delay', `${-(index % 7) * 0.73}s`);
        item.style.setProperty(
            '--drift-duration',
            `${6.2 + (index % 5) * 0.55}s`
        );
        image.className = 'falling-object__image';
        image.src = `${assetRoot}${object.file}`;
        image.dataset.staticSrc = image.src;
        image.alt = '';
        image.decoding = 'async';
        image.draggable = false;

        if (object.animatedFile) {
            image.dataset.animatedSrc =
                `${assetRoot}${object.animatedFile}`;
        }

        item.append(image);
        fragment.append(item);
    });

    objectField.append(fragment);

    objectField.addEventListener('pointerover', (event) => {
        const item = event.target.closest('.falling-object');

        if (!item) {
            return;
        }

        const image = item.querySelector('.falling-object__image');
        item.classList.add('is-previewing');

        if (image?.dataset.animatedSrc) {
            image.src = image.dataset.animatedSrc;
        }
    });

    objectField.addEventListener('pointerout', (event) => {
        const item = event.target.closest('.falling-object');

        if (!item || item.contains(event.relatedTarget)) {
            return;
        }

        const image = item.querySelector('.falling-object__image');
        item.classList.remove('is-previewing');

        if (image?.dataset.staticSrc) {
            image.src = image.dataset.staticSrc;
        }
    });

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let paintedX = pointerX;
    let paintedY = pointerY;
    let cursorFrame = 0;
    let abyssTimer = 0;
    let nextSceneTimer = 0;
    let scrollHintTimer = 0;
    let isInsideAbyss = false;

    const hideScrollHint = () => {
        window.clearTimeout(scrollHintTimer);
        scrollHintTimer = 0;
        section.classList.remove('is-scroll-hint-visible');
    };

    const showScrollHint = () => {
        hideScrollHint();

        if (window.scrollY > 8) {
            return;
        }

        section.classList.add('is-scroll-hint-visible');
        scrollHintTimer = window.setTimeout(hideScrollHint, 5000);
    };

    const paintFallingCursor = () => {
        paintedX += (pointerX - paintedX) * 0.16;
        paintedY += (pointerY - paintedY) * 0.16;
        const tilt = Math.max(
            -7,
            Math.min(7, (pointerX - paintedX) * 0.08)
        );
        fallingCursor.style.transform =
            `translate3d(${paintedX}px, ${paintedY}px, 0) ` +
            `translate(-50%, -50%) rotate(${tilt}deg)`;

        if (
            Math.abs(pointerX - paintedX) > 0.2 ||
            Math.abs(pointerY - paintedY) > 0.2
        ) {
            cursorFrame = window.requestAnimationFrame(
                paintFallingCursor
            );
        } else {
            cursorFrame = 0;
        }
    };

    const enterNextScene = (options = {}) => {
        const immediate = options?.immediate === true;
        window.clearTimeout(abyssTimer);
        window.clearTimeout(nextSceneTimer);
        abyssTimer = 0;
        isInsideAbyss = false;
        abyssHole.classList.remove('is-armed');
        fallingCursor.classList.remove('is-pulled');
        document.body.classList.add('is-entering-next-scene');
        nextScene.setAttribute('aria-hidden', 'false');

        const finishTransition = () => {
            nextScene.scrollIntoView({
                behavior: immediate || window.matchMedia(
                    '(prefers-reduced-motion: reduce)'
                ).matches ? 'auto' : 'smooth',
                block: 'start'
            });
            document.body.classList.remove(
                'is-falling',
                'is-falling-settled',
                'is-entering-next-scene'
            );
            document.body.classList.add('is-next-scene');
            window.mizukoExperience?.setScene('next');
        };

        if (immediate) {
            finishTransition();
        } else {
            nextSceneTimer = window.setTimeout(finishTransition, 420);
        }
    };

    const pointerIsInsideAbyss = (clientX, clientY) => {
        const rect = abyssHole.getBoundingClientRect();
        const radiusX = rect.width / 2;
        const radiusY = rect.height / 2;
        const normalizedX =
            (clientX - (rect.left + radiusX)) / radiusX;
        const normalizedY =
            (clientY - (rect.top + radiusY)) / radiusY;

        return normalizedX ** 2 + normalizedY ** 2 <= 1;
    };

    const updateAbyssState = (clientX, clientY) => {
        const isFalling =
            document.body.classList.contains('is-falling');
        const isInside =
            isFalling && pointerIsInsideAbyss(clientX, clientY);

        if (isInside === isInsideAbyss) {
            return;
        }

        isInsideAbyss = isInside;
        abyssHole.classList.toggle('is-armed', isInside);
        fallingCursor.classList.toggle('is-pulled', isInside);
        window.clearTimeout(abyssTimer);
        abyssTimer = 0;

        if (isInside) {
            abyssTimer = window.setTimeout(enterNextScene, 1250);
        }
    };

    window.addEventListener('pointermove', (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;

        if (document.body.classList.contains('is-falling')) {
            updateAbyssState(pointerX, pointerY);

            if (!cursorFrame) {
                cursorFrame = window.requestAnimationFrame(
                    paintFallingCursor
                );
            }
        }
    }, { passive: true });

    window.addEventListener('scroll', () => {
        if (
            section.classList.contains('is-scroll-hint-visible') &&
            window.scrollY > 8
        ) {
            hideScrollHint();
        }
    }, { passive: true });

    abyssHole.addEventListener('click', enterNextScene);
    abyssHole.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            enterNextScene();
        }
    });

    window.addEventListener('mizuko:scenechange', (event) => {
        if (event.detail?.scene !== 'falling') {
            window.clearTimeout(abyssTimer);
            window.clearTimeout(nextSceneTimer);
            isInsideAbyss = false;
            abyssHole.classList.remove('is-armed');
            fallingCursor.classList.remove('is-pulled');
            hideScrollHint();
            return;
        }

        window.clearTimeout(abyssTimer);
        window.clearTimeout(nextSceneTimer);

        paintedX = pointerX;
        paintedY = pointerY;
        paintFallingCursor();
        showScrollHint();
    });

    if (document.body.classList.contains('is-falling')) {
        showScrollHint();
    }

    window.mizukoFallingExperience = {
        enterNextScene
    };
})();
