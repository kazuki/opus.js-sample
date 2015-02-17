/// <reference path="refs/waa.d.ts" />

class Player {

    private ctx: AudioContext;
    private node: ScriptProcessorNode;
    private sampling_rate: number;
    private channels: number;
    private bits_per_sample: number;

    private stop_request: boolean = false;
    private queue: Array<Array<Float32Array>> = [];
    private queue_samples = 0;
    private queue_threshold: number;
    private queue_offset = 0;
    private worker: Worker;
    private worker_busy = false;

    onneedbuffer: ()=>void = null;

    constructor(sampling_rate: number, channels: number, bits_per_sample: number,
                is_float: boolean, buffer_size: number) {
        this.sampling_rate = sampling_rate;
        this.channels = channels;
        this.bits_per_sample = bits_per_sample;
        this.queue_threshold = buffer_size * 2;
        this.ctx = new AudioContext();
        this.node = this.ctx.createScriptProcessor(
            buffer_size, 0, channels);
        this.node.onaudioprocess = (ev) => {
            this.onaudioprocess(ev);
        };

        this.worker = new Worker("player.worker.js");
        this.worker.onmessage = (ev_init) => {
            if (ev_init.data != 'ok') {
                this.stop();
                console.log('player-worker initialize failed: ' + ev_init.data);
                return;
            }

            this.worker.onmessage = (ev) => {
                this.worker_busy = false;
                this.queue_samples += ev.data[0].length;
                this.queue.push(ev.data);
                if (!this.stop_request && this.queue_samples < this.queue_threshold)
                    this.onneedbuffer();
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

    private onaudioprocess(ev): void {
        if (this.queue.length == 0) return;

        var output: Array<Float32Array> = [];
        for (var ch = 0; ch < ev.outputBuffer.numberOfChannels; ++ch)
            output.push(ev.outputBuffer.getChannelData(ch));

        var total_samples = output[0].length;
        var copied = 0;
        while (copied < total_samples && this.queue.length > 0) {
            var copy_samples = Math.min(this.queue[0][0].length - this.queue_offset,
                                        total_samples - copied);
            for (var ch = 0; ch < output.length; ++ch) {
                output[ch].set(this.queue[0][ch].subarray(this.queue_offset,
                                                          this.queue_offset + copy_samples), copied);
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
        } else if (!this.worker_busy && this.queue_samples < this.queue_threshold) {
            this.onneedbuffer();
        }
    }

    enqueue(data: ArrayBuffer): void {
        if (this.stop_request) return;
        this.worker_busy = true;
        this.worker.postMessage(data);
    }

    start(): void {
        this.stop_request = false;
        if (this.node)
            this.node.connect(this.ctx.destination);
    }

    stop(): void {
        if (!this.node) return;

        this.stop_request = true;
        if (this.queue.length == 0) {
            this.node.disconnect();
            console.log('disconnected AudioContext');
        }
    }

    destroy(): void {
        this.stop();
        this.ctx = null;
        this.node = null;
        this.queue = null;
        if (this.worker)
            this.worker.terminate();
        this.worker = null;
    }

    getOutputSamplingRate(): number {
        return this.ctx.sampleRate;
    }

}
