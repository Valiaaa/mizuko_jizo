        const rooms = document.querySelector('.rooms');
        const roomStage = document.querySelector('.room-stage');
        const roomHotspot = document.querySelector('#room-hotspot');
        const layerField = document.querySelector('.layer-field');
        const convergenceField =
            document.querySelector('.convergence-field');
        const interactionLayer = document.querySelector('.interaction-layer');
        const customCursor = document.querySelector('.custom-cursor');
        const fallingSection = document.querySelector('#falling-section');
        const nextScene = document.querySelector('#next-scene');
        const roomCount = 6;
        const finalPhase = roomCount + 1;
        const storageKey = 'mizuko-room-progress-v3';
        const storageVersion = 1;
        const alphaThreshold = 24;
        const initialSearchParams = new URLSearchParams(
            window.location.search
        );
        const testMode =
            initialSearchParams.get('test') === '1' ||
            initialSearchParams.has('phase') ||
            initialSearchParams.has('scene');
        const roomPolygon = [
            [958, 154],
            [1314, 322],
            [1311, 807],
            [957, 931],
            [578, 823],
            [578, 324]
        ];
        const layerMasks = new Map();
        let renderedLayers = [];
        let orderedRenderedLayers = [];
        let dragState = null;
        let convergenceDragState = null;
        let convergenceProgress = 0;
        let convergenceComplete = false;
        let convergenceTransitionTimer = 0;
        let currentScene = 'room';
        let lastFallingScrollY = 0;
        let topLayerZ = 1;
        let phase = 1;

        const layerObject = (
            file,
            x,
            y,
            width,
            rotate = 0,
            z = 1
        ) => {
            const radians = (rotate * Math.PI) / 180;

            return {
                file,
                x,
                y,
                width,
                rotate,
                z,
                cosine: Math.cos(radians),
                sine: Math.sin(radians)
            };
        };

        const phaseLayouts = {
            2: [
                layerObject('LO-cake.png', 27, 37, 16, -4),
                layerObject('LO_frame.png', 52, 49, 20, 25),
                layerObject('LO-beatle.png', 78, 30, 5, 50)
            ],
            3: [
                layerObject('LO-cake.png', 3, 55, 20, -3),
                layerObject('LO_frame.png', 72, 60, 21, 25),
                layerObject('LO-clock.png', 25, 13, 18, -5),
                layerObject('LO-suit.png', 60, 18, 18, -20),
                layerObject('LO-suanpan.png', 24, 72, 26, -2),
                layerObject('LO-beatle.png', 86, 27, 5, -4)
            ],
            4: [
                layerObject('LO-cake.png', 3, 55, 18, -3),
                layerObject('LO_frame.png', 72, 60, 21, 11),
                layerObject('LO-clock.png', 7, 3, 19, -5),
                layerObject('LO-suit.png', 72, 7, 18, 17),
                layerObject('LO-vase.png', 60, 46, 14, 8),
                layerObject('LO-suanpan.png', 13, 67, 26, -2),
                layerObject('LO-statue.png', 42, 4, 22, -4)
            ],
            5: [
                layerObject('LO-flower2.png', 2, 5, 19, -14),
                layerObject('LO-suit.png', 50, -5, 15, -12),
                layerObject('LO-computer.png', 74, 16, 21, 7, 2),
                layerObject('LO-clock.png', 18, 45, 16, -10),
                layerObject('LO-cup.png', 39, 41, 14, -5, 2),
                layerObject('LO-statue.png', 60, 25, 20, 5, 2),
                layerObject('LO_frame.png', 2, 69, 18, 14),
                layerObject('LO-cake.png', 36, 68, 17, -3),
                layerObject('LO-suanpan.png', 55, 75, 25, 3, 2),
                layerObject('LO-vase.png', 85, 60, 12, 10)
            ],
            6: [
                layerObject('LO-cake.png', 37, 47, 22, -7),
                layerObject('LO-lamp.png', 9, -7, 18, -12, 2),
                layerObject('LO-statue.png', 25, -12, 24, -5, 2),
                layerObject('LO-computer.png', 52, 9, 26, 4, 2),
                layerObject('LO-clock.png', 75, -10, 25, 10),
                layerObject('LO_frame.png', 74, 31, 21, -12),
                layerObject('LO-vase.png', 82, 65, 14, 16),
                layerObject('LO-suit.png', 56, 55, 23, 26, 26),
                layerObject('LO-suanpan.png', 34, 73, 30, 4, 2),
                layerObject('LO-flower3.png', 4, 51, 31, -8),
                layerObject('LO-cup.png', -4, 30, 24, -6, 2),
                layerObject('LO-beatle.png', 41, 63, 7, 28, 4),
                layerObject('LO_ant.png', 52, 35, 13, -24, 3),
                layerObject('LO-flower2.png', 22, 75, 21, -14)
            ]
        };

        const finalLayout = [
            layerObject('LO-computer.png', -2, 26, 30, 5, 6),
            layerObject('LO-clock.png', 7, 59, 30, -8, 3),
            layerObject('LO-suanpan.png', -10, 70, 38, -2),
            layerObject('LO-flower1.png', 2, -18, 35, -14, 2),
            layerObject('LO-flower2.png', 15, 1, 36, 9, 2),
            layerObject('LO-flower3.png', 54, -10, 34, 7, 2),
            layerObject('LO-keyboard.png', 43, -8, 35, -20, 2),
            layerObject('LO_ant.png', 38, 36, 16, 7, 5),
            layerObject('LO-tv.png', 40, 46, 32, 6, 4),
            layerObject('LO-statue.png', 74, 12, 24, 5, 3),
            layerObject('LO-lamp.png', 65, 41, 15, 8, 3),
            layerObject('LO-cup.png', 86, 45, 16, -2, 3),
            layerObject('LO-suit.png', 76, -7, 24, 15, 2),
            layerObject('LO-vase.png', 84, 56, 21, 7, 2),
            layerObject('LO_frame.png', 62, 65, 26, -9, 2),
            layerObject('LO-cake.png', 35, 54, 24, -2),
            layerObject('LO-cup2.png', 29, 64, 18, 40, 3),
            layerObject('LO-beatle.png', 58, 21, 7, 10, 5)
        ];

        phaseLayouts[finalPhase] = finalLayout;

        function renderLayerObjects(nextPhase) {
            const layout = phaseLayouts[nextPhase] ?? [];
            const fragment = document.createDocumentFragment();
            const stageWidth = roomStage.getBoundingClientRect().width;
            const baseFloat = Math.max(
                2.5,
                Math.min(5, stageWidth / 320)
            );
            renderedLayers = [];

            layout.forEach((object, index) => {
                loadLayerMask(object.file);
                const image = document.createElement('img');
                const layer = {
                    object,
                    element: image,
                    index,
                    z: object.z,
                    dx: 0,
                    dy: 0,
                    floatAmplitude:
                        baseFloat * (0.8 + (index % 5) * 0.1),
                    removed: false
                };
                const floatDuration = 5000 + (index % 6) * 430;
                image.className = 'layer-object';
                image.src =
                    `assets/Page2_房间_asset/LayeringObjects/${object.file}`;
                image.alt = '';
                image.decoding = 'async';
                image.draggable = false;
                image.dataset.layerFile = object.file;
                image.style.left = `${object.x}%`;
                image.style.top = `${object.y}%`;
                image.style.width = `${object.width}%`;
                image.style.zIndex = layer.z;
                image.style.setProperty('--drag-x', '0px');
                image.style.setProperty('--drag-y', '0px');
                image.style.setProperty(
                    '--float-distance',
                    `${layer.floatAmplitude}px`
                );
                image.style.setProperty(
                    '--float-duration',
                    `${floatDuration}ms`
                );
                image.style.setProperty(
                    '--float-delay',
                    `${-(index * 731) % floatDuration}ms`
                );
                image.style.setProperty(
                    '--float-direction',
                    index % 2 === 0 ? 'alternate' : 'alternate-reverse'
                );
                image.style.setProperty(
                    '--object-rotation',
                    `${object.rotate}deg`
                );
                fragment.append(image);
                renderedLayers.push(layer);
            });

            layerField.replaceChildren(fragment);
            topLayerZ = Math.max(
                1,
                ...renderedLayers.map((layer) => layer.z)
            );
            orderRenderedLayers();
        }

        function getLayerFloatY(layer) {
            const animation = layer.element.getAnimations()[0];
            const progress =
                animation?.effect.getComputedTiming().progress;

            if (progress === null || progress === undefined) {
                return 0;
            }

            return (
                -layer.floatAmplitude +
                layer.floatAmplitude * 2 * progress
            );
        }

        function orderRenderedLayers() {
            orderedRenderedLayers = [...renderedLayers].sort(
                (first, second) =>
                    second.z - first.z ||
                    second.index - first.index
            );
        }

        function pointIsInsidePolygon(x, y, polygon) {
            let isInside = false;

            for (
                let current = 0, previous = polygon.length - 1;
                current < polygon.length;
                previous = current++
            ) {
                const [currentX, currentY] = polygon[current];
                const [previousX, previousY] = polygon[previous];
                const crossesEdge =
                    currentY > y !== previousY > y &&
                    x <
                        ((previousX - currentX) * (y - currentY)) /
                            (previousY - currentY) +
                            currentX;

                if (crossesEdge) {
                    isInside = !isInside;
                }
            }

            return isInside;
        }

        function pointIsInsideRoom(clientX, clientY) {
            const stageRect = roomStage.getBoundingClientRect();

            if (
                clientX < stageRect.left ||
                clientX > stageRect.right ||
                clientY < stageRect.top ||
                clientY > stageRect.bottom
            ) {
                return false;
            }

            const roomX =
                ((clientX - stageRect.left) / stageRect.width) * 1920;
            const roomY =
                ((clientY - stageRect.top) / stageRect.height) * 1080;

            return pointIsInsidePolygon(roomX, roomY, roomPolygon);
        }

        function pointIsInsideLayerObject(
            clientX,
            clientY,
            layer,
            mask,
            stageRect
        ) {
            if (!mask.width || !mask.height) {
                return false;
            }

            const { object } = layer;
            const objectWidth = stageRect.width * (object.width / 100);
            const objectHeight =
                objectWidth * (mask.height / mask.width);
            const objectLeft =
                stageRect.left +
                stageRect.width * (object.x / 100) +
                layer.dx;
            const objectTop =
                stageRect.top +
                stageRect.height * (object.y / 100) +
                layer.dy +
                getLayerFloatY(layer);
            const centerX = objectLeft + objectWidth / 2;
            const centerY = objectTop + objectHeight / 2;
            const offsetX = clientX - centerX;
            const offsetY = clientY - centerY;

            // Undo the CSS rotation to recover coordinates in the PNG.
            const localX =
                object.cosine * offsetX +
                object.sine * offsetY +
                objectWidth / 2;
            const localY =
                -object.sine * offsetX +
                object.cosine * offsetY +
                objectHeight / 2;

            if (
                localX < 0 ||
                localX >= objectWidth ||
                localY < 0 ||
                localY >= objectHeight
            ) {
                return false;
            }

            /*
             * Until the alpha channel has been extracted, conservatively use
             * the rectangle. This avoids advancing through a visible image
             * during its first load; it becomes pixel-perfect once cached.
             */
            if (!mask.alpha) {
                return true;
            }

            const sourceX = Math.min(
                mask.width - 1,
                Math.floor((localX / objectWidth) * mask.width)
            );
            const sourceY = Math.min(
                mask.height - 1,
                Math.floor((localY / objectHeight) * mask.height)
            );

            return (
                mask.alpha[sourceY * mask.width + sourceX] >=
                alphaThreshold
            );
        }

        function getLayerAtPoint(clientX, clientY) {
            const stageRect = roomStage.getBoundingClientRect();

            for (const layer of orderedRenderedLayers) {
                if (layer.removed) {
                    continue;
                }

                const mask = layerMasks.get(layer.object.file);

                if (!mask || !mask.width || !mask.height) {
                    continue;
                }

                if (
                    pointIsInsideLayerObject(
                        clientX,
                        clientY,
                        layer,
                        mask,
                        stageRect
                    )
                ) {
                    return layer;
                }
            }

            return null;
        }

        function paintConvergenceProgress() {
            const shift = (window.innerWidth / 2) * convergenceProgress;
            convergenceField.style.setProperty(
                '--convergence-shift',
                `${shift}px`
            );

            const objectOpacity = Math.max(
                0,
                1 - convergenceProgress * 1.16
            );
            // Keep the copy fully present until the final 10%: it reaches
            // half opacity at 95%, then disappears at full convergence.
            const copyOpacity = convergenceProgress <= 0.9 ?
                1 :
                Math.max(0, (1 - convergenceProgress) / 0.1);
            const hintOpacity = Math.max(
                0,
                Math.min(1, (0.92 - convergenceProgress) / 0.25)
            );

            rooms.style.opacity = String(
                Math.max(0, 1 - convergenceProgress * 1.08)
            );
            convergenceField.querySelectorAll(
                '.convergence-copy'
            ).forEach((element) => {
                element.style.opacity = String(copyOpacity);
            });
            convergenceField.querySelectorAll(
                '.convergence-hint'
            ).forEach((element) => {
                element.style.opacity = String(hintOpacity);
            });

            for (const layer of renderedLayers) {
                const centerX =
                    layer.object.x + layer.object.width / 2;
                const horizontalDirection = centerX < 50 ? -1 : 1;
                const verticalDirection =
                    layer.object.y + layer.index % 3 * 8 < 50 ? -1 : 1;
                const distance = 34 + layer.index % 5 * 8;
                layer.element.style.opacity = String(objectOpacity);
                layer.element.style.setProperty(
                    '--convergence-scatter-x',
                    `${horizontalDirection * distance * convergenceProgress}px`
                );
                layer.element.style.setProperty(
                    '--convergence-scatter-y',
                    `${verticalDirection * distance * 0.65 * convergenceProgress}px`
                );
            }
        }

        function setConvergenceProgress(nextProgress) {
            convergenceProgress = Math.max(
                0,
                Math.min(1, nextProgress)
            );
            paintConvergenceProgress();
        }

        function resetConvergence() {
            window.clearTimeout(convergenceTransitionTimer);
            convergenceTransitionTimer = 0;
            convergenceDragState = null;
            convergenceComplete = false;
            convergenceField.classList.remove(
                'is-snapping',
                'is-converged'
            );
            setConvergenceProgress(0);
        }

        function applySavedConvergenceState(savedConvergence) {
            convergenceDragState = null;
            convergenceComplete = Boolean(savedConvergence?.complete);
            convergenceField.classList.remove('is-snapping');
            convergenceField.classList.toggle(
                'is-converged',
                convergenceComplete
            );
            setConvergenceProgress(
                convergenceComplete ?
                    1 :
                    Number.isFinite(savedConvergence?.progress) ?
                        savedConvergence.progress :
                        0
            );
        }

        function completeConvergence() {
            if (convergenceComplete) {
                return;
            }

            convergenceComplete = true;
            convergenceField.classList.add('is-snapping');
            setConvergenceProgress(1);

            window.setTimeout(() => {
                convergenceField.classList.remove('is-snapping');
                convergenceField.classList.add('is-converged');
            }, 430);

            convergenceTransitionTimer = window.setTimeout(() => {
                enterFallingScene();
            }, 780);

            saveProgress();
        }

        function setScene(scene) {
            currentScene = scene;
            saveProgress();
            window.dispatchEvent(new CustomEvent('mizuko:scenechange', {
                detail: { scene }
            }));
        }

        function enterFallingScene(options = {}) {
            if (!fallingSection) {
                return;
            }

            const {
                immediate = false,
                scrollY = lastFallingScrollY
            } = options;
            window.clearTimeout(convergenceTransitionTimer);
            convergenceTransitionTimer = 0;
            currentScene = 'falling';
            lastFallingScrollY = Math.max(0, scrollY);
            fallingSection.setAttribute('aria-hidden', 'false');
            nextScene?.setAttribute('aria-hidden', 'true');

            if (immediate) {
                document.body.classList.add('is-transition-immediate');
            }

            document.body.classList.remove(
                'is-entering-next-scene',
                'is-next-scene'
            );
            document.body.classList.add('is-falling');

            window.requestAnimationFrame(() => {
                window.scrollTo(0, lastFallingScrollY);

                window.setTimeout(() => {
                    document.body.classList.add('is-falling-settled');
                    document.body.classList.remove(
                        'is-transition-immediate'
                    );
                }, immediate ? 20 : 880);
            });

            saveProgress();
            window.dispatchEvent(new CustomEvent('mizuko:scenechange', {
                detail: { scene: 'falling' }
            }));
        }

        function enterRoomScene(nextPhase = finalPhase) {
            window.clearTimeout(convergenceTransitionTimer);
            convergenceTransitionTimer = 0;
            currentScene = 'room';
            document.body.classList.remove(
                'is-falling',
                'is-falling-settled',
                'is-entering-next-scene',
                'is-next-scene',
                'is-transition-immediate'
            );
            fallingSection?.setAttribute('aria-hidden', 'true');
            nextScene?.setAttribute('aria-hidden', 'true');
            window.scrollTo(0, 0);
            showPhase(nextPhase);
            saveProgress();
            updateCursorModeAt(-1, -1);
            window.dispatchEvent(new CustomEvent('mizuko:scenechange', {
                detail: { scene: 'room' }
            }));
        }

        function getConvergenceCircleAtPoint(clientX, clientY) {
            if (phase !== finalPhase || convergenceComplete) {
                return null;
            }

            const radius = window.innerHeight * 0.45;
            const centerY = window.innerHeight / 2;
            const shift = (window.innerWidth / 2) * convergenceProgress;
            const circles = [
                {
                    side: 'left',
                    centerX: shift
                },
                {
                    side: 'right',
                    centerX: window.innerWidth - shift
                }
            ];

            return circles
                .map((circle) => {
                    const offsetX = clientX - circle.centerX;
                    const offsetY = clientY - centerY;

                    return {
                        ...circle,
                        distanceSquared:
                            offsetX * offsetX + offsetY * offsetY
                    };
                })
                .filter(
                    (circle) =>
                        circle.distanceSquared <= radius * radius
                )
                .sort(
                    (first, second) =>
                        first.distanceSquared - second.distanceSquared
                )[0] ?? null;
        }

        function pointIsOccluded(clientX, clientY) {
            if (!renderedLayers.length) {
                return false;
            }

            /*
             * While a visible layer is still loading its dimensions, block
             * advancement conservatively instead of allowing a click through.
             */
            for (const layer of renderedLayers) {
                const mask = layerMasks.get(layer.object.file);

                if (!layer.removed && (!mask || !mask.width || !mask.height)) {
                    return true;
                }
            }

            return Boolean(getLayerAtPoint(clientX, clientY));
        }

        function canAdvanceAt(clientX, clientY) {
            return (
                phase < finalPhase &&
                pointIsInsideRoom(clientX, clientY) &&
                !pointIsOccluded(clientX, clientY)
            );
        }

        function setCursorMode(mode) {
            customCursor.classList.toggle('is-key', mode === 'key');
            customCursor.classList.toggle('is-hand', mode === 'hand');
            customCursor.classList.toggle('is-eye', mode === 'eye');
            customCursor.classList.toggle(
                'is-grabbing',
                mode === 'grabbing'
            );
        }

        function updateCursorModeAt(clientX, clientY) {
            if (
                document.body.classList.contains('is-hell-eye-cursor')
            ) {
                setCursorMode('eye');
                return;
            }

            if (currentScene !== 'room') {
                setCursorMode('default');
                return;
            }

            if (dragState || convergenceDragState) {
                setCursorMode('grabbing');
                return;
            }

            if (getLayerAtPoint(clientX, clientY)) {
                setCursorMode('hand');
                return;
            }

            if (getConvergenceCircleAtPoint(clientX, clientY)) {
                setCursorMode('hand');
                return;
            }

            setCursorMode(
                canAdvanceAt(clientX, clientY) ? 'key' : 'default'
            );
        }

        function applySavedLayerState(savedLayers) {
            if (!savedLayers || phase !== finalPhase) {
                return;
            }

            const stageRect = roomStage.getBoundingClientRect();

            for (const layer of renderedLayers) {
                const saved = savedLayers[layer.object.file];

                if (!saved) {
                    continue;
                }

                layer.dx =
                    Number.isFinite(saved.x) ?
                        saved.x * stageRect.width :
                        0;
                layer.dy =
                    Number.isFinite(saved.y) ?
                        saved.y * stageRect.height :
                        0;
                layer.z = Number.isFinite(saved.z) ?
                    saved.z :
                    layer.z;
                layer.removed = Boolean(saved.removed);
                layer.element.style.setProperty(
                    '--drag-x',
                    `${layer.dx}px`
                );
                layer.element.style.setProperty(
                    '--drag-y',
                    `${layer.dy}px`
                );
                layer.element.style.zIndex = layer.z;

                if (layer.removed) {
                    layer.element.remove();
                }
            }

            topLayerZ = Math.max(
                1,
                ...renderedLayers.map((layer) => layer.z)
            );
            orderRenderedLayers();
        }

        function saveProgress() {
            try {
                const progress = {
                    version: storageVersion,
                    phase,
                    scene: currentScene,
                    scrollY:
                        currentScene === 'falling' ?
                            window.scrollY : lastFallingScrollY
                };

                if (phase === finalPhase) {
                    const stageRect = roomStage.getBoundingClientRect();
                    progress.layers = Object.fromEntries(
                        renderedLayers.map((layer) => [
                            layer.object.file,
                            {
                                x: layer.dx / stageRect.width,
                                y: layer.dy / stageRect.height,
                                z: layer.z,
                                removed: layer.removed
                            }
                        ])
                    );
                    progress.convergence = {
                        progress: convergenceProgress,
                        complete: convergenceComplete
                    };
                }

                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(progress)
                );
            } catch {
                // Private browsing or a strict embed may disable storage.
            }
        }

        function showPhase(
            nextPhase,
            savedLayers = null,
            savedConvergence = null
        ) {
            phase = Math.max(1, Math.min(finalPhase, nextPhase));

            if (phase <= roomCount) {
                rooms.src =
                    `assets/Page2_房间_asset/房间png/room${phase}.png`;
                rooms.alt = `房间场景，第 ${phase} 阶段`;
                rooms.classList.remove('is-rotation-animation');
                roomStage.classList.remove('is-drag-phase');
                resetConvergence();
            } else {
                rooms.src =
                    'assets/Page2_房间_asset/rotate_anim.gif';
                rooms.alt = '旋转动画';
                rooms.classList.add('is-rotation-animation');
                roomStage.classList.add('is-drag-phase');
            }

            renderLayerObjects(phase);
            applySavedLayerState(savedLayers);

            if (phase === finalPhase) {
                applySavedConvergenceState(savedConvergence);
            } else {
                paintConvergenceProgress();
            }

            if (phase === finalPhase) {
                roomHotspot.classList.add('is-complete');
                setCursorMode('default');
                roomHotspot.removeAttribute('role');
                roomHotspot.removeAttribute('tabindex');
                roomHotspot.removeAttribute('aria-label');
            } else {
                roomHotspot.classList.remove('is-complete');
                roomHotspot.setAttribute('role', 'button');
                roomHotspot.setAttribute('tabindex', '0');
                roomHotspot.setAttribute(
                    'aria-label',
                    '进入下一个房间阶段'
                );
            }
        }

        // Keep the phase change in one named function so every input path
        // shares the same persistence behavior.
        function update() {
            if (phase >= finalPhase) {
                return;
            }

            showPhase(phase + 1);
            saveProgress();
        }

        function restoreProgress() {
            const url = new URL(window.location.href);
            const shouldReset = url.searchParams.get('reset') === '1';
            const phaseOverride = Number(url.searchParams.get('phase'));
            const sceneOverride = url.searchParams.get('scene');
            let saved = null;

            try {
                if (shouldReset) {
                    window.localStorage.removeItem(storageKey);
                } else {
                    saved = JSON.parse(
                        window.localStorage.getItem(storageKey)
                    );
                }
            } catch {
                saved = null;
            }

            if (shouldReset) {
                url.searchParams.delete('reset');
                window.history.replaceState({}, '', url);
            }

            const hasPhaseOverride =
                Number.isInteger(phaseOverride) &&
                phaseOverride >= 1 &&
                phaseOverride <= finalPhase;
            const hasSavedProgress =
                saved?.version === storageVersion &&
                Number.isInteger(saved.phase) &&
                saved.phase >= 1 &&
                saved.phase <= finalPhase;
            const sceneNeedsFinalRoom =
                sceneOverride === 'falling' ||
                sceneOverride === 'next' ||
                saved?.scene === 'falling' ||
                saved?.scene === 'next';
            const restoredPhase = sceneNeedsFinalRoom ?
                finalPhase :
                hasPhaseOverride ?
                    phaseOverride :
                    hasSavedProgress ? saved.phase : 1;
            const restoredLayers =
                !hasPhaseOverride &&
                restoredPhase === finalPhase &&
                hasSavedProgress ?
                    saved.layers :
                    null;

            if (hasPhaseOverride) {
                url.searchParams.delete('phase');
                url.searchParams.set('test', '1');
                window.history.replaceState({}, '', url);
            }

            showPhase(
                restoredPhase,
                restoredLayers,
                !hasPhaseOverride &&
                restoredPhase === finalPhase &&
                hasSavedProgress ?
                    saved.convergence :
                    null
            );

            const shouldEnterFalling =
                sceneOverride === 'falling' ||
                sceneOverride === 'next' ||
                (!hasPhaseOverride && (
                    saved?.scene === 'falling' ||
                    saved?.scene === 'next'
                )) ||
                (
                    !hasPhaseOverride &&
                    restoredPhase === finalPhase &&
                    Boolean(saved?.convergence?.complete)
                );

            if (sceneOverride) {
                url.searchParams.delete('scene');
                url.searchParams.set('test', '1');
                window.history.replaceState({}, '', url);
            }

            if (shouldEnterFalling) {
                lastFallingScrollY = Number.isFinite(saved?.scrollY) ?
                    saved.scrollY : 0;
                enterFallingScene({
                    immediate: true,
                    scrollY: lastFallingScrollY
                });

                if (
                    sceneOverride === 'next' ||
                    (!hasPhaseOverride && saved?.scene === 'next')
                ) {
                    currentScene = 'next';
                    document.body.classList.remove(
                        'is-falling',
                        'is-falling-settled'
                    );
                    document.body.classList.add('is-next-scene');
                    nextScene?.setAttribute('aria-hidden', 'false');
                    window.requestAnimationFrame(() => {
                        nextScene?.scrollIntoView({ block: 'start' });
                    });
                }
            }
        }

        function startDrag(event) {
            if (
                currentScene !== 'room' ||
                dragState ||
                convergenceDragState
            ) {
                return;
            }

            const layer = getLayerAtPoint(event.clientX, event.clientY);

            if (layer) {
                event.preventDefault();
                layer.element.classList.add('is-dragging');
                topLayerZ += 1;
                layer.z = topLayerZ;
                layer.element.style.zIndex = layer.z;
                orderRenderedLayers();
                interactionLayer.setPointerCapture(event.pointerId);
                dragState = {
                    pointerId: event.pointerId,
                    layer,
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: layer.dx,
                    originY: layer.dy
                };
                setCursorMode('grabbing');
                return;
            }

            const circle = getConvergenceCircleAtPoint(
                event.clientX,
                event.clientY
            );

            if (!circle) {
                return;
            }

            event.preventDefault();
            interactionLayer.setPointerCapture(event.pointerId);
            convergenceDragState = {
                pointerId: event.pointerId,
                side: circle.side,
                startX: event.clientX,
                originProgress: convergenceProgress
            };
            setCursorMode('grabbing');
        }

        function moveDrag(event) {
            if (
                convergenceDragState &&
                event.pointerId === convergenceDragState.pointerId
            ) {
                event.preventDefault();

                if (!convergenceComplete) {
                    const direction =
                        convergenceDragState.side === 'left' ? 1 : -1;
                    const horizontalDelta =
                        (event.clientX - convergenceDragState.startX) *
                        direction;
                    const travel = Math.max(1, window.innerWidth / 2);
                    const nextProgress =
                        convergenceDragState.originProgress +
                        horizontalDelta / travel;

                    setConvergenceProgress(nextProgress);

                    if (convergenceProgress >= 0.84) {
                        completeConvergence();
                    }
                }

                return;
            }

            if (
                !dragState ||
                event.pointerId !== dragState.pointerId
            ) {
                return;
            }

            event.preventDefault();
            const { layer } = dragState;
            layer.dx =
                dragState.originX + event.clientX - dragState.startX;
            layer.dy =
                dragState.originY + event.clientY - dragState.startY;
            layer.element.style.setProperty(
                '--drag-x',
                `${layer.dx}px`
            );
            layer.element.style.setProperty(
                '--drag-y',
                `${layer.dy}px`
            );
        }

        function finishDrag(event) {
            if (
                convergenceDragState &&
                event.pointerId === convergenceDragState.pointerId
            ) {
                convergenceDragState = null;

                if (interactionLayer.hasPointerCapture(event.pointerId)) {
                    interactionLayer.releasePointerCapture(event.pointerId);
                }

                saveProgress();
                updateCursorModeAt(event.clientX, event.clientY);
                return;
            }

            if (
                !dragState ||
                event.pointerId !== dragState.pointerId
            ) {
                return;
            }

            const { layer } = dragState;
            dragState = null;
            layer.element.classList.remove('is-dragging');

            if (interactionLayer.hasPointerCapture(event.pointerId)) {
                interactionLayer.releasePointerCapture(event.pointerId);
            }

            const bounds = layer.element.getBoundingClientRect();
            const isOutsideScreen =
                bounds.right < 0 ||
                bounds.left > window.innerWidth ||
                bounds.bottom < 0 ||
                bounds.top > window.innerHeight;

            if (isOutsideScreen) {
                layer.removed = true;
                layer.element.remove();
            }

            saveProgress();
            updateCursorModeAt(event.clientX, event.clientY);
        }

        interactionLayer.addEventListener('click', (event) => {
            if (canAdvanceAt(event.clientX, event.clientY)) {
                update();
            }
        });
        interactionLayer.addEventListener('pointerdown', startDrag);
        interactionLayer.addEventListener('pointermove', moveDrag);
        interactionLayer.addEventListener('pointerup', finishDrag);
        interactionLayer.addEventListener('pointercancel', finishDrag);

        roomHotspot.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                update();
            }
        });

        window.addEventListener('keydown', (event) => {
            if (
                !testMode ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey
            ) {
                return;
            }

            const direction =
                event.key === 'ArrowLeft' ? -1 :
                event.key === 'ArrowRight' ? 1 :
                0;

            if (!direction) {
                return;
            }

            if (
                (currentScene === 'room' && direction < 0 && phase === 1) ||
                (currentScene === 'next' && direction > 0)
            ) {
                return;
            }

            event.preventDefault();

            if (currentScene === 'room') {
                if (direction > 0 && phase === finalPhase) {
                    enterFallingScene({ immediate: true });
                    return;
                }

                showPhase(phase + direction);
                saveProgress();
                updateCursorModeAt(-1, -1);
                return;
            }

            if (currentScene === 'falling') {
                if (direction < 0) {
                    enterRoomScene(finalPhase);
                } else {
                    window.mizukoFallingExperience?.enterNextScene({
                        immediate: true
                    });
                }
                return;
            }

            if (currentScene === 'next' && direction < 0) {
                enterFallingScene({
                    immediate: true,
                    scrollY: lastFallingScrollY
                });
            }
        });

        // Avoid a flash when moving between phases.
        for (let index = 2; index <= roomCount; index += 1) {
            const image = new Image();
            image.src = `assets/Page2_房间_asset/房间png/room${index}.png`;
        }
        const rotationAnimation = new Image();
        rotationAnimation.src =
            'assets/Page2_房间_asset/rotate_anim.gif';

        const layerFiles = new Set(
            Object.values(phaseLayouts)
                .flat()
                .map((object) => object.file)
        );

        const scheduleIdleWork = (callback) => {
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(callback, { timeout: 1500 });
            } else {
                window.setTimeout(callback, 0);
            }
        };

        const loadLayerMask = (file) => {
            if (layerMasks.has(file)) {
                return;
            }

            const mask = {
                width: 0,
                height: 0,
                alpha: null
            };
            const image = new Image();
            layerMasks.set(file, mask);
            image.decoding = 'async';

            image.addEventListener('load', () => {
                mask.width = image.naturalWidth;
                mask.height = image.naturalHeight;

                scheduleIdleWork(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = mask.width;
                    canvas.height = mask.height;
                    const context = canvas.getContext('2d', {
                        willReadFrequently: true
                    });

                    if (!context) {
                        return;
                    }

                    context.drawImage(image, 0, 0);

                    const pixels = context.getImageData(
                        0,
                        0,
                        mask.width,
                        mask.height
                    ).data;
                    const alpha = new Uint8Array(
                        mask.width * mask.height
                    );

                    for (
                        let source = 3, destination = 0;
                        source < pixels.length;
                        source += 4, destination += 1
                    ) {
                        alpha[destination] = pixels[source];
                    }

                    mask.alpha = alpha;
                });
            });

            image.src =
                `assets/Page2_房间_asset/LayeringObjects/${file}`;
        };

        scheduleIdleWork(() => {
            for (const file of layerFiles) {
                loadLayerMask(file);
            }
        });

        /*
         * The embedded preview can stutter when the browser repeatedly
         * rebuilds native bitmap cursors. Keep one composited cursor layer and
         * update its transform at most once per animation frame instead.
         */
        if (window.matchMedia('(pointer: fine)').matches) {
            let cursorX = 0;
            let cursorY = 0;
            let cursorFrame = 0;

            document.documentElement.classList.add('has-custom-cursor');

            const paintCursor = () => {
                customCursor.style.transform =
                    `translate3d(${cursorX - 12}px, ${cursorY - 12}px, 0)`;
                updateCursorModeAt(cursorX, cursorY);
                cursorFrame = 0;
            };

            window.addEventListener('pointermove', (event) => {
                cursorX = event.clientX;
                cursorY = event.clientY;
                customCursor.classList.add('is-visible');

                if (!cursorFrame) {
                    cursorFrame = window.requestAnimationFrame(paintCursor);
                }
            }, { passive: true });

            document.documentElement.addEventListener('mouseleave', () => {
                customCursor.classList.remove('is-visible');
            });

            window.addEventListener('blur', () => {
                customCursor.classList.remove('is-visible');
            });
        }

        window.addEventListener('beforeunload', saveProgress);
        let scrollSaveFrame = 0;
        window.addEventListener('scroll', () => {
            if (currentScene !== 'falling' || scrollSaveFrame) {
                return;
            }

            scrollSaveFrame = window.requestAnimationFrame(() => {
                lastFallingScrollY = window.scrollY;
                saveProgress();
                scrollSaveFrame = 0;
            });
        }, { passive: true });
        window.addEventListener('resize', paintConvergenceProgress, {
            passive: true
        });

        window.mizukoExperience = {
            enterFallingScene,
            getScene: () => currentScene,
            saveProgress,
            setScene
        };
        restoreProgress();
