document.getElementById("encdec").onclick = function() {
    var file = document.getElementById("input_file").files[0];
    if (!file) {
        alert("cannot open");
        return;
    }
    var reader = new RiffWaveReader(file, function() {
        if (reader.sampling_rate != 48000) {
            alert("supported 48kHz only");
            return;
        }
        if (reader.channels != 2) { alert("supported stereo only"); return;  }
        if (reader.bits_per_sample != 16) { alert("supported 16bit only"); return;  }
        var prev_prog = -1, encoded_bytes = 0, decoded_bytes = 0, file_size = file.size, encode_start = new Date();
        
        var frame_size = Math.floor(960 / (48000 / reader.sampling_rate));
        var frame_bytes = frame_size * reader.channels * (reader.bits_per_sample / 8);
        var read_pos = 0, eof = false;

        var encoder = new Worker("libopus.worker.js");
        var decoder = new Worker("libopus.worker.js");
        encoder.onmessage = function(ev) {
            if (!ev.data) {
                decoder.postMessage(null);
                return;
            }
            if (typeof ev.data === 'string') {
                console.log(ev.data);
                return;
            }
            if (ev.data instanceof ArrayBuffer) {
                encoded_bytes += ev.data.byteLength;
                decoder.postMessage(ev.data);
            }
        };
        decoder.onmessage = function(ev) {
            if (!ev.data) {
                console.log("encoding&decoding finished");
                console.log("   time = " + ((new Date().getTime() - encode_start.getTime()) / 1000) + " sec");
                console.log("   encoded = " + encoded_bytes + "B (" + Math.floor(encoded_bytes * 100 / file_size) + "%)");
                return;
            }
            if (typeof ev.data === 'string') {
                console.log(ev.data);
                return;
            }
            if (ev.data instanceof ArrayBuffer) {
                decoded_bytes += ev.data.byteLength;
                var prog = Math.floor(decoded_bytes * 100 / file_size);
                if (prog != prev_prog) {
                    console.log("encoding&decoding..." + prog + "%");
                    prev_prog = prog;
                }
            }
        };
        encoder.postMessage({'samplingrate': reader.sampling_rate,
                             'channels': reader.channels,
                             'framesize': frame_size,
                             'application': 'audio',
                             'type': 'encoder'});
        decoder.postMessage({'samplingrate': reader.sampling_rate,
                             'channels': reader.channels,
                             'type': 'decoder'});
        
        reader.onloadend = function(ev) {
            if (ev.target.readyState != FileReader.DONE) {
                alert("unhandled state");
                return;
            }
            if (ev.target.result.byteLength == 0) {
                encoder.postMessage(null);
                return;
            }
            encoder.postMessage(ev.target.result);
            reader.read(read_pos, frame_bytes);
            read_pos += frame_bytes;
        };
        reader.read(0, frame_bytes);
        read_pos += frame_bytes;
    }, function() {
        alert("unknown file type");
    });
};

document.getElementById("play").onclick = function() {
    var file = document.getElementById("input_file").files[0];
    if (!file) {
        alert("cannot open");
        return;
    }
    var reader = new RiffWaveReader(file, function() {
        var webAudioBufSize = 8192;
        var read_buffer_size = webAudioBufSize * reader.channels * (reader.bits_per_sample / 8);
        var num_of_read_buffers = 8;
        var read_buffers = new Array();
        var read_idx = 0, write_idx = 0;
        var reader_sleeping = false;
        var eof = false;

        for (var i = 0; i < num_of_read_buffers; ++i)
            read_buffers.push([new Int16Array(read_buffer_size), false]);

        reader.onloadend = function(ev) {
            if (ev.target.readyState == FileReader.DONE) {
                if (ev.target.result.byteLength == 0) {
                    eof = true;
                    console.log("EOF");
                    return;
                }
                //console.log("reader: " + write_idx);
                read_buffers[write_idx % num_of_read_buffers][1] = true;
                read_buffers[write_idx % num_of_read_buffers][0].set(new Int16Array(ev.target.result));
                ++write_idx;
                if (!read_buffers[write_idx % num_of_read_buffers][1]) {
                    reader.read(write_idx * read_buffer_size, read_buffer_size);
                } else {
                    //console.log("reader: sleeping... ");
                    reader_sleeping = true;
                }
            } else {
                alert("unhandled state");
            }
        };
        reader.read(0, read_buffer_size);
        
        var audioctx = null;
        try {
            audioctx = new AudioContext();
        } catch (e) {
            audioctx = new webkitAudioContext();
        }
        var proc_node = audioctx.createScriptProcessor(webAudioBufSize, 1, reader.channels);
        var dummy_node = audioctx.createBufferSource();
        
        dummy_node.buffer = audioctx.createBuffer(1, 1024, reader.sampling_rate);
        dummy_node.loop = true;
        dummy_node.connect(proc_node);
        
        proc_node.connect(audioctx.destination);
        proc_node.onaudioprocess = function(ev) {
            if (!read_buffers[read_idx % num_of_read_buffers][1]) {
                if (eof) {
                    dummy_node.stop();
                } else {
                    console.log('onaudioprocess. t=' + ev.playbackTime + ': buffer underflow');
                }
                return;
            }
            console.log('onaudioprocess. t=' + ev.playbackTime);
            var outCh0 = ev.outputBuffer.getChannelData(0);
            var outCh1 = ev.outputBuffer.getChannelData(1);
            var inView = read_buffers[read_idx % num_of_read_buffers][0];
            for (var i = 0; i < inView.length; i += 2) {
                outCh0[i/2] = inView[i + 0] / 32768.0;
                outCh1[i/2] = inView[i + 1] / 32768.0;
            }
            read_buffers[read_idx % num_of_read_buffers][1] = false;
            ++read_idx;
            if (reader_sleeping) {
                reader_sleeping = false;
                reader.read(write_idx * read_buffer_size, read_buffer_size);
            }
        };
        dummy_node.start(0); // chromiumだと不要 (＆古いドラフトでは第一引数必須なので互換のためデフォルト値である０を指定)
    }, function() {
        alert("unknown file type");
    });
};

document.getElementById("encdecplay").onclick = function() {
    var file = document.getElementById("input_file").files[0];
    if (!file) {
        alert("cannot open");
        return;
    }
    var reader = new RiffWaveReader(file, function() {
        if (reader.channels != 2) { alert("supported stereo only"); return;  }
        if (reader.bits_per_sample != 16) { alert("supported 16bit only"); return;  }
        
        var frame_size = 960 / Math.floor(48000 / reader.sampling_rate);
        var frame_bytes = frame_size * reader.channels * (reader.bits_per_sample / 8);
        var reader_pos = 0, reader_sleeping = false, eof = false;

        var encoder = new Worker("libopus.worker.js");
        var decoder = new Worker("libopus.worker.js");

        var webAudioBufSize = 16384;
        var targetRingBufferSamples = reader.sampling_rate; // 1sec
        if (targetRingBufferSamples % frame_size !== 0) targetRingBufferSamples -= targetRingBufferSamples % frame_size;
        var targetRingBufferSize = targetRingBufferSamples * reader.channels * 4;
        var ringBufferRaw = new ArrayBuffer(targetRingBufferSize);
        var ringBuffer = new Float32Array(ringBufferRaw);
        var ringReadPos = 0, ringWritePos = 0;

        encoder.onmessage = function(ev) {
            if (!ev.data) {
                decoder.postMessage(null);
                return;
            }
            if (typeof ev.data === 'string') {
                console.log(ev.data);
                return;
            }
            if (ev.data instanceof ArrayBuffer) {
                decoder.postMessage(ev.data);
            }
        };
        decoder.onmessage = function(ev) {
            if (!ev.data) {
                reader.close();
                return;
            }
            if (typeof ev.data === 'string') {
                console.log(ev.data);
                return;
            }
            if (ev.data instanceof ArrayBuffer) {
                var f32ary = new Float32Array(ev.data);
                var modPos = ringWritePos % ringBuffer.length;
                if (modPos + f32ary.length < ringBuffer.length) {
                    ringBuffer.set(f32ary, modPos);
                } else {
                    var tailSize = (ringBuffer.length - modPos) * 4;
                    ringBuffer.set(new Float32Array(ev.data.slice(0, tailSize)), modPos);
                    ringBuffer.set(new Float32Array(ev.data.slice(tailSize)), 0);
                }
                ringWritePos += f32ary.length;
                //console.log('decoding...' + ringWritePos);
            }
        };
        encoder.postMessage({'samplingrate': reader.sampling_rate,
                             'channels': reader.channels,
                             'framesize': frame_size,
                             'application': 'audio',
                             'type': 'encoder'});
        decoder.postMessage({'samplingrate': reader.sampling_rate,
                             'channels': reader.channels,
                             'float': true,
                             'type': 'decoder'});

        reader.onloadend = function(ev) {
            if (ev.target.readyState == FileReader.DONE) {
                if (ev.target.result.byteLength == 0) {
                    eof = true;
                    console.log("EOF");
                    return;
                }
                reader_pos += ev.target.result.byteLength;
                if (ev.target.result.byteLength !== frame_bytes) {
                    for (var i = 0; i < ev.target.result.byteLength; i += frame_bytes)
                        encoder.postMessage(ev.target.result.slice(
                            i, (i + frame_bytes < ev.target.result.byteLength ? i + frame_bytes : ev.target.result.byteLength)));
                } else {
                    encoder.postMessage(ev.target.result);
                }
            } else {
                alert("unhandled state");
            }
        };
        reader.read(0, ringBufferRaw.byteLength / 4 * 2); // リングバッファを一度に埋めるサイズを読み込む
        
        var audioctx = null;
        try {
            audioctx = new AudioContext();
        } catch (e) {
            audioctx = new webkitAudioContext();
        }
        var proc_node = audioctx.createScriptProcessor(webAudioBufSize, 1, reader.channels);
        var dummy_node = audioctx.createBufferSource();
        
        dummy_node.buffer = audioctx.createBuffer(1, reader.sampling_rate / 10, reader.sampling_rate);
        dummy_node.loop = true;
        dummy_node.connect(proc_node);
        
        proc_node.connect(audioctx.destination);
        proc_node.onaudioprocess = function(ev) {
            if (ringReadPos >= ringWritePos) {
                if (eof) {
                    dummy_node.stop();
                } else {
                    console.log('onaudioprocess. t=' + ev.playbackTime + ': buffer underflow');
                }
                return;
            }

            console.log('onaudioprocess. t=' + ev.playbackTime);
            var outCh0 = ev.outputBuffer.getChannelData(0);
            var outCh1 = ev.outputBuffer.getChannelData(1);
            var samples = (ringWritePos - ringReadPos < outCh0.length * 2 ? ringWritePos - ringReadPos : outCh0.length * 2);
            for (var i = 0; i < samples; i += 2) {
                outCh0[i/2] = ringBuffer[(i + 0 + ringReadPos) % ringBuffer.length];
                outCh1[i/2] = ringBuffer[(i + 1 + ringReadPos) % ringBuffer.length];
            }
            ringReadPos += samples;
            if (!eof && ringWritePos + frame_size * reader.channels - ringReadPos <= ringBuffer.length) {
                var free_samples = ringBuffer.length - (ringWritePos - ringReadPos);
                var free_frames  = Math.floor(free_samples / reader.channels / frame_size);
                reader.read(reader_pos, free_frames * frame_bytes);
            }
        };
        dummy_node.start(0); // chromiumだと不要 (＆古いドラフトでは第一引数必須なので互換のためデフォルト値である０を指定)
    }, function() {
        alert("unknown file type");
    });
};
