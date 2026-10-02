(() => {
    const params = new URLSearchParams(window.location.search);
    const scenes = new Set([
        'room', 'falling', 'next', 'hell-story', 'hell-accusation',
        'doors', 'door-1', 'door-2', 'door-3', 'door-4', 'accident', 'constellation'
    ]);
    const resolveScene = (value) => scenes.has(value) ? value : null;
    const testMode = params.get('test') === '1' ||
        params.has('phase') || params.has('scene');

    const syncLocation = (scene, phase) => {
        if (!testMode) return;
        const url = new URL(window.location.href);
        url.searchParams.set('test', '1');
        url.searchParams.set('scene', scene);
        if (scene === 'room') url.searchParams.set('phase', String(phase));
        else url.searchParams.delete('phase');
        if (scene !== 'constellation') url.searchParams.delete('nightState');
        if (scene !== 'accident') url.searchParams.delete('accidentPage');
        if (url.href !== window.location.href) {
            window.history.replaceState({}, '', url);
        }
    };

    const goTo = (scene, options = {}) => {
        if (!resolveScene(scene)) return false;
        if (scene === 'room') {
            window.mizukoExperience.enterRoomScene(options.phase ?? 7);
        } else if (scene === 'falling') {
            window.mizukoExperience.enterFallingScene({ immediate: true });
        } else if (scene === 'accident') {
            return window.mizukoAccidentExperience.enterScene(options.page);
        } else if (scene === 'constellation') {
            window.mizukoAccidentExperience.enterConstellation();
            if (testMode) window.mizukoConstellationExperience?.enterTestState(options.state || 'clearing');
            return true;
        } else {
            return window.mizukoHellExperience.showScene(scene);
        }
        return true;
    };

    // The main story is a sequence; each door room is a branch of the hall.
    const mainStory = ['falling', 'next', 'doors'];
    const step = (direction) => {
        const experience = window.mizukoExperience;
        const scene = experience.getScene();
        if (scene === 'accident') return window.mizukoAccidentExperience.step(direction);
        if (scene === 'constellation') return window.mizukoConstellationExperience.stepTest(direction);
        if (scene === 'room') {
            const phase = experience.getPhase();
            if (direction > 0 && phase === 7) return goTo('falling');
            if (direction < 0 && phase === 1) return false;
            return goTo('room', { phase: phase + direction });
        }
        if (scene.startsWith('door-')) {
            const door = Number(scene.slice(5));
            if (direction < 0) return goTo('doors');
            if (door < 3) return goTo(`door-${door + 1}`);
            if (door === 4) return goTo('accident');
            if (door === 3 && window.mizukoHellExperience.hasVisitedEveryDoor()) {
                return goTo('door-4');
            }
            return false;
        }
        if (scene === 'hell-story' || scene === 'hell-accusation') {
            return goTo(direction < 0 ? 'next' : 'doors');
        }
        const index = mainStory.indexOf(scene);
        if (index < 0) return false;
        if (index === 0 && direction < 0) return goTo('room', { phase: 7 });
        if (scene === 'doors' && direction > 0) return goTo('door-1');
        return goTo(mainStory[index + direction]);
    };

    const resetTestProgress = () => {
        if (!testMode) return false;
        try {
            ['mizuko-room-test-progress-v1', 'mizuko-door-test-progress-v1', 'mizuko-accident-test-page']
                .forEach(key => localStorage.removeItem(key));
        } catch {}
        const url = new URL(location.href);
        const current = window.mizukoExperience.getScene();
        const scene = current.startsWith('door-') ? 'doors' : current;
        url.searchParams.set('test', '1');
        url.searchParams.set('scene', scene);
        url.searchParams.set('reset', '1');
        ['phase', 'accidentPage', 'nightState', 'visited'].forEach(key => url.searchParams.delete(key));
        if (scene === 'room') url.searchParams.set('phase', '1');
        if (scene === 'accident') url.searchParams.set('accidentPage', '1');
        if (scene === 'constellation') url.searchParams.set('nightState', 'clearing');
        location.replace(url.href);
        return true;
    };
    window.mizukoNavigation = { testMode, resolveScene, syncLocation, goTo, step, resetTestProgress };
    window.addEventListener('mizuko:scenechange', (event) => {
        const scene = event.detail.scene;
        const surfaces = {
            '#bg': scene === 'room',
            '#falling-section': scene === 'falling',
            '#next-scene': ['next', 'hell-story', 'hell-accusation'].includes(scene),
            '#door-section': scene === 'doors' || scene.startsWith('door-'),
            '#accident-scene': scene === 'accident',
            '#constellation-scene': scene === 'constellation'
        };
        Object.entries(surfaces).forEach(([selector, active]) => {
            const element = document.querySelector(selector);
            if (!element) return;
            element.inert = !active;
            element.setAttribute('aria-hidden', String(!active));
        });
    });
    window.addEventListener('keydown', (event) => {
        if (testMode && !event.defaultPrevented && !event.repeat && event.shiftKey &&
            !event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'r' &&
            !event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) {
            event.preventDefault(); resetTestProgress(); return;
        }
        if (!testMode || event.defaultPrevented || event.repeat ||
            event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
        const direction = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
        if (!direction) return;
        event.preventDefault();
        step(direction);
    });
})();
