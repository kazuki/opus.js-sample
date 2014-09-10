///<reference path="opus.ts" />
importScripts("libopus.js");
importScripts("opus.js");

class OpusWorker {
    worker: Worker;
    encoder: OpusEncoder = null;
    decoder: OpusDecoder = null;

    constructor(worker: Worker) {
        this.worker = worker;
        this.worker.onmessage = (e: MessageEvent) => {
            try {
                this.recvInitMsg(e.data);
            } catch (e) {
                this.worker.postMessage('init failed: ' + e);
            }
        };
    }

    private recvInitMsg(init:any) {
        var type:string = init['type'];
        var samplingRate:number = init['sampling_rate'];
        var is_float:boolean = init['is_float'];
        var channels:number = init['channels'];
        var frame_duration:number = init['frame_duration'] || 20;

        if (type == 'encoder') {
            this.encoder = new OpusEncoder(samplingRate, channels, OpusApplication.Audio, frame_duration);
            if (is_float) {
                this.worker.onmessage = (e: MessageEvent) => {
                    try {
                        this.encode_f32(new Float32Array(<ArrayBuffer>e.data));
                    } catch (e) {
                        this.worker.postMessage('encode failed:' + e);
                    }
                };
            } else {
                this.worker.onmessage = (e: MessageEvent) => {
                    try {
                        this.encode_i16(new Int16Array(<ArrayBuffer>e.data));
                    } catch (e) {
                        this.worker.postMessage('encode failed:' + e);
                    }
                };
            }
        } else if (type == 'decoder') {
            this.decoder = new OpusDecoder(samplingRate, channels);
            if (is_float) {
                this.worker.onmessage = (e: MessageEvent) => {
                    try {
                        this.worker.postMessage(this.decoder.decode_float(<ArrayBuffer>e.data));
                    } catch (e) {
                        this.worker.postMessage('decode failed:' + e);
                    }
                };
            } else {
                this.worker.onmessage = (e: MessageEvent) => {
                    try {
                        this.worker.postMessage(this.decoder.decode(<ArrayBuffer>e.data));
                    } catch (e) {
                        this.worker.postMessage('decode failed:' + e);
                    }
                };
            }
        } else {
            throw 'unknown type';
        }

        this.worker.postMessage('ok');
    }

    private encode_i16(pcm: Int16Array) {
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
        output.forEach(packet => {
            this.worker.postMessage(packet);
        });
    }

    private encode_f32(pcm: Float32Array) {
    }
}

new OpusWorker(this);
