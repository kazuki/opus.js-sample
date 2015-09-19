/// <reference path="api.d.ts" />
var RiffPcmWaveReader = (function () {
    function RiffPcmWaveReader() {
        this.in_flight = false;
        // 読み込みカーソル位置(data_offsetからの相対位置)
        this.read_pos = 0;
        this.reader = new FileReader();
    }
    RiffPcmWaveReader.prototype.open = function (buffer_samples_per_ch, params) {
        var _this = this;
        this.buffer_samples_per_ch = buffer_samples_per_ch;
        return new Promise(function (resolve, reject) {
            _this.file = params.file;
            if (!(_this.file instanceof File)) {
                reject('invalid params');
                return;
            }
            _this.readHeader().then(resolve, reject);
        });
    };
    RiffPcmWaveReader.prototype.read = function () {
        var _this = this;
        this.in_flight = true;
        return new Promise(function (resolve, reject) {
            _this.readBytes(_this.data_offset + _this.read_pos, _this.buffer_bytes).then(function (data) {
                _this.in_flight = false;
                _this.read_pos += data.byteLength;
                var _a = _this.convert(data), samples = _a[0], transferable = _a[1];
                resolve({
                    timestamp: 0,
                    samples: samples,
                    transferable: transferable
                });
            }, function (e) {
                reject({
                    pos: _this.data_offset + _this.read_pos,
                    len: _this.buffer_bytes,
                    reason: e.reason
                });
            });
        });
    };
    RiffPcmWaveReader.prototype.close = function () {
    };
    RiffPcmWaveReader.prototype.readHeader = function () {
        var _this = this;
        var off = 0;
        var state = 0;
        var chunk_size = 0;
        var found_fmt_chunk = false;
        var found_data_chunk = false;
        var info = {
            sampling_rate: 0,
            num_of_channels: 0
        };
        var equals = function (txt, bytes) {
            if (txt.length !== bytes.length)
                return false;
            var txt2 = String.fromCharCode.apply(String, bytes);
            return (txt === txt2);
        };
        return new Promise(function (resolve, reject) {
            var parse = function (data) {
                var v8 = new Uint8Array(data);
                switch (state) {
                    case 0:
                        if (equals('RIFF', v8.subarray(0, 4)) && equals('WAVE', v8.subarray(8, 12))) {
                            state = 1;
                            off = 12;
                            _this.readBytes(off, 8).then(parse, reject);
                        }
                        else {
                            reject('invalid RIFF');
                        }
                        return;
                    case 1:
                        chunk_size = v8[4] | (v8[5] << 8) | (v8[6] << 16) | (v8[7] << 24);
                        if (equals('fmt ', v8.subarray(0, 4))) {
                            state = 2;
                            off += 8;
                            _this.readBytes(off, chunk_size).then(parse, reject);
                            return;
                        }
                        else if (equals('data', v8.subarray(0, 4))) {
                            _this.data_offset = off + 8;
                            _this.data_bytes = chunk_size;
                            if (found_fmt_chunk) {
                                resolve(info);
                                return;
                            }
                            else {
                                found_data_chunk = true;
                            }
                        }
                        off += chunk_size;
                        _this.readBytes(off, 8).then(parse, reject);
                        return;
                    case 2:
                        var v16 = new Uint16Array(data);
                        var v32 = new Uint32Array(data);
                        if (v16[0] != 1 && v16[0] != 3) {
                            reject('not PCM wave');
                            return;
                        }
                        info.num_of_channels = v16[1];
                        info.sampling_rate = v32[1];
                        _this.bits_per_sample = v16[7];
                        _this.convert = null;
                        if (v16[0] == 1) {
                            // Integer PCM
                            if (_this.bits_per_sample == 8) {
                                _this.convert = _this.convert_from_i8;
                            }
                            else if (_this.bits_per_sample == 16) {
                                _this.convert = _this.convert_from_i16;
                            }
                            else if (_this.bits_per_sample == 24) {
                                _this.convert = _this.convert_from_i24;
                            }
                        }
                        else if (v16[0] == 3) {
                            // Floating-point PCM
                            if (_this.bits_per_sample == 32) {
                                _this.convert = _this.convert_from_f32;
                            }
                        }
                        if (!_this.convert) {
                            reject('not supported format');
                            return;
                        }
                        _this.buffer_bytes = _this.buffer_samples_per_ch *
                            (_this.bits_per_sample / 8) * info.num_of_channels;
                        _this.output = new Float32Array(_this.buffer_samples_per_ch * info.num_of_channels);
                        if (found_data_chunk) {
                            resolve(info);
                        }
                        else {
                            state = 1;
                            off += chunk_size;
                            found_fmt_chunk = true;
                            _this.readBytes(off, 8).then(parse, reject);
                        }
                        return;
                }
            };
            off = 0;
            _this.readBytes(off, 12).then(parse, reject);
        });
    };
    RiffPcmWaveReader.prototype.readBytes = function (offset, bytes) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.reader.onloadend = function (ev) {
                var ret = _this.reader.result;
                if (ret) {
                    resolve(ret);
                }
                else {
                    reject({
                        reason: _this.reader.error
                    });
                }
            };
            _this.reader.readAsArrayBuffer(_this.file.slice(offset, offset + bytes));
        });
    };
    RiffPcmWaveReader.prototype.convert_from_i8 = function (data) {
        var view = new Int8Array(data);
        var out = this.output;
        for (var i = 0; i < view.length; ++i) {
            out[i] = view[i] / 128.0;
        }
        if (view.length != out.length) {
            return [out.subarray(0, view.length), false];
        }
        else {
            return [out, false];
        }
    };
    RiffPcmWaveReader.prototype.convert_from_i16 = function (data) {
        var view = new Int16Array(data);
        var out = this.output;
        for (var i = 0; i < view.length; ++i) {
            out[i] = view[i] / 32768.0;
        }
        if (view.length != out.length) {
            return [out.subarray(0, view.length), false];
        }
        else {
            return [out, false];
        }
    };
    RiffPcmWaveReader.prototype.convert_from_i24 = function (data) {
        var v0 = new Int8Array(data);
        var v1 = new Uint8Array(data);
        var out = this.output;
        var out_samples = v0.length / 3;
        for (var i = 0; i < out_samples; ++i) {
            var lo = v1[i * 3];
            var md = v1[i * 3 + 1] << 8;
            var hi = v0[i * 3 + 2] << 16;
            out[i] = (hi | md | lo) / 8388608.0;
        }
        if (out_samples != out.length) {
            return [out.subarray(0, out_samples), false];
        }
        else {
            return [out, false];
        }
    };
    RiffPcmWaveReader.prototype.convert_from_f32 = function (data) {
        return [new Float32Array(data), true];
    };
    return RiffPcmWaveReader;
})();
/// <reference path="typings/es6-promise.d.ts" />
;
var RingBuffer = (function () {
    function RingBuffer(buffer) {
        this.wpos = 0;
        this.rpos = 0;
        this.remaining_write_data = null;
        this.buf = buffer;
    }
    RingBuffer.prototype.append = function (data) {
        /*if (this.rpos >= RingBuffer.MAX_POS && this.wpos >= RingBuffer.MAX_POS) {
            this.wpos -= RingBuffer.MAX_POS;
            this.rpos -= RingBuffer.MAX_POS;
        }*/
        var _this = this;
        return new Promise(function (resolve, reject) {
            // 書き込み処理が実施中の場合は常にrejectする
            if (_this.remaining_write_data) {
                reject();
                return;
            }
            var size = _this._append_some(data);
            if (size == data.length) {
                resolve();
                return;
            }
            // 空き容量がないので，読み込み処理が実施時に書き込むようにする
            _this.remaining_write_data = [data.subarray(size), resolve];
        });
    };
    RingBuffer.prototype.read_some = function (output) {
        var ret = this._read_some(output);
        if (this.remaining_write_data) {
            this._append_remaining_data();
            if (ret < output.length)
                ret += this._read_some(output.subarray(ret));
        }
        return ret;
    };
    RingBuffer.prototype._append_some = function (data) {
        var total_size = Math.min(data.length, this.available());
        if (total_size == 0)
            return 0;
        // 書き込み位置からバッファの終端まで書き込む
        var pos = this.wpos % this.buf.length;
        var size = Math.min(total_size, this.buf.length - pos);
        this.buf.set(data.subarray(0, size), pos);
        // バッファの終端に達したが，書き込むデータがまだあるため
        // バッファの先頭から書き込みを継続する
        if (size < total_size) {
            this.buf.set(data.subarray(size, total_size), 0);
        }
        this.wpos += total_size;
        return total_size;
    };
    RingBuffer.prototype._append_remaining_data = function () {
        var data = this.remaining_write_data[0];
        var resolve = this.remaining_write_data[1];
        this.remaining_write_data = null;
        var size = this._append_some(data);
        if (size == data.length) {
            resolve();
        }
        else {
            this.remaining_write_data = [data.subarray(size), resolve];
        }
    };
    RingBuffer.prototype._read_some = function (output) {
        var total_size = Math.min(output.length, this.size());
        if (total_size == 0)
            return 0;
        // 読み込み位置からバッファ終端方向に読み込む
        var pos = this.rpos % this.buf.length;
        var size = Math.min(total_size, this.buf.length - pos);
        output.set(this.buf.subarray(pos, pos + size), 0);
        // バッファの終端に達したが読み込むデータがまだあるため
        // バッファの先頭から読み込みを継続する
        if (size < total_size) {
            output.set(this.buf.subarray(0, total_size - size), size);
        }
        this.rpos += total_size;
        return total_size;
    };
    RingBuffer.prototype.clear = function () {
        this.rpos = this.wpos = 0;
        this.remaining_write_data = null;
    };
    RingBuffer.prototype.capacity = function () {
        return this.buf.length;
    };
    RingBuffer.prototype.size = function () {
        return this.wpos - this.rpos;
    };
    RingBuffer.prototype.available = function () {
        return this.capacity() - this.size();
    };
    RingBuffer.MAX_POS = (1 << 16);
    return RingBuffer;
})();
/// <reference path="api.d.ts" />
/// <reference path="typings/MediaStream.d.ts" />
/// <reference path="ring_buffer.ts" />
var MicrophoneReader = (function () {
    function MicrophoneReader() {
    }
    MicrophoneReader.prototype.open = function (buffer_samples_per_ch, params) {
        var _this = this;
        this.context = new AudioContext();
        return new Promise(function (resolve, reject) {
            var callback = function (strm) {
                _this.src_node = _this.context.createMediaStreamSource(strm);
                _this.ringbuf = new RingBuffer(new Float32Array(buffer_samples_per_ch * _this.src_node.channelCount * 8));
                _this.proc_node = _this.context.createScriptProcessor(0, 1, _this.src_node.channelCount);
                _this.proc_node.onaudioprocess = function (ev) {
                    _this._onaudioprocess(ev);
                };
                _this.src_node.connect(_this.proc_node);
                _this.proc_node.connect(_this.context.destination);
                _this.read_unit = buffer_samples_per_ch * _this.src_node.channelCount;
                resolve({
                    sampling_rate: _this.context.sampleRate / 2,
                    num_of_channels: _this.src_node.channelCount
                });
            };
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                }).then(callback, reject);
            }
            else {
                navigator.getUserMedia = (navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia);
                navigator.getUserMedia({
                    audio: true,
                    video: false
                }, callback, reject);
            }
        });
    };
    MicrophoneReader.prototype._onaudioprocess = function (ev) {
        var num_of_ch = ev.inputBuffer.numberOfChannels;
        var samples_per_ch = ev.inputBuffer.getChannelData(0).length;
        var data = new Float32Array(num_of_ch * samples_per_ch);
        for (var i = 0; i < num_of_ch; ++i) {
            var ch = ev.inputBuffer.getChannelData(i);
            for (var j = 0; j < samples_per_ch; ++j)
                data[j * num_of_ch + i] = ch[j];
        }
        this.ringbuf.append(data);
    };
    MicrophoneReader.prototype.read = function () {
        var _this = this;
        this.in_flight = true;
        return new Promise(function (resolve, reject) {
            var buf = new Float32Array(_this.read_unit);
            var func = function () {
                var size = _this.ringbuf.read_some(buf);
                if (size == 0) {
                    window.setTimeout(function () {
                        func();
                    }, 10);
                    return;
                }
                _this.in_flight = false;
                resolve({
                    timestamp: 0,
                    samples: buf.subarray(0, size),
                    transferable: true
                });
            };
            func();
        });
    };
    MicrophoneReader.prototype.close = function () {
    };
    return MicrophoneReader;
})();
/// <reference path="api.d.ts" />
/// <reference path="ring_buffer.ts" />
var WebAudioPlayer = (function () {
    function WebAudioPlayer() {
        this.in_writing = false;
        this.buffering = true;
        this.onneedbuffer = null;
        this.in_requesting_check_buffer = false;
    }
    WebAudioPlayer.prototype.init = function (sampling_rate, num_of_channels, period_samples, delay_periods, buffer_periods) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.context = new AudioContext();
            _this.node = _this.context.createScriptProcessor(period_samples, 0, num_of_channels);
            _this.node.onaudioprocess = function (ev) {
                _this._onaudioprocess(ev);
            };
            if (sampling_rate != _this.getActualSamplingRate()) {
                console.log('enable resampling: ' + sampling_rate + ' -> ' + _this.getActualSamplingRate());
                _this.period_samples = Math.ceil(period_samples * _this.getActualSamplingRate() / sampling_rate) * num_of_channels;
                _this.resampler = new Worker('resampler.js');
            }
            else {
                _this.period_samples = period_samples * num_of_channels;
            }
            _this.ringbuf = new RingBuffer(new Float32Array(_this.period_samples * buffer_periods));
            _this.delay_samples = _this.period_samples * delay_periods;
            if (_this.resampler) {
                _this.resampler.onmessage = function (ev) {
                    if (ev.data.status == 0) {
                        resolve();
                    }
                    else {
                        reject(ev.data);
                    }
                };
                _this.resampler.postMessage({
                    channels: num_of_channels,
                    in_sampling_rate: sampling_rate,
                    out_sampling_rate: _this.getActualSamplingRate()
                });
            }
            else {
                resolve();
            }
        });
    };
    WebAudioPlayer.prototype.enqueue = function (buf) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.in_writing) {
                reject();
                return;
            }
            _this.in_writing = true;
            var func = function (data) {
                _this.ringbuf.append(data).then(function () {
                    _this.in_writing = false;
                    _this.check_buffer();
                }, function (e) {
                    _this.in_writing = false;
                    reject(e);
                });
            };
            if (_this.resampler) {
                var transfer_list = buf.transferable ? [buf.samples.buffer] : [];
                _this.resampler.onmessage = function (ev) {
                    if (ev.data.status != 0) {
                        _this.in_writing = false;
                        reject(ev.data);
                        return;
                    }
                    func(ev.data.result);
                };
                _this.resampler.postMessage({
                    samples: buf.samples
                }, transfer_list);
            }
            else {
                func(buf.samples);
            }
        });
    };
    WebAudioPlayer.prototype._onaudioprocess = function (ev) {
        if (this.buffering) {
            this.check_buffer();
            return;
        }
        var N = ev.outputBuffer.numberOfChannels;
        var buf = new Float32Array(ev.outputBuffer.getChannelData(0).length * N);
        var size = this.ringbuf.read_some(buf) / N;
        for (var i = 0; i < N; ++i) {
            var ch = ev.outputBuffer.getChannelData(i);
            for (var j = 0; j < size; ++j)
                ch[j] = buf[j * N + i];
        }
        this.check_buffer(true);
    };
    WebAudioPlayer.prototype.check_buffer = function (useTimeOut) {
        var _this = this;
        if (useTimeOut === void 0) { useTimeOut = false; }
        if (this.in_requesting_check_buffer || !this.onneedbuffer)
            return;
        var needbuf = this.check_buffer_internal();
        if (!needbuf)
            return;
        if (useTimeOut) {
            this.in_requesting_check_buffer = true;
            window.setTimeout(function () {
                _this.in_requesting_check_buffer = false;
                if (_this.check_buffer_internal())
                    _this.onneedbuffer();
            }, 0);
        }
        else {
            this.onneedbuffer();
        }
    };
    WebAudioPlayer.prototype.check_buffer_internal = function () {
        if (this.in_writing)
            return false;
        var avail = this.ringbuf.available();
        var size = this.ringbuf.size();
        if (size >= this.delay_samples)
            this.buffering = false;
        if (this.period_samples <= avail)
            return true;
        return false;
    };
    WebAudioPlayer.prototype.start = function () {
        if (this.node) {
            this.node.connect(this.context.destination);
        }
    };
    WebAudioPlayer.prototype.stop = function () {
        if (this.node) {
            this.ringbuf.clear();
            this.buffering = true;
            this.node.disconnect();
        }
    };
    WebAudioPlayer.prototype.close = function () {
        this.stop();
        this.context = null;
        this.node = null;
    };
    WebAudioPlayer.prototype.getActualSamplingRate = function () {
        return this.context.sampleRate;
    };
    WebAudioPlayer.prototype.getBufferStatus = function () {
        return {
            delay: this.ringbuf.size(),
            available: this.ringbuf.available(),
            capacity: this.ringbuf.capacity()
        };
    };
    return WebAudioPlayer;
})();
/// <reference path="api.d.ts" />
var AudioEncoder = (function () {
    function AudioEncoder(path) {
        this.worker = new Worker(path);
    }
    AudioEncoder.prototype.setup = function (cfg) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.worker.onmessage = function (ev) {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(ev.data.packets);
            };
            _this.worker.postMessage(cfg);
        });
    };
    AudioEncoder.prototype.encode = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.worker.onmessage = function (ev) {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(ev.data.packets);
            };
            _this.worker.postMessage(data);
        });
    };
    return AudioEncoder;
})();
var AudioDecoder = (function () {
    function AudioDecoder(path) {
        this.worker = new Worker(path);
    }
    AudioDecoder.prototype.setup = function (cfg, packets) {
        var _this = this;
        var transfer_list = [];
        for (var i = 0; i < packets.length; ++i)
            transfer_list.push(packets[i].data);
        return new Promise(function (resolve, reject) {
            _this.worker.onmessage = function (ev) {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(ev.data);
            };
            _this.worker.postMessage({
                config: cfg,
                packets: packets
            }, transfer_list);
        });
    };
    AudioDecoder.prototype.decode = function (packet) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.worker.onmessage = function (ev) {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(ev.data);
            };
            _this.worker.postMessage(packet, [packet.data]);
        });
    };
    return AudioDecoder;
})();
/// <reference path="api.d.ts" />
/// <reference path="riff_pcm_wave.ts" />
/// <reference path="microphone.ts" />
/// <reference path="player.ts" />
/// <reference path="impl.ts" />
var Test = (function () {
    function Test() {
        this.player = null;
    }
    Test.prototype.setup = function () {
        var _this = this;
        document.getElementById('play').addEventListener('click', function () {
            _this.play();
        });
        document.getElementById('encdecplay').addEventListener('click', function () {
            _this.encode_decode_play();
        });
    };
    Test.prototype.play = function () {
        var _this = this;
        this.init_player();
        var _a = this.get_reader(), reader = _a[0], open_params = _a[1];
        if (!reader)
            return;
        reader.open(Test.period_size, open_params).then(function (info) {
            _this.player.onneedbuffer = function () {
                if (reader.in_flight)
                    return;
                reader.read().then(function (buf) {
                    _this.player.enqueue(buf).catch(_this.output_reject_log('ringbuf enqueue error?'));
                }, function (e) {
                    _this.output_reject_log('reader.read error')(e);
                });
            };
            _this.player.init(info.sampling_rate, info.num_of_channels, Test.period_size, Test.delay_period_count, Test.ringbuffer_period_count).then(function () {
                _this.player.start();
                window.setInterval(function () {
                    console.log(_this.player.getBufferStatus());
                }, 1000);
            }, _this.output_reject_log('player.init error'));
        }, this.output_reject_log('open error'));
    };
    Test.prototype.encode_decode_play = function () {
        var _this = this;
        this.init_player();
        var _a = this.get_reader(), reader = _a[0], open_params = _a[1];
        if (!reader)
            return;
        var working = false;
        var packet_queue = [];
        var encoder = new AudioEncoder('opus_encoder.js');
        var decoder = new AudioDecoder('opus_decoder.js');
        reader.open(Test.period_size, open_params).then(function (info) {
            var enc_cfg = {
                sampling_rate: info.sampling_rate,
                num_of_channels: info.num_of_channels,
                params: {
                    application: parseInt(document.getElementById('opus_app').value, 10),
                    sampling_rate: parseInt(document.getElementById('opus_sampling_rate').value, 10) * 1000,
                    frame_duration: parseFloat(document.getElementById('opus_frame_duration').value)
                }
            };
            encoder.setup(enc_cfg).then(function (packets) {
                decoder.setup({}, packets).then(function (info) {
                    _this.player.init(info.sampling_rate, info.num_of_channels, Test.period_size, Test.delay_period_count, Test.ringbuffer_period_count).then(function () {
                        _this.player.start();
                        window.setInterval(function () {
                            console.log(_this.player.getBufferStatus());
                        }, 1000);
                    }, _this.output_reject_log('player.init error'));
                }, _this.output_reject_log('decoder.setup error'));
            }, _this.output_reject_log('encoder.setup error'));
        }, this.output_reject_log('open error'));
        this.player.onneedbuffer = function () {
            if (reader.in_flight || working)
                return;
            working = true;
            if (packet_queue.length > 0) {
                var packet = packet_queue.shift();
                decoder.decode(packet).then(function (buf) {
                    _this.player.enqueue(buf).catch(_this.output_reject_log('ringbuf enqueue error?'));
                    working = false;
                }, _this.output_reject_log('decoder.decode error'));
            }
            else {
                reader.read().then(function (buf) {
                    encoder.encode(buf).then(function (packets) {
                        if (packets.length == 0) {
                            working = false;
                            return;
                        }
                        for (var i = 1; i < packets.length; ++i)
                            packet_queue.push(packets[i]);
                        decoder.decode(packets[0]).then(function (buf) {
                            _this.player.enqueue(buf).catch(_this.output_reject_log('ringbuf enqueue error?'));
                            working = false;
                        }, _this.output_reject_log('decoder.decode error'));
                    }, _this.output_reject_log('encoder.encode error'));
                }, _this.output_reject_log('reader.read error'));
            }
        };
    };
    Test.prototype.init_player = function () {
        if (this.player)
            this.player.close();
        this.player = new WebAudioPlayer();
    };
    Test.prototype.get_reader = function () {
        var radio_mic = document.getElementById('input_mic');
        var radio_file = document.getElementById('input_file');
        var reader = null;
        var params = null;
        if (radio_mic.checked) {
            reader = new MicrophoneReader();
            params = {};
        }
        else if (radio_file.checked) {
            var input_file = document.getElementById('input_filedata');
            if (input_file.files.length != 1) {
                alert('not choose file');
                return;
            }
            reader = new RiffPcmWaveReader();
            params = {
                file: input_file.files[0]
            };
        }
        else {
            alert('not choose mic or file');
        }
        return [reader, params];
    };
    Test.prototype.output_reject_log = function (prefix) {
        var _this = this;
        return function (e) {
            _this.player.close();
            console.log(prefix, e);
        };
    };
    Test.period_size = 1024;
    Test.delay_period_count = 4;
    Test.ringbuffer_period_count = Test.delay_period_count * 4;
    return Test;
})();
document.addEventListener('DOMContentLoaded', function () {
    var app = new Test();
    app.setup();
});
