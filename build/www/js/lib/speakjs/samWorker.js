importScripts('../sam.js');

self.onmessage = function (e) {
    var data = e.data;
    try {
        var sam = new SamJs({
            pitch:    typeof data.pitch    === 'number' ? data.pitch    : 64,
            speed:    typeof data.speed    === 'number' ? data.speed    : 72,
            mouth:    typeof data.mouth    === 'number' ? data.mouth    : 128,
            throat:   typeof data.throat   === 'number' ? data.throat   : 128,
            singmode: !!data.singmode,
            phonetic: !!data.phonetic
        });
        var samples = sam.buf32(data.text);
        if (samples && samples.length > 0) {
            self.postMessage({ id: data.id, samples: samples.buffer }, [samples.buffer]);
        } else {
            self.postMessage({ id: data.id, samples: null });
        }
    } catch (err) {
        self.postMessage({ id: data.id, error: String(err) });
    }
};
