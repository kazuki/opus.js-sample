/// <reference path="d.ts/waa.d.ts" />
var Player = (function () {
    function Player(sampling_rate, channels, bits_per_sample, is_float, buffer_size) {
        var _this = this;
        this.stop_request = false;
        this.queue = [];
        this.queue_samples = 0;
        this.queue_offset = 0;
        this.worker_busy = false;
        this.onneedbuffer = null;
        this.sampling_rate = sampling_rate;
        this.channels = channels;
        this.bits_per_sample = bits_per_sample;
        this.queue_threshold = buffer_size * 2;
        this.ctx = new AudioContext();
        this.node = this.ctx.createScriptProcessor(buffer_size, 0, channels);
        this.node.onaudioprocess = function (ev) {
            _this.onaudioprocess(ev);
        };
        this.worker = new Worker("player.worker.js");
        this.worker.onmessage = function (ev_init) {
            if (ev_init.data != 'ok') {
                _this.stop();
                console.log('player-worker initialize failed: ' + ev_init.data);
                return;
            }
            _this.worker.onmessage = function (ev) {
                _this.worker_busy = false;
                _this.queue_samples += ev.data[0].length;
                _this.queue.push(ev.data);
                if (!_this.stop_request && _this.queue_samples < _this.queue_threshold)
                    _this.onneedbuffer();
            };
        };
        this.worker.postMessage({
            'in': sampling_rate,
            'out': this.ctx.sampleRate,
            'bits': bits_per_sample,
            'ch': channels,
            'is_float': is_float,
            'quality': 5
        });
        this.start();
    }
    Player.prototype.onaudioprocess = function (ev) {
        if (this.queue.length == 0)
            return;
        var output = [];
        for (var ch = 0; ch < ev.outputBuffer.numberOfChannels; ++ch)
            output.push(ev.outputBuffer.getChannelData(ch));
        var total_samples = output[0].length;
        var copied = 0;
        while (copied < total_samples && this.queue.length > 0) {
            var copy_samples = Math.min(this.queue[0][0].length - this.queue_offset, total_samples - copied);
            for (var ch = 0; ch < output.length; ++ch) {
                output[ch].set(this.queue[0][ch].subarray(this.queue_offset, this.queue_offset + copy_samples), copied);
            }
            copied += copy_samples;
            this.queue_offset += copy_samples;
            this.queue_samples -= copy_samples;
            if (this.queue[0][0].length == this.queue_offset) {
                this.queue_offset = 0;
                this.queue.shift();
            }
        }
        if (this.stop_request) {
            this.queue_offset = 0;
            this.queue = [];
            this.stop();
            return;
        }
        else if (!this.worker_busy && this.queue_samples < this.queue_threshold) {
            this.onneedbuffer();
        }
    };
    Player.prototype.enqueue = function (data) {
        if (this.stop_request)
            return;
        this.worker_busy = true;
        this.worker.postMessage(data);
    };
    Player.prototype.start = function () {
        this.stop_request = false;
        if (this.node)
            this.node.connect(this.ctx.destination);
    };
    Player.prototype.stop = function () {
        if (!this.node)
            return;
        this.stop_request = true;
        if (this.queue.length == 0) {
            this.node.disconnect();
            console.log('disconnected AudioContext');
        }
    };
    Player.prototype.destroy = function () {
        this.stop();
        this.ctx = null;
        this.node = null;
        this.queue = null;
        if (this.worker)
            this.worker.terminate();
        this.worker = null;
    };
    Player.prototype.getOutputSamplingRate = function () {
        return this.ctx.sampleRate;
    };
    return Player;
})();
