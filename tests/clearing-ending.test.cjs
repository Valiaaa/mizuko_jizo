const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('last keyword restores clearing; only an uncovered body opens the white ending', async () => {
    function element() {
        const classes = new Set(), listeners = {};
        return { hidden: false, dataset: {}, style: { setProperty() {} }, listeners,
            classList: { add: (...a) => a.forEach(x => classes.add(x)), remove: (...a) => a.forEach(x => classes.delete(x)),
                contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) },
            addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
            fire(type, e = {}) { (listeners[type] || []).forEach(fn => fn(e)); },
            setAttribute() {}, removeAttribute() {}, focus() {}, scrollTo() {},
            getBoundingClientRect() { return { left: 100 + Number(this.dataset.x || 0), top: 100, width: 30, height: 20 }; },
            hasPointerCapture: () => false,
            querySelector() { return { decode: () => Promise.resolve(), naturalWidth: 100, naturalHeight: 100 }; } };
    }
    const accident = element(), night = element(), stage = element(), ending = element(), dissolve = element(), body = element();
    const objectLayer = element(), ceramic = element(), copy = element(), next = element(), cursor = element();
    const panels = Array.from({ length: 4 }, element), objects = Array.from({ length: 2 }, element);
    accident.querySelector = s => ({ '.accident-stage': stage, '.accident-ending': ending, '.accident-dissolve': dissolve })[s];
    accident.querySelectorAll = s => s === '.accident-panel' ? panels : [];
    night.querySelector = s => ({ '.night-body-small': body, '.night-objects': objectLayer, '.night-ceramic': ceramic,
        '.night-copy': copy, '.night-continue': next })[s] || { decode: () => Promise.resolve() };
    night.querySelectorAll = () => objects;
    let current = 'accident'; const sceneEvents = [];
    const context = {
        document: { querySelector: s => ({ '#accident-scene': accident, '#constellation-scene': night, '.custom-cursor': cursor })[s],
            body: element(), createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(96 * 96 * 4).fill(255) }) }) }) },
        window: { mizukoNavigation: { testMode: false }, addEventListener(type, fn) { if (type === 'mizuko:scenechange') sceneEvents.push(fn); },
            mizukoExperience: { getScene: () => current, setScene(s) { current = s; sceneEvents.forEach(fn => fn({ detail: { scene: s } })); } } },
        URLSearchParams, location: { search: '' }, localStorage: { getItem: () => null, setItem() {} },
        matchMedia: () => ({ matches: false }), setTimeout: fn => setTimeout(fn, 0), clearTimeout, cancelAnimationFrame() {},
    };
    vm.runInNewContext(fs.readFileSync('scripts/accident/accident-experience.js', 'utf8'), context);
    vm.runInNewContext(fs.readFileSync('scripts/accident/constellation-experience.js', 'utf8'), context);
    await new Promise(resolve => setTimeout(resolve, 5));
    context.window.mizukoAccidentExperience.enterScene(4);
    accident.fire('click', { target: { closest: () => element() } });
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(current, 'constellation'); assert.equal(body.disabled, true); assert.equal(ending.hidden, true);
    body.fire('click'); assert.equal(current, 'constellation');
    for (const item of objects) {
        for (let i = 0; i < 3; i++) night.fire('keydown', { target: { closest: () => item }, key: 'ArrowRight', shiftKey: true, preventDefault() {} });
    }
    assert.equal(body.disabled, false);
    body.fire('click');
    assert.equal(current, 'accident'); assert(accident.classList.contains('is-ended')); assert.equal(ending.hidden, false);
    assert.equal(dissolve.hidden, true); assert.equal(night.classList.contains('is-expanding'), false);
    assert.equal(night.classList.contains('is-night'), false);
});
