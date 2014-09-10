///<reference path="resampler.ts" />
///<reference path="opus.ts" />

importScripts("libopus_libspeexdsp.js");
importScripts("opus.js");
importScripts("resampler.js");

class RoundTripTest {
    worker: Worker;

    in_resampler: SpeexResampler;
    encoder: OpusEncoder;
    decoder: OpusDecoder;

    constructor(worker: Worker) {
        this.worker = worker;
    }

    run():void {
        this.worker.onmessage = (ev) => {
            try {
                var cfg:any = ev.data;
                var ch = <number>cfg['channels'];
                var in_sr = <number>cfg['in_sampling_rate'];
                var opus_sr = <number>cfg['opus_sampling_rate'];
                var fd = <number>cfg['frame_duration'];
                var app = <OpusApplication>cfg['application'];

                this.in_resampler = new SpeexResampler(
                    ch, in_sr, opus_sr, 16, false
                );
                this.encoder = new OpusEncoder(
                    opus_sr, ch, app, fd
                );
                this.decoder = new OpusDecoder(
                    opus_sr, ch
                );
                this.worker.onmessage = (ev) => {
                    this.process(ev.data);
                };

                this.worker.postMessage('ok');
            } catch (e) {
                this.worker.postMessage(e);
            }
        };
    }

    process(pcm: ArrayBuffer): void {
        var resampled_pcm = this.in_resampler.process_interleaved(pcm);
        var packets = this.encoder.encode_float(resampled_pcm);
        packets.forEach(packet => {
            this.worker.postMessage(this.decoder.decode_float(packet).buffer);
        });
    }
}

new RoundTripTest(this).run();
