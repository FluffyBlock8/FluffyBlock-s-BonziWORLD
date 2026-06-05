(function (window) {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    var audioContext = new AudioCtx();

    var worker = null;
    var pendingCallbacks = {};
    var requestCounter = 0;

    function getWorker() {
        if (worker) return worker;
        try {
            worker = new Worker('./js/lib/speakjs/samWorker.js');
            worker.onmessage = function (e) {
                var data = e.data;
                var cb = pendingCallbacks[data.id];
                if (!cb) return;
                delete pendingCallbacks[data.id];
                if (data.error || !data.samples) {
                    cb.handle.cancelled = true;
                    if (cb.onended) setTimeout(cb.onended, 0);
                    return;
                }
                if (cb.handle.cancelled) return;
                var samples = new Float32Array(data.samples);
                playBuffer(samples, cb.handle, cb.onended, cb.onstart);
            };
            worker.onerror = function (e) {
                console.error('SAM worker error:', e);
            };
        } catch (e) {
            console.error('Could not create SAM worker, falling back to sync:', e);
            worker = null;
        }
        return worker;
    }

    function cleanInput(text, args) {
        var input = String(text == null ? '' : text);
        input = input
            .replace(/&lt;/g,   '<')
            .replace(/&gt;/g,   '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g,  "'")
            .replace(/&apos;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g,  '&')
            .replace(/&#(\d+);/g,      function (_, n) { return String.fromCharCode(parseInt(n, 10)); })
            .replace(/&#x([0-9a-fA-F]+);/g, function (_, n) { return String.fromCharCode(parseInt(n, 16)); });
        input = input.replace(/[^ -~]/g, function (c) {
            var code = c.charCodeAt(0);
            return (code >= 0x20 && code <= 0x7e) ? c : '';
        });
        return input;
    }

    function playBuffer(samples, handle, onended, onstart) {
        var source = audioContext.createBufferSource();
        var buffer = audioContext.createBuffer(1, samples.length, 22050);
        buffer.getChannelData(0).set(samples);
        source.buffer = buffer;
        source.connect(audioContext.destination);

        handle.audioSource = source;

        var ended = false;
        var finish = function () {
            if (ended) return;
            ended = true;
            if (source._endTimeout) clearTimeout(source._endTimeout);
            if (onended) onended();
        };

        var origStop = source.stop.bind(source);
        source.stop = function () {
            try { origStop(0); } catch (e) {}
            finish();
        };
        source.onended = finish;

        var durationMs = Math.ceil((samples.length / 22050) * 1000) + 50;
        source._endTimeout = setTimeout(finish, durationMs);

        try {
            source.start(0);
        } catch (e) {
            try { source.noteOn(0); } catch (e2) {}
        }

        if (onstart) onstart(handle);
    }

    var speak = {};

    speak.play = function (text, args, onended, onstart) {
        args = args || {};
        var input = cleanInput(text, args);

        var phonetic = !!args.phonetic;
        if (input.charAt(0) === '[') {
            phonetic = true;
            input = input.slice(1);
        }

        var id = ++requestCounter;

        var handle = {
            cancelled: false,
            audioSource: null,
            stop: function () {
                this.cancelled = true;
                if (this.audioSource) {
                    try { this.audioSource.stop(); } catch (e) {}
                }
                delete pendingCallbacks[id];
            }
        };

        var w = getWorker();

        if (!w) {
            try {
                var sam = new window.SamJs({
                    pitch:    typeof args.pitch    === 'number' ? args.pitch    : 64,
                    speed:    typeof args.speed    === 'number' ? args.speed    : 72,
                    mouth:    typeof args.mouth    === 'number' ? args.mouth    : 128,
                    throat:   typeof args.throat   === 'number' ? args.throat   : 128,
                    singmode: !!args.singmode,
                    phonetic: phonetic
                });
                var samples = sam.buf32(input);
                if (samples && samples.length) {
                    playBuffer(samples, handle, onended, onstart);
                } else {
                    if (onended) setTimeout(onended, 0);
                }
            } catch (e) {
                console.error('SamJs sync error:', e);
                if (onended) setTimeout(onended, 0);
            }
            return handle;
        }

        pendingCallbacks[id] = { handle: handle, onended: onended, onstart: onstart };

        if (onstart) onstart(handle);

        w.postMessage({
            id:       id,
            text:     input,
            pitch:    typeof args.pitch    === 'number' ? args.pitch    : 64,
            speed:    typeof args.speed    === 'number' ? args.speed    : 72,
            mouth:    typeof args.mouth    === 'number' ? args.mouth    : 128,
            throat:   typeof args.throat   === 'number' ? args.throat   : 128,
            singmode: !!args.singmode,
            phonetic: phonetic
        });

        return handle;
    };

    window.speak = speak;
})(window);
