document.getElementById("encode").onclick = function(){
    var file = document.getElementById("input_file").files[0];
    if (!file) {
        alert("cannot open");
        return;
    }
    var reader = new FileReader();
    var sampling_rate = 48000;
    var num_ch = 2;
    var byte_per_sample = 2;
    var frame_size = 960 / (48000 / sampling_rate);
    var frame_bytes = frame_size * num_ch * byte_per_sample;
    var input_buf = _malloc(frame_bytes);
    var max_out_size = (1275 * 3 + 7) * (1 /* num_of_streams */);
    var output_buf = _malloc(max_out_size);
    const OPUS_OK = 0;
    const OPUS_APPLICATION_AUDIO = 2049;
    var i32ptr = allocate(1, 'i32', ALLOC_STACK);
    var enc = _opus_encoder_create(48000, 2, OPUS_APPLICATION_AUDIO, i32ptr);
    if (getValue(i32ptr, 'i32') != OPUS_OK) {
        alert("opus_encoder_create: failed");
        return;
    }
    if (_opus_encoder_init(enc, 48000, 2, OPUS_APPLICATION_AUDIO) != OPUS_OK) {
        alert("opus_encoder_init: failed");
        return;
    }

    var reader_offset = 0;
    var file_size = file.size;
    var encode_start = new Date();
    var prev_prog = -1, encoded_bytes = 0;
    reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) {
            if (evt.target.result.byteLength == 0) {
                console.log("encode finished");
                console.log("   time = " + ((new Date().getTime() - encode_start.getTime()) / 1000) + " sec");
                console.log("   output = " + encoded_bytes + "B (" + Math.floor(encoded_bytes * 100 / file_size) + "%)");
                return;
            }
            var in_samples = new Int16Array(evt.target.result);
            HEAP16.set(in_samples, input_buf >> 1);
            var ret = _opus_encode(enc, input_buf, in_samples.length / num_ch, output_buf, max_out_size);
            if (ret < 0) {
                console.log("opus_encode = " + ret);
                return;
            }
            encoded_bytes += ret;
            var prog = Math.floor(reader_offset * 100 / file_size);
            if (prog != prev_prog) {
                console.log("encoding..." + prog + "%");
                prev_prog = prog;
            }
            reader_offset += evt.target.result.byteLength;
            reader.readAsArrayBuffer(file.slice(reader_offset, reader_offset + frame_bytes));
        } else {
            alert("unhandled state");
        }
    };
    reader.readAsArrayBuffer(file.slice(0, frame_bytes));

    /*
    for (var i = 0; i < frame_size * num_ch; ++i)
        setValue(silent_raw + i * byte_per_sample, 0, 'i16');

    var ret = _opus_encode(enc, silent_raw, frame_size, output_buf, max_out_size);
    if (ret < 0)
        alert(ret);
    _opus_encoder_destroy(enc);
    _free(silent_raw);
    _free(output_buf);
    */
};

document.getElementById("play").onclick = function() {
    var file = document.getElementById("input_file").files[0];
    if (!file) {
        alert("cannot open");
        return;
    }
    var reader = new FileReader();
    var sampling_rate = 48000;
    var num_ch = 2;
    var byte_per_sample = 2;
    var webAudioBufSize = 8192;
    var read_buffer_size = webAudioBufSize * num_ch * byte_per_sample;
    var num_of_read_buffers = 8;
    var read_buffers = new Array();
    var read_idx = 0, write_idx = 0;
    var reader_sleeping = false;
    for (var i = 0; i < num_of_read_buffers; ++i)
        read_buffers.push([new Int16Array(read_buffer_size), false]);
    reader.onloadend = function(ev) {
        if (ev.target.readyState == FileReader.DONE) {
            if (ev.target.result.byteLength == 0) {
                console.log("EOF");
                return;
            }
            //console.log("reader: " + write_idx);
            read_buffers[write_idx % num_of_read_buffers][1] = true;
            read_buffers[write_idx % num_of_read_buffers][0].set(new Int16Array(ev.target.result));
            ++write_idx;
            if (!read_buffers[write_idx % num_of_read_buffers][1]) {
                reader.readAsArrayBuffer(file.slice(write_idx * read_buffer_size, (write_idx + 1) * read_buffer_size));
            } else {
                //console.log("reader: sleeping... ");
                reader_sleeping = true;
            }
        } else {
            alert("unhandled state");
        }
    };
    reader.readAsArrayBuffer(file.slice(0, read_buffer_size));

    var audioctx = null;
    try {
        audioctx = new AudioContext();
    } catch (e) {
        audioctx = new webkitAudioContext();
    }
    var proc_node = audioctx.createScriptProcessor(webAudioBufSize, 1, num_ch);
    var dummy_node = audioctx.createBufferSource();

    dummy_node.buffer = audioctx.createBuffer(1, 1024, sampling_rate);
    dummy_node.loop = true;
    dummy_node.connect(proc_node);

    proc_node.connect(audioctx.destination);
    proc_node.onaudioprocess = function(ev) {
        if (!read_buffers[read_idx % num_of_read_buffers][1]) {
            //console.log('onaudioprocess. t=' + ev.playbackTime + ': buffer underflow');
            return;
        }
        //console.log('onaudioprocess. t=' + ev.playbackTime);
        var outCh0 = ev.outputBuffer.getChannelData(0);
        var outCh1 = ev.outputBuffer.getChannelData(1);
        var inView = read_buffers[read_idx % num_of_read_buffers][0];
        var total = 0.0;
        for (var i = 0; i < inView.length; i += 2) {
            outCh0[i/2] = inView[i + 0] / 32768.0;
            outCh1[i/2] = inView[i + 1] / 32768.0;
            total += outCh0[i/2] + outCh1[i/2];
        }
        //console.log(' len=' + inView.length + ' total=' + total + ' avg=' + (total / inView.length));
        read_buffers[read_idx % num_of_read_buffers][1] = false;
        ++read_idx;
        if (reader_sleeping) {
            reader_sleeping = false;
            reader.readAsArrayBuffer(file.slice(write_idx * read_buffer_size, (write_idx + 1) * read_buffer_size));
        }
    };
    try {
        dummy_node.start();
    } catch (e) { /* chromiumだとstartしなくても始まる＆startで引数が足りないと怒るのでtry-catchで囲む*/ }
};

var OpusCodec = function () {};
OpusCodec.OPUS_OK = 0;
OpusCodec.OPUS_APPLICATION_AUDIO = 2049;
OpusCodec.Encoder = function (fs, ch, app) {
    var errPtr = allocate(0, 'i32', ALLOC_STACK);
    var self = this;
    self.handle = _opus_encoder_create(fs, ch, app, errPtr);
    if (getValue(errPtr, 'i32') != OpusCodec.OPUS_OK)
        throw "opus_encoder_create returned " + getValue(errPtr, 'i32');
    self.close = function() {
        _opus_encoder_destroy(self.handle);
    };
    self.max_output_frame_bytes = (1275 * 3 + 7) * (1 /* num_of_streams */); // from opus-tools
    self.encode = function(input_frame, frame_size, output_frame) {
        var ret = _opus_encode(self.handle, input_frame, frame_size, output_frame, self.max_output_frame_bytes);
        if (ret < 0) throw 'opus_encode: ' + ret;
        return ret;
    };
}
OpusCodec.Decoder = function(fs, ch) {
    var errPtr = allocate(0, 'i32', ALLOC_STACK);
    var self = this;
    self.handle = _opus_decoder_create(fs, ch, errPtr);
    if (getValue(errPtr, 'i32') != OpusCodec.OPUS_OK)
        throw "opus_decoder_create returned " + getValue(errPtr, 'i32');
    self.close = function() {
        _opus_decoder_destroy(self.handle);
    };
    self.max_output_frame_samples = 120/*[ms]*/ * fs / 1000 * ch;
    self.decode = function(input_payload, input_len, output_pcm) {
        var ret = _opus_decode_float(self.handle, input_payload, input_len, output_pcm, self.max_output_frame_samples / ch, 0);
        if (ret < 0) throw 'opus_decode: ' + ret;
        return ret;
    };
}

var RiffWaveReader = function(file, open_success_callback, open_error_callback) {
    var file = file;
    var reader = new FileReader();
    var self = this;

    // event
    self.onloadend = function(ev) {};

    // Read RIFF header
    var header_read_state = 0;
    var header_search_pos = 0;
    var cur_chunk_size = null;
    reader.onloadend = function(ev) {
        if (ev.target.readyState != FileReader.DONE) {
            open_error_callback();
            return;
        }
        var view = new Uint8Array(ev.target.result);
        switch(header_read_state) {
        case 0: // check RIFF header
            if (view[0] == 82 && view[1] == 73 && view[2] == 70 && view[3] == 70 &&
               view[8] == 87 && view[9] == 65 && view[10] == 86 && view[11] == 69) {
                header_read_state = 1;
                header_search_pos = 12;
                reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + 8));
                return;
            }
            break;
        case 1: // find fmt/data chunk
            var chunk_size = view[4] | (view[5] << 8) | (view[6] << 16) | (view[7] << 24);
            if (view[0] == 102 && view[1] == 109 && view[2] == 116 && view[3] == 32) { // 'fmt '
                header_read_state = 2;
                header_search_pos += 8;
                cur_chunk_size = chunk_size;
                reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + chunk_size));
                return;
            } else if (view[0] == 100 && view[1] == 97 && view[2] == 116 && view[3] == 97) { // 'data'
                self.data_offset = header_search_pos + 8;
                self.byteLength = chunk_size;

                // RIFF wave check ok!
                reader.onloadend = function(ev) {
                    if (ev.target.readyState == FileReader.DONE)
                        ev.target.result.read_offset = self._offset;
                    self.onloadend(ev);
                };
                open_success_callback();
                return;
            }
            header_search_pos = header_search_pos + chunk_size + 8;
            reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + 8));
            return;
        case 2: // parse fmt chunk
            var view16 = new Uint16Array(ev.target.result);
            var view32 = new Uint32Array(ev.target.result);
            if (view16[0] != 1) break;
            self.channels = view16[1];
            self.sampling_rate = view32[1];
            self.bits_per_sample = view16[7];
            header_read_state = 1;
            header_search_pos += cur_chunk_size;
            reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + 8));
            return;
        }
        open_error_callback();
    };
    reader.readAsArrayBuffer(file.slice(0, 12));

    // functions
    self.read = function(offset, length) {
        if (!self.data_offset) throw 'unknown file format';
        self._offset = offset;
        if (self.data_offset + offset + length > self.byteLength)
            length = self.byteLength - offset;
        reader.readAsArrayBuffer(file.slice(self.data_offset + offset, self.data_offset + offset + length));
    };
};

document.getElementById("encdecplay").onclick = function() {
    var file = document.getElementById("input_file").files[0];
    if (!file) {
        alert("cannot open");
        return;
    }
    var frame_size = 960;
    var webAudioBufSize = 16384;
    var encoder = null, pcm_frame = null, encoded_frame = null, encoder_input_bytes;
    var decoder = null, out_pcm = null, decoded_samples = 0;
    var encoded_bytes = 0;
    var next_read_pos = encoder_input_bytes;
    var play_buffer = null, play_read_pos = 0, play_write_pos = 0, play_buffer_min_space = 0;
    var audioCtx = null, reader_sleeping = false;;

    var reader = new RiffWaveReader(file, function() {
        if (reader.sampling_rate != 48000 || reader.channels != 2 || reader.bits_per_sample != 16) {
            alert('not supported format. 48kHz 2ch 16bit only');
            return;
        }
        encoder = new OpusCodec.Encoder(reader.sampling_rate, reader.channels, OpusCodec.OPUS_APPLICATION_AUDIO);
        encoded_frame = _malloc(encoder.max_output_frame_bytes);
        encoder_input_bytes = frame_size * reader.channels * reader.bits_per_sample / 8;
        pcm_frame = _malloc(encoder_input_bytes);

        decoder = new OpusCodec.Decoder(reader.sampling_rate, reader.channels);
        out_pcm = _malloc(decoder.max_output_frame_samples * 4);

        play_buffer = new Float32Array(reader.sampling_rate * reader.channels);
        play_buffer_min_space = decoder.max_output_frame_samples * reader.channels * reader.bits_per_sample / 8;

        reader.read(0, encoder_input_bytes);

        try {
            audioCtx = new AudioContext();
        } catch (e) {
            audioCtx = new webkitAudioContext();
        }
        var proc_node = audioCtx.createScriptProcessor(webAudioBufSize, 1, reader.channels);
        var dummy_node = audioCtx.createBufferSource();
        
        dummy_node.buffer = audioCtx.createBuffer(1, 1024, reader.sampling_rate);
        dummy_node.loop = true;
        dummy_node.connect(proc_node);        
        proc_node.connect(audioCtx.destination);
        proc_node.onaudioprocess = function(ev) {
            if (play_read_pos >= play_write_pos)
                return; // buffer underflow
            var outCh0 = ev.outputBuffer.getChannelData(0);
            var outCh1 = ev.outputBuffer.getChannelData(1);
            var read_off = play_read_pos % play_buffer.length;
            var read_end = (play_read_pos + outCh0.length * 2) % play_buffer.length;
            var inView = play_buffer.subarray(read_off, Math.min(read_end, play_buffer.length));
            var k = 0;
            for (var j = 0; j < 2; ++j) {
                for (var i = 0; i < inView.length; i += 2, ++k) {
                    outCh0[k] = inView[i + 0];
                    outCh1[k] = inView[i + 1];
                }
                if (read_off < read_end)
                    break;
                inView = play_buffer.subarray(0, read_end);
            }
            play_read_pos += k * 2;
            if (reader_sleeping && (play_write_pos - play_read_pos < play_buffer.length - play_buffer_min_space)) {
                reader.read(next_read_pos, encoder_input_bytes);
            }
        }
        try {
            dummy_node.start();
        } catch (e) {}
    }, function() {
        alert('not RIFF wave');
    });


    reader.onloadend = function(ev) {
        var read_offset = ev.target.result.read_offset;
        if (ev.target.readyState != FileReader.DONE) { alert('unhandled state'); return; }
        if (ev.target.result.byteLength == 0) {
            console.log("EOF: len=" + read_offset + ". data_len=" + reader.byteLength);
            console.log("  encoded=" + encoded_bytes + "B");
            console.log("  decoded=" + decoded_samples + "samples/ch");
            return;
        }
        var in_samples = new Int16Array(ev.target.result);
        HEAP16.set(in_samples, pcm_frame >> 1);
        if (in_samples.length < frame_size * reader.channels) {
            // final-frame. padding '0'
            for (var i = in_samples.length; i < frame_size * reader.channels; ++i)
                setValue(pcm_frame + i * 2, 0, 'i16');
            console.log('padded ' + (frame_size * reader.channels - in_samples.length) + 'B');
        }
        var ret = encoder.encode(pcm_frame, frame_size, encoded_frame);
        encoded_bytes += ret;
        ret = decoder.decode(encoded_frame, ret, out_pcm);
        decoded_samples += ret;
        ret *= reader.channels;

        var write_off = play_write_pos % play_buffer.length;
        var write_size = Math.min(ret, play_buffer.length - write_off);
        play_buffer.set(HEAPF32.subarray(out_pcm >> 2, (out_pcm >> 2) + write_size), write_off);
        if (write_size < ret)
            play_buffer.set(HEAPF32.subarray((out_pcm >> 2) + write_size, (out_pcm >> 2) + ret), write_off + write_size);
        play_write_pos += ret;

        next_read_pos = read_offset + ev.target.result.byteLength;
        if (play_write_pos - play_read_pos < play_buffer.length - play_buffer_min_space) {
            reader.read(next_read_pos, encoder_input_bytes);
        } else {
            reader_sleeping = true;
        }
    };
};
