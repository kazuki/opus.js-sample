///<reference path="opus.ts" />
importScripts("libopus.js");
importScripts("opus.js");

var OpusWorker = (function () {
    function OpusWorker(worker) {
        var _this = this;
        this.encoder = null;
        this.decoder = null;
        this.worker = worker;
        this.worker.onmessage = function (e) {
            try  {
                _this.recvInitMsg(e.data);
            } catch (e) {
                _this.worker.postMessage('init failed: ' + e);
            }
        };
    }
    OpusWorker.prototype.recvInitMsg = function (init) {
        var _this = this;
        var type = init['type'];
        var samplingRate = init['sampling_rate'];
        var is_float = init['is_float'];
        var channels = init['channels'];
        var frame_duration = init['frame_duration'] || 20;

        if (type == 'encoder') {
            this.encoder = new OpusEncoder(samplingRate, channels, 2049 /* Audio */, frame_duration);
            if (is_float) {
                this.worker.onmessage = function (e) {
                    try  {
                        _this.encode_f32(new Float32Array(e.data));
                    } catch (e) {
                        _this.worker.postMessage('encode failed:' + e);
                    }
                };
            } else {
                this.worker.onmessage = function (e) {
                    try  {
                        _this.encode_i16(new Int16Array(e.data));
                    } catch (e) {
                        _this.worker.postMessage('encode failed:' + e);
                    }
                };
            }
        } else if (type == 'decoder') {
            this.decoder = new OpusDecoder(samplingRate, channels);
            if (is_float) {
                this.worker.onmessage = function (e) {
                    try  {
                        _this.worker.postMessage(_this.decoder.decode_float(e.data));
                    } catch (e) {
                        _this.worker.postMessage('decode failed:' + e);
                    }
                };
            } else {
                this.worker.onmessage = function (e) {
                    try  {
                        _this.worker.postMessage(_this.decoder.decode(e.data));
                    } catch (e) {
                        _this.worker.postMessage('decode failed:' + e);
                    }
                };
            }
        } else {
            throw 'unknown type';
        }

        this.worker.postMessage('ok');
    };

    OpusWorker.prototype.encode_i16 = function (pcm) {
        var _this = this;
        if (pcm.length == 0) {
            var lastPacket = this.encoder.encode_final();
            this.worker.postMessage(lastPacket);
            if (lastPacket.byteLength != 0)
                this.worker.postMessage(new ArrayBuffer(0));
            this.encoder.destroy();
            this.encoder = null;
            return;
        }
        var output = this.encoder.encode(pcm);
        output.forEach(function (packet) {
            _this.worker.postMessage(packet);
        });
    };

    OpusWorker.prototype.encode_f32 = function (pcm) {
    };
    return OpusWorker;
})();

new OpusWorker(this);
