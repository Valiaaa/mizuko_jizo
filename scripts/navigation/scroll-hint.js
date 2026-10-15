(() => {
    const cue = document.createElement('div');
    cue.className = 'story-scroll-hint'; cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML = '<span>向下滚动</span><i></i><i></i>';
    document.body.append(cue);
    let timer = 0;
    const hide = () => { clearTimeout(timer); cue.classList.remove('is-visible'); };
    const show = scene => {
        hide();
        const valid = ['falling', 'door-3', 'door-4'].includes(scene);
        if (!valid || document.hidden) return;
        cue.classList.toggle('is-grey', scene === 'door-3');
        cue.classList.toggle('is-falling-hint', scene === 'falling');
        // Show once on scene entry; scroll input never cancels the five-second cue.
        void cue.offsetWidth;
        cue.classList.add('is-visible');
        timer = setTimeout(hide, 5000);
    };
    window.mizukoScrollHint = {show, hide};
    window.addEventListener('mizuko:scenechange', e => show(e.detail.scene));
    show(window.mizukoExperience.getScene());
})();
