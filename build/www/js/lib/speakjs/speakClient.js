(function (window) {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    var audioContext = null;
    
    function getAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new AudioCtx();
            } catch (e) {
                console.error('Failed to init audio context:', e);
                return null;
            }
        }
        return audioContext;
    }

    var speak = {};

    speak.play = function (text, args, onended, onstart) {
        args = args || {};

        var input = String(text == null ? '' : text);

        // Sanitize input
        input = input
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&#(\d+);/g, function (_, n) {
                return String.fromCharCode(parseInt(n, 10));
            })
            .replace(/&#x([0-9a-fA-F]+);/g, function (_, n) {
                return String.fromCharCode(parseInt(n, 16));
            });

        // Remove any control characters that might crash SamJS
        input = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        
        // Limit input length to prevent crashes
        if (input.length > 2000) {
            input = input.substring(0, 2000);
        }

        // If input is empty after sanitization, just call onended
        if (!input || input.trim().length === 0) {
            if (onended) setTimeout(onended, 0);
            return;
        }

        var phonetic = !!args.phonetic;
        if (input.charAt(0) === '[') {
            phonetic = true;
            input = input.slice(1);
        }

        input = input.replace(/[^ -~]/g, function (c) {
            var code = c.charCodeAt(0);
            return (code >= 0x20 && code <= 0x7e) ? c : '';
        });

        var sam;
        try {
            if (!window.SamJs) {
                console.error('SamJs library not loaded');
                if (onended) setTimeout(onended, 0);
                return;
            }
            
            sam = new window.SamJs({
                pitch: typeof args.pitch === 'number' ? args.pitch : 64,
                speed: typeof args.speed === 'number' ? args.speed : 72,
                mouth: typeof args.mouth === 'number' ? args.mouth : 128,
                throat: typeof args.throat === 'number' ? args.throat : 128,
                singmode: !!args.singmode,
                phonetic: phonetic
            });
        } catch (e) {
            console.error('SamJs init error:', e);
            if (onended) setTimeout(onended, 0);
            return;
        }

        var samples;
        try {
            samples = sam.buf32(input, phonetic);
        } catch (e) {
            console.error('SamJs render error:', e);
            if (onended) setTimeout(onended, 0);
            return;
        }

        if (!samples || !samples.length) {
            if (onended) setTimeout(onended, 0);
            return;
        }

        var ctx = getAudioContext();
        if (!ctx) {
            console.error('No audio context available');
            if (onended) setTimeout(onended, 0);
            return;
        }

        var source = ctx.createBufferSource();
        var buffer = ctx.createBuffer(1, samples.length, 22050);
        buffer.getChannelData(0).set(samples);
        source.buffer = buffer;
        source.connect(ctx.destination);

        var ended = false;
        var finish = function () {
            if (ended) return;
            ended = true;
            if (source.endTimeout) clearTimeout(source.endTimeout);
            if (onended) onended();
        };

        var origStop = source.stop.bind(source);
        source.stop = function () {
            try { origStop(0); } catch (e) {}
            finish();
        };
        source.onended = finish;

        var durationMs = Math.ceil((samples.length / 22050) * 1000) + 50;
        source.endTimeout = setTimeout(finish, durationMs);

        try {
            source.start(0);
        } catch (e) {
            try { source.noteOn(0); } catch (e2) {}
        }

        if (onstart) onstart(source);
    };

    window.speak = speak;
})(window);
