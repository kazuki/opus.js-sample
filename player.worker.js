///<reference path="resampler.ts" />
importScripts("libspeexdsp.js");
importScripts("resampler.js");
var PlayerWorkerThread = (function () {
    function PlayerWorkerThread() {
        this.resampler = null;
    }
    PlayerWorkerThread.prototype.main = function (worker) {
        var _this = this;
        this.worker = worker;
        this.worker.onmessage = function (ev) {
            _this.oninit(ev.data);
        };
    };
    PlayerWorkerThread.prototype.oninit = function (config) {
        var _this = this;
        var failed = false;
        this.in_rate = config['in'] || 0;
        this.out_rate = config['out'] || 0;
        this.in_bits = config['bits'] || 0;
        this.channels = config['ch'] || 0;
        this.is_float = config['is_float'] ? true : false;
        var quality = config['quality'] || 5;
        try {
            this.resampler = new SpeexResampler(this.channels, this.in_rate, this.out_rate, this.in_bits, this.is_float, quality);
        }
        catch (e) {
            this.worker.postMessage('resampler init: failed (' + e + ')');
            return;
        }
        this.worker.onmessage = function (ev) {
            _this.onmessage(ev.data);
        };
        this.worker.postMessage('ok');
    };
    PlayerWorkerThread.prototype.onmessage = function (raw_input) {
        try {
            this.worker.postMessage(this.resampler.process(raw_input));
        }
        catch (e) {
            console.log(e);
        }
    };
    return PlayerWorkerThread;
})();
new PlayerWorkerThread().main(this);
