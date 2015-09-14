/// <reference path="api.d.ts" />
/// <reference path="speex_resampler.ts" />

declare function _opus_encoder_create(
    sampling_rate: number, channels: number, app: any, error_ptr: number): number;
declare function _opus_encode_float(
    handle: number, pcm: number, frame_size: number, data: number, max_data_bytes: number): number;
declare function _opus_encoder_destroy(handle: number): void;

class OpusEncoder {
    worker: Worker;
    handle: number;
    resampler: SpeexResampler = null;
    frame_size: number;
    channels: number;
    buf: Float32Array;
    buf_ptr: number;
    buf_pos: number = 0;
    out: Uint8Array;
    out_ptr: number;

    constructor(worker: Worker) {
        this.worker = worker;
        this.worker.onmessage = (ev) => {
            this.setup(ev.data);
        };
    }

    setup(config: IAudioEncoderConfig) {
        var err = Module._malloc(4);
        var app = config.params.application || 2049 /*AUDIO*/;
        var sampling_rate = config.params.sampling_rate || config.sampling_rate;
        var frame_duration = config.params.frame_duration || 20;
        if ([2.5, 5, 10, 20, 40, 60].indexOf(frame_duration) < 0) {
            this.worker.postMessage({
                status: -1,
                reason: 'invalid frame duration',
            });
            return;
        }
        this.frame_size = sampling_rate * frame_duration / 1000;
        this.channels = config.num_of_channels;
        this.handle = _opus_encoder_create(
            sampling_rate, config.num_of_channels, app, err);
        if (Module.getValue(err, 'i32') != 0) {
            this.worker.postMessage({
                status: Module.getValue(err, 'i32')
            });
            return;
        }
        if (sampling_rate != config.sampling_rate) {
            try {
                this.resampler = new SpeexResampler(
                    config.num_of_channels, config.sampling_rate, sampling_rate);
            } catch (e) {
                this.worker.postMessage({
                    status: -1,
                    reason: e,
                });
                return;
            }
        }
        var buf_size = 4 * this.frame_size * this.channels;
        this.buf_ptr = Module._malloc(buf_size);
        this.buf = Module.HEAPF32.subarray(this.buf_ptr / 4,
                                           (this.buf_ptr + buf_size) / 4);
        var out_size = 1275 * 3 + 7;
        this.out_ptr = Module._malloc(out_size);
        this.out = Module.HEAPU8.subarray(this.out_ptr,
                                          this.out_ptr + out_size);
        this.worker.onmessage = (ev) => {
            this.encode(ev.data);
        };

        // https://wiki.xiph.org/OggOpus
        var opus_header_buf = new ArrayBuffer(19);
        var view8 = new Uint8Array(opus_header_buf);
        var view32 = new Uint32Array(opus_header_buf, 12, 1);
        var magic = 'OpusHead';
        for (var i = 0; i < magic.length; ++i)
            view8[i] = magic.charCodeAt(i);
        view8[8] = 1; // version=1
        view8[9] = this.channels;
        view8[10] = view8[11] = 0; // pre-skip
        view32[0] = sampling_rate; // (informational only)
        view8[16] = view8[17] = 0; // gain (0 filled)
        view8[18] = 0; // one stream
        this.worker.postMessage({
            status: 0,
            packets: [{
                data: opus_header_buf
            }]
        }, [opus_header_buf]);
    }

    encode(data: IAudioBuffer) {
        var samples: Float32Array = data.samples;
        if (this.resampler) {
            try {
                samples = this.resampler.process(samples);
            } catch (e) {
                this.worker.postMessage({
                    status: -1,
                    reason: e,
                });
                return;
            }
        }

        var packets: Array<Packet> = [];
        var transfer_list: Array<ArrayBuffer> = [];
        while (samples && samples.length > 0) {
            var size = Math.min(samples.length, this.buf.length - this.buf_pos);
            this.buf.set(samples.subarray(0, size), this.buf_pos);
            this.buf_pos += size;
            samples = samples.subarray(size);

            if (this.buf_pos == this.buf.length) {
                this.buf_pos = 0;
                var ret = _opus_encode_float(this.handle, this.buf_ptr, this.frame_size, this.out_ptr, this.out.byteLength);
                if (ret < 0) {
                    this.worker.postMessage({
                        status: ret
                    });
                    return;
                }
                var packet: Packet = {
                    data: new Uint8Array(this.out.subarray(0, ret)).buffer
                };
                packets.push(packet);
                transfer_list.push(packet.data);
            }
        }
        this.worker.postMessage({
            status: 0,
            packets: packets
        }, transfer_list);
    }
}
new OpusEncoder(this);
