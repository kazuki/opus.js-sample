///<reference path="typings/emscripten.d.ts" />
/// <reference path="speex_resampler.ts" />

class ResamplingWorker {
    worker: Worker;
    resampler: SpeexResampler = null;

    constructor(worker: Worker) {
        this.worker = worker;
        this.worker.onmessage = (e: MessageEvent) => {
            this.setup(<any>e.data);
        };
    }

    setup(config: any) {
        try {
            this.resampler = new SpeexResampler(
                config.channels,
                config.in_sampling_rate,
                config.out_sampling_rate,
                config.quality || 5
            );
            this.worker.postMessage({
                status: 0
            });
            this.worker.onmessage = (e: MessageEvent) => {
                this.process(<Float32Array>e.data.samples);
            };
        } catch (e) {
            this.worker.postMessage({
                status: -1,
                reason: e
            });
        }
    }

    process(input: Float32Array) {
        try {
            var ret = new Float32Array(this.resampler.process(input));
            this.worker.postMessage({
                status: 0,
                result: ret,
            }, [ret.buffer]);
        } catch (e) {
            this.worker.postMessage({
                status: -1,
                reason: e
            });
        }
    }
}
new ResamplingWorker(this);
