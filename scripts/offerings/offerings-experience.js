(() => {
    const room = document.querySelector('#door-room-2');
    if (!room) return;
    const symbols = [...room.querySelectorAll('.offering-symbol')];
    const statues = [...room.querySelectorAll('.offering-mizuko__image')];
    const texts = [...room.querySelectorAll('.offering-text__image')];
    const announcement = room.querySelector('.offering-announcement');
    const cursor = document.querySelector('.custom-cursor');
    let selectionVersion = 0;

    const releaseOffering = () => {
        document.body.classList.remove('is-offering-grabbing');
        cursor?.classList.remove('is-grabbing');
        if (room.matches('.is-active') && room.querySelector('.offering-symbol:hover')) {
            cursor?.classList.add('is-hand');
        }
    };

    const resetOfferings = () => {
        selectionVersion += 1;
        releaseOffering();
        statues.forEach((image) => {
            const active = image.dataset.mizuko === 'Plain';
            image.classList.toggle('is-current', active);
            image.setAttribute('aria-hidden', String(!active));
        });
        texts.forEach((image) => image.classList.remove('is-current'));
        symbols.forEach((symbol) => symbol.setAttribute('aria-pressed', 'false'));
        announcement.textContent = '';
    };

    const selectOffering = async (symbol) => {
        const version = ++selectionVersion;
        const statue = statues.find((image) => image.dataset.mizuko === symbol.dataset.mizukoTarget);
        const text = texts.find((image) => image.dataset.offeringText === symbol.dataset.offering);
        if (!statue || !text) return;
        // Decode before fading, and ignore an earlier selection that loads late.
        try {
            await Promise.all([statue.decode(), text.decode()]);
        } catch {
            return;
        }
        if (version !== selectionVersion || !room.matches('.is-active')) return;
        statues.forEach((image) => {
            image.classList.toggle('is-current', image === statue);
            image.setAttribute('aria-hidden', String(image !== statue));
        });
        texts.forEach((image) => image.classList.toggle('is-current', image === text));
        symbols.forEach((item) => item.setAttribute('aria-pressed', String(item === symbol)));
        announcement.textContent = room.querySelector(`#offering-copy-${symbol.dataset.offering}`).textContent;
    };

    symbols.forEach((symbol) => {
        symbol.addEventListener('click', () => selectOffering(symbol));
        symbol.addEventListener('pointerenter', () => {
            cursor?.classList.add('is-hand');
        });
        symbol.addEventListener('pointerleave', () => {
            cursor?.classList.remove('is-hand');
            releaseOffering();
        });
        symbol.addEventListener('pointerdown', () => {
            document.body.classList.add('is-offering-grabbing');
            cursor?.classList.remove('is-hand');
            cursor?.classList.add('is-grabbing');
        });
    });
    window.addEventListener('pointerup', releaseOffering);
    window.addEventListener('pointercancel', releaseOffering);
    window.addEventListener('blur', releaseOffering);
    window.addEventListener('mizuko:scenechange', (event) => {
        if (event.detail.scene === 'door-2') resetOfferings();
        else {
            selectionVersion += 1;
            releaseOffering();
        }
    });
    resetOfferings();
})();
