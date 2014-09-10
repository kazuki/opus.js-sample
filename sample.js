/// <reference path="riff_pcm_wave_reader.ts" />
/// <reference path="player.ts" />
/// <reference path="opus.ts" />
/// <reference path="d.ts/waa.d.ts" />
var _sample_instance;

var Sample = (function () {
    function Sample() {
        this.reader = null;
        this.player = null;
        this.file_io_buffer_size = 65536 * 2;
        this.input_file_element = document.getElementById('input_file');
        this.wav_info_element = document.getElementById('wav_info');
    }
    Sample.prototype.main = function () {
        this.executeSelfTest();
        this.registerFileSelectHandler();
        this.registerPlayButtonHandler();
        this.registerOpusBenchButtonHandler();
        this.registerOpusEncDecPlayButtonHandler();
    };

    Sample.prototype.registerFileSelectHandler = function () {
        var _this = this;
        this.input_file_element.addEventListener('change', function () {
            _this.reader = new RiffPcmWaveReader();
            while (_this.wav_info_element.firstChild)
                _this.wav_info_element.removeChild(_this.wav_info_element.firstChild);
            _this.reader.onerror = function (reason) {
                _this.wav_info_element.appendChild(document.createTextNode('error: ' + reason));
            };
            _this.reader.onopened = function () {
                _this.wav_info_element.appendChild(document.createTextNode('file info: RIFF PCM Wave. ' + _this.reader.getSamplingRate() + 'Hz ' + _this.reader.getBitsPerSample() + 'bits ' + _this.reader.getChannels() + 'ch ' + Math.floor(_this.reader.getDataChunkBytes() / (_this.reader.getSamplingRate() * _this.reader.getChannels() * (_this.reader.getBitsPerSample() / 8))) + 'sec'));
            };
            _this.reader.open(_this.input_file_element.files[0]);
        });
    };

    Sample.prototype.registerPlayButtonHandler = function () {
        var _this = this;
        var status_element = document.getElementById('play_status');
        var update_status = function (txt) {
            status_element.replaceChild(document.createTextNode(txt), status_element.firstChild);
        };
        status_element.appendChild(document.createTextNode(''));

        document.getElementById('play').addEventListener('click', function () {
            if (!_this.reader || !_this.reader.isOpened()) {
                alert('先にWaveファイルを開いてください');
                return;
            }
            if (_this.player)
                _this.player.destroy();
            _this.player = new Player(_this.reader.getSamplingRate(), _this.reader.getChannels(), _this.reader.getBitsPerSample(), false, 8192);
            update_status((_this.reader.getSamplingRate() / 1000) + 'kHz =>' + (_this.player.getOutputSamplingRate() / 1000) + 'kHz');
            _this.player.onneedbuffer = function () {
                if (_this.reader.isBusy())
                    return;
                _this.reader.read(_this.file_io_buffer_size);
            };
            _this.reader.onloadend = function (ev) {
                if (ev.target.readyState == 2) {
                    if (ev.target.result.byteLength == 0) {
                        _this.player.stop();
                        console.log('EOF');
                        return;
                    }
                    _this.player.enqueue(ev.target.result);
                }
            };
            _this.reader.seek(0);
            _this.reader.read(_this.file_io_buffer_size);
        });
    };

    Sample.prototype.registerOpusBenchButtonHandler = function () {
        var _this = this;
        var status_element = document.getElementById('opus_bench_status');
        var update_status = function (txt) {
            status_element.replaceChild(document.createTextNode(txt), status_element.firstChild);
        };
        status_element.appendChild(document.createTextNode(''));

        document.getElementById('opus_bench').addEventListener('click', function () {
            if (!_this.reader || !_this.reader.isOpened()) {
                alert('先にWaveファイルを開いてください');
                return;
            }

            var worker = new Worker('opus.worker.js');
            var total_bytes = _this.reader.getDataChunkBytes();
            var length_sec = total_bytes / (_this.reader.getSamplingRate() * _this.reader.getChannels() * (_this.reader.getBitsPerSample() / 8));
            var total_packets = Math.ceil(length_sec * 1000 / 20);
            var start_time;
            var encoded_bytes = 0;
            var opus_packets = [];
            var frame_duration_in_sec = 20 / 1000;
            var encmsg;

            var decoder_bench = function () {
                var counter = 0;
                start_time = Date.now();
                worker = new Worker('opus.worker.js');
                worker.onmessage = function (ev) {
                    if (!(ev.data instanceof String)) {
                        counter++;
                        if (counter < opus_packets.length) {
                            update_status(encmsg + ', decoding: ' + Math.floor(counter * 100 / opus_packets.length) + '%');
                        } else {
                            var time = (Date.now() - start_time) / 1000.0;
                            update_status(encmsg + ', decoded: ' + time + 'sec(speed:x' + Math.round(length_sec / time) + ')');
                            worker.terminate();
                        }
                    } else {
                        if (ev.data != 'ok')
                            update_status(encmsg + ', decode failed: ' + ev.data);
                    }
                };
                worker.postMessage({
                    'type': 'decoder',
                    'sampling_rate': _this.reader.getSamplingRate(),
                    'channels': _this.reader.getChannels(),
                    'is_float': false
                });
                opus_packets.forEach(function (packet) {
                    worker.postMessage(packet);
                    return;
                });
            };

            _this.reader.onloadend = function (ev) {
                if (ev.target.readyState == 2) {
                    if (ev.target.result.byteLength == 0) {
                        worker.postMessage(new ArrayBuffer(0));
                        return;
                    }
                    worker.postMessage(ev.target.result);
                    _this.reader.read(_this.file_io_buffer_size);
                }
            };
            worker.onmessage = function (ev) {
                if (ev.data != 'ok') {
                    update_status(ev.data);
                    return;
                }

                update_status('encoding...');
                worker.onmessage = function (ev) {
                    var packet = ev.data;
                    if (packet.byteLength == 0) {
                        var time = (Date.now() - start_time) / 1000.0;
                        encmsg = 'encoded: ' + time + 'sec(speed:x' + Math.round(length_sec / time) + ')';
                        update_status(encmsg);
                        worker.terminate();
                        decoder_bench();
                    } else {
                        encoded_bytes += packet.byteLength;
                        opus_packets.push(packet);
                        update_status('encoding: ' + Math.floor(opus_packets.length / total_packets * 100) + '%. avg bitrate=' + Math.floor(encoded_bytes * 8 / opus_packets.length / frame_duration_in_sec / 1000) + 'kbps');
                    }
                };
                start_time = Date.now();
                _this.reader.seek(0);
                _this.reader.read(_this.file_io_buffer_size);
            };
            worker.postMessage({
                'type': 'encoder',
                'sampling_rate': _this.reader.getSamplingRate(),
                'channels': _this.reader.getChannels(),
                'is_float': false
            });
        });
    };

    Sample.prototype.registerOpusEncDecPlayButtonHandler = function () {
        var _this = this;
        document.getElementById('encdecplay').addEventListener('click', function () {
            if (!_this.reader || !_this.reader.isOpened()) {
                alert('先にWaveファイルを開いてください');
                return;
            }
            if (_this.player)
                _this.player.destroy();

            var opus_sampling_rate = parseInt(document.getElementById('edp_sampling_rate').value) * 1000;
            var opus_frame_duration = parseFloat(document.getElementById('edp_duration').value);
            var opus_app_name = document.getElementById('edp_app').value;
            var opus_app = (function () {
                if (opus_app_name == 'voip')
                    return 2048 /* VoIP */;
                if (opus_app_name == 'audio')
                    return 2049 /* Audio */;
                if (opus_app_name == 'lowdelay')
                    return 2051 /* RestrictedLowDelay */;
                return 2049 /* Audio */;
            })();

            _this._opusEncDecPlay(opus_sampling_rate, opus_frame_duration, opus_app);
        });
    };

    Sample.prototype._opusEncDecPlay = function (opus_sampling_rate, opus_frame_duration, opus_app) {
        var _this = this;
        var worker = new Worker('sample.roundtrip.js');
        this.player = new Player(opus_sampling_rate, this.reader.getChannels(), 32, true, 8192);

        worker.onmessage = function (ev) {
            if (ev.data != 'ok') {
                console.log(ev.data);
                _this.player.stop();
                worker.terminate();
                return;
            }
            worker.onmessage = function (ev) {
                _this.player.enqueue(ev.data);
            };
            _this.reader.seek(0);
            _this.reader.read(_this.file_io_buffer_size);
        };
        worker.postMessage({
            'channels': this.reader.getChannels(),
            'in_sampling_rate': this.reader.getSamplingRate(),
            'opus_sampling_rate': opus_sampling_rate,
            'frame_duration': opus_frame_duration,
            'application': opus_app
        });

        this.player.onneedbuffer = function () {
            if (_this.reader.isBusy())
                return;
            _this.reader.read(_this.file_io_buffer_size);
        };
        this.reader.onloadend = function (ev) {
            if (ev.target.readyState == 2) {
                if (ev.target.result.byteLength == 0) {
                    _this.player.stop();
                    console.log('EOF');
                    return;
                }
                worker.postMessage(ev.target.result);
            }
        };
    };

    Sample.prototype.executeSelfTest = function () {
        var tests = {
            'version': function () {
                return Opus.getVersion();
            },
            'encoder-init': function () {
                try  {
                    new OpusEncoder(48000, 2, 2049 /* Audio */).destroy();
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'decoder-init': function () {
                try  {
                    new OpusDecoder(48000, 2).destroy();
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'webaudio': function () {
                if (AudioContext)
                    return true;
                return false;
            }
        };

        var failed = false;
        var msg0 = '';
        var msg1 = '';
        for (var name in tests) {
            var ret = false;
            try  {
                ret = tests[name]();
            } catch (e) {
            }
            if (ret === true) {
                ret = 'ok';
            } else if (ret === false) {
                ret = 'failed';
                failed = true;
            }
            if (name === 'version') {
                msg0 = 'version: ' + ret;
            } else {
                msg1 += '  ' + name + ': ' + ret + '\n';
            }
        }

        var e = document.getElementById('info');
        while (e.firstChild)
            e.removeChild(e.firstChild);
        e.appendChild(document.createTextNode(msg0 + '\n\nself test: ' + (failed ? 'failed' : 'ok') + '\n' + msg1));
        return !failed;
    };
    return Sample;
})();

document.addEventListener("DOMContentLoaded", function (event) {
    _sample_instance = new Sample();
    _sample_instance.main();
});
