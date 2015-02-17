///<reference path="resampler.ts" />
importScripts("libspeexdsp.js");
importScripts("resampler.js");

class PlayerWorkerThread {
    worker: any;
    resampler: SpeexResampler = null;

    in_rate: number;
    out_rate: number;
    in_bits:  number;
    channels: number;
    is_float: boolean;

    main(worker: Worker): void {
        this.worker = worker;
        this.worker.onmessage = (ev: MessageEvent) => {
            this.oninit(ev.data);
        };
    }

    oninit(config: any) {
        var failed = false;

        this.in_rate  = config['in']   || 0;
        this.out_rate = config['out']  || 0;
        this.in_bits  = config['bits'] || 0;
        this.channels = config['ch']   || 0;
        this.is_float = config['is_float'] ? true : false;
        var quality = config['quality'] || 5;

        try {
            this.resampler = new SpeexResampler(this.channels, this.in_rate, this.out_rate,
                                                this.in_bits, this.is_float, quality);
        } catch (e) {
            this.worker.postMessage('resampler init: failed (' + e + ')');
            return;
        }

        this.worker.onmessage = (ev: MessageEvent) => {
            this.onmessage(<ArrayBuffer>ev.data);
        };


        this.worker.postMessage('ok');
    }

    onmessage(raw_input: ArrayBuffer) {
        try {
            this.worker.postMessage(this.resampler.process(raw_input));
        } catch (e) {
            console.log(e);
        }
    }
}

new PlayerWorkerThread().main(this);
