const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('scripts/fracture/fracture-experience.js', 'utf8');

function harness({ failed = [], stalled = [], noCanvas = false, readbackFailure = false } = {}) {
    const events = {}, windowEvents = {};
    function element() {
        const classes = new Set();
        return { hidden: false, style: {}, dataset: {}, clientWidth: 960, clientHeight: 540,
            classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)),
                contains: x => classes.has(x), toggle: (x, yes) => yes ? classes.add(x) : classes.delete(x) } };
    }
    const stage = element(), art = element(), echo = element(), text = element(), fallback = element(), back = element();
    const context = { setTransform() {}, clearRect() {}, drawImage() {}, beginPath() {}, lineTo() {}, moveTo() {}, closePath() {}, clip() {}, putImageData() {}, fillRect() {},
        getImageData() { if (readbackFailure) throw Error('Readback unavailable'); return { data: new Uint8ClampedArray(960 * 540 * 4) }; } };
    const canvas = { getContext: () => noCanvas ? null : context };
    const nodes = { '.fracture-plate': element(), '.fracture-art': art, '.fracture-echo': echo,
        '.fracture-copy img': text, '.fracture-copy__fallback': fallback, canvas, '.fracture-return': back };
    stage.querySelector = selector => nodes[selector];
    const room = { querySelector: () => stage, addEventListener: (type, fn) => events[type] = fn };
    class FakeImage {
        constructor() { this.complete = false; this.naturalWidth = 0; this.listeners = {}; }
        addEventListener(type, fn) { this.listeners[type] = fn; }
        removeEventListener(type) { delete this.listeners[type]; }
        set src(url) {
            this.url = url;
            if (stalled.some(name => url.endsWith(name))) { this.complete = false; return; }
            this.complete = true;
            this.naturalWidth = failed.some(name => url.endsWith(name)) ? 0 : 1920;
        }
        get src() { return this.url; }
        decode() { throw Error('decode must not gate the reveal'); }
    }
    let current = 'door-3';
    const sandbox = { Image: FakeImage, Uint8ClampedArray, Math, Promise, devicePixelRatio: 1,
        document: { querySelector: () => room, createElement: () => ({ getContext: () => context }), hidden: false },
        window: { addEventListener: (type, fn) => windowEvents[type] = fn, mizukoExperience: { getScene: () => current } },
        matchMedia: () => ({ matches: false }), console: { warn() {} }, performance: { now: () => 0 },
        requestAnimationFrame: () => 1, cancelAnimationFrame() {},
        setTimeout: fn => setTimeout(fn, 0), clearTimeout };
    vm.runInNewContext(source, sandbox);
    return { stage, text, fallback, back, art,
        next() { events.wheel({ deltaY: 100, preventDefault() {} }); },
        leave() { current = 'doors'; windowEvents['mizuko:scenechange']({ detail: { scene: current } }); } };
}
async function settle() { for (let i = 0; i < 12; i++) await new Promise(resolve => setTimeout(resolve, 1)); }
for (const [name, options] of [
    ['normal loading without decode dependency', {}],
    ['fourth reference image never loads', { stalled: ['scene4.jpg'] }],
    ['canvas readback throws', { readbackFailure: true }],
    ['canvas is unavailable', { noCanvas: true }],
    ['current images fail', { failed: ['scene1.jpg', 'text1.png'] }],
    ['current requests never finish', { stalled: ['scene1.jpg', 'text1.png'] }],
]) {
    test(name, async () => {
        const h = harness(options); await settle();
        assert(h.stage.classList.contains('is-present'));
        assert.equal(h.stage.dataset.page, '1');
        if (options.failed || options.stalled?.includes('text1.png')) {
            assert.equal(h.fallback.hidden, false);
            assert.equal(h.back.hidden, false);
        }
        h.next(); await settle();
        assert.equal(h.stage.dataset.page, '2', 'loading or particle failure must release navigation');
        h.next(); await settle(); h.next(); await settle();
        assert.equal(h.stage.dataset.page, '4');
        assert.equal(h.back.hidden, false);
    });
}
test('leaving while loading cannot reveal an inactive scene', async () => {
    const h = harness({ stalled: ['text1.png'] }); h.leave(); await settle();
    assert.equal(h.stage.classList.contains('is-present'), false);
});
