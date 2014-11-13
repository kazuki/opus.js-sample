///<reference path="resampler.ts" />
///<reference path="opus.ts" />
importScripts("libopus_libspeexdsp.js");
importScripts("opus.js");
importScripts("resampler.js");
var RoundTripTest = (function () {
    function RoundTripTest(worker) {
        this.worker = worker;
    }
    RoundTripTest.prototype.run = function () {
        var _this = this;
        this.worker.onmessage = function (ev) {
            try {
                var cfg = ev.data;
                var ch = cfg['channels'];
                var in_sr = cfg['in_sampling_rate'];
                var opus_sr = cfg['opus_sampling_rate'];
                var fd = cfg['frame_duration'];
                var app = cfg['application'];
                _this.in_resampler = new SpeexResampler(ch, in_sr, opus_sr, 16, false);
                _this.encoder = new OpusEncoder(opus_sr, ch, app, fd);
                _this.decoder = new OpusDecoder(opus_sr, ch);
                _this.worker.onmessage = function (ev) {
                    _this.process(ev.data);
                };
                _this.worker.postMessage('ok');
            }
            catch (e) {
                _this.worker.postMessage(e.toString());
            }
        };
    };
    RoundTripTest.prototype.process = function (pcm) {
        var _this = this;
        var resampled_pcm = this.in_resampler.process_interleaved(pcm);
        var packets = this.encoder.encode_float(resampled_pcm);
        packets.forEach(function (packet) {
            _this.worker.postMessage(_this.decoder.decode_float(packet).buffer);
        });
    };
    return RoundTripTest;
})();
new RoundTripTest(this).run();
