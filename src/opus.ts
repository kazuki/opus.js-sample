///<reference path="refs/asm.d.ts" />
///<reference path="refs/libopus.d.ts" />

enum OpusApplication {
    VoIP = 2048,
    Audio = 2049,
    RestrictedLowDelay = 2051
}

enum OpusError {
    OK = 0,
    BadArgument = -1,
    BufferTooSmall = -2,
    InternalError = -3,
    InvalidPacket = -4,
    Unimplemented = -5,
    InvalidState = -6,
    AllocFail = -7
}

class Opus {
    static getVersion(): string {
        var ptr = _opus_get_version_string();
        return Pointer_stringify(ptr);
    }

    static getMaxFrameSize(numberOfStreams: number = 1): number {
        return (1275 * 3 + 7) * numberOfStreams;
    }

    static getMinFrameDuration(): number { return 2.5; }
    static getMaxFrameDuration(): number { return 60; }
    static validFrameDuration(x: number): boolean {
        return [2.5, 5, 10, 20, 40, 60].some((element:number):boolean => {
            return element == x;
        });
    }

    static getMaxSamplesPerChannel(sampling_rate: number): number {
        return sampling_rate / 1000 * Opus.getMaxFrameDuration();
    }
}

class OpusEncoder {
    handle: number = 0;
    frame_size: number = 0;

    in_ptr: number = 0;
    in_i16: Int16Array;
    in_f32: Float32Array;
    in_off: number = 0;
    in_len: number;
    out_ptr: number = 0;
    out_bytes: number;
    out_buf: Uint8Array;

    constructor(sampling_rate: number, channels: number, app: OpusApplication, frame_duration: number = 20) {
        if (!Opus.validFrameDuration(frame_duration))
            throw 'invalid frame duration';

        this.frame_size = sampling_rate * frame_duration / 1000;

        var err_ptr = allocate(4, 'i32', ALLOC_STACK);
        this.handle = _opus_encoder_create(sampling_rate, channels, app, err_ptr);
        if (getValue(err_ptr, 'i32') != OpusError.OK)
            throw 'opus_encoder_create failed: ' + getValue(err_ptr, 'i32');

        this.in_ptr = _malloc(this.frame_size * channels * 4);
        this.in_len = this.frame_size * channels;
        this.in_i16 = HEAP16.subarray(this.in_ptr >> 1, (this.in_ptr >> 1) + this.in_len);
        this.in_f32 = HEAPF32.subarray(this.in_ptr >> 2, (this.in_ptr >> 2) + this.in_len);
        this.out_bytes = Opus.getMaxFrameSize();
        this.out_ptr = _malloc(this.out_bytes);
        this.out_buf = HEAPU8.subarray(this.out_ptr, this.out_ptr + this.out_bytes);
    }

    encode(pcm: Int16Array): Array<ArrayBuffer> {
        var output: Array<ArrayBuffer> = [];
        var pcm_off = 0;
        while (pcm.length - pcm_off >= this.in_len - this.in_off) {
            if (this.in_off > 0) {
                this.in_i16.set(pcm.subarray(pcm_off, pcm_off + this.in_len - this.in_off), this.in_off);
                pcm_off += this.in_len - this.in_off;
                this.in_off = 0;
            } else {
                this.in_i16.set(pcm.subarray(pcm_off, pcm_off + this.in_len));
                pcm_off += this.in_len;
            }
            var ret = _opus_encode(this.handle, this.in_ptr, this.frame_size, this.out_ptr, this.out_bytes);
            if (ret <= 0)
                throw 'opus_encode failed: ' + ret;
            var packet = new ArrayBuffer(ret);
            new Uint8Array(packet).set(this.out_buf.subarray(0, ret));
            output.push(packet);
        }
        if (pcm_off < pcm.length) {
            this.in_i16.set(pcm.subarray(pcm_off));
            this.in_off = pcm.length - pcm_off;
        }
        return output;
    }

    encode_float(pcm: Float32Array): Array<ArrayBuffer> {
        var output: Array<ArrayBuffer> = [];
        var pcm_off = 0;
        while (pcm.length - pcm_off >= this.in_len - this.in_off) {
            if (this.in_off > 0) {
                this.in_f32.set(pcm.subarray(pcm_off, pcm_off + this.in_len - this.in_off), this.in_off);
                pcm_off += this.in_len - this.in_off;
                this.in_off = 0;
            } else {
                this.in_f32.set(pcm.subarray(pcm_off, pcm_off + this.in_len));
                pcm_off += this.in_len;
            }
            var ret = _opus_encode_float(this.handle, this.in_ptr, this.frame_size, this.out_ptr, this.out_bytes);
            if (ret <= 0)
                throw 'opus_encode failed: ' + ret;
            var packet = new ArrayBuffer(ret);
            new Uint8Array(packet).set(this.out_buf.subarray(0, ret));
            output.push(packet);
        }
        if (pcm_off < pcm.length) {
            this.in_f32.set(pcm.subarray(pcm_off));
            this.in_off = pcm.length - pcm_off;
        }
        return output;
    }

    encode_final(): ArrayBuffer {
        if (this.in_off == 0)
            return new ArrayBuffer(0);

        for (var i = this.in_off; i < this.in_len; ++i)
            this.in_i16[i] = 0;

        var ret = _opus_encode(this.handle, this.in_ptr, this.frame_size, this.out_ptr, this.out_bytes);
        if (ret <= 0)
            throw 'opus_encode failed: ' + ret;
        var packet = new ArrayBuffer(ret);
        new Uint8Array(packet).set(this.out_buf.subarray(0, ret));
        return packet;
    }

    encode_float_final(): ArrayBuffer {
        if (this.in_off == 0)
            return new ArrayBuffer(0);

        for (var i = this.in_off; i < this.in_len; ++i)
            this.in_f32[i] = 0;

        var ret = _opus_encode_float(this.handle, this.in_ptr, this.frame_size, this.out_ptr, this.out_bytes);
        if (ret <= 0)
            throw 'opus_encode failed: ' + ret;
        var packet = new ArrayBuffer(ret);
        new Uint8Array(packet).set(this.out_buf.subarray(0, ret));
        return packet;
    }

    destroy(): void {
        if (!this.handle) return;
        _opus_encoder_destroy(this.handle);
        _free(this.in_ptr);
        this.handle = 
            this.in_ptr = 0;
    }
}

class OpusDecoder {
    handle: number = 0;
    channels: number;

    in_ptr: number = 0;
    in_buf: Uint8Array;
    out_ptr: number = 0;
    out_len: number;
    out_i16: Int16Array;
    out_f32: Float32Array;

    constructor(sampling_rate: number, channels: number) {
        this.channels = channels;
        var err_ptr = allocate(4, 'i32', ALLOC_STACK);
        this.handle = _opus_decoder_create(sampling_rate, channels, err_ptr);
        if (getValue(err_ptr, 'i32') != OpusError.OK)
            throw 'opus_decoder_create failed: ' + getValue(err_ptr, 'i32');

        this.in_ptr = _malloc(Opus.getMaxFrameSize(channels));
        this.in_buf = HEAPU8.subarray(this.in_ptr, this.in_ptr + Opus.getMaxFrameSize(channels));
        this.out_len = Opus.getMaxSamplesPerChannel(sampling_rate);
        var out_bytes = this.out_len * channels * 4;
        this.out_ptr = _malloc(out_bytes);
        this.out_i16 = HEAP16.subarray(this.out_ptr >> 1, (this.out_ptr + out_bytes) >> 1);
        this.out_f32 = HEAPF32.subarray(this.out_ptr >> 2, (this.out_ptr + out_bytes) >> 2);
    }

    decode(packet: ArrayBuffer): Int16Array {
        this.in_buf.set(new Uint8Array(packet));
        var ret = _opus_decode(this.handle, this.in_ptr, packet.byteLength,
                               this.out_ptr, this.out_len, 0);
        if (ret < 0)
            throw 'opus_decode failed: ' + ret;
        var samples = new Int16Array(ret * this.channels);
        samples.set(this.out_i16.subarray(0, samples.length));
        return samples;
    }

    decode_float(packet: ArrayBuffer): Float32Array {
        this.in_buf.set(new Uint8Array(packet));
        var ret = _opus_decode_float(this.handle, this.in_ptr, packet.byteLength,
                                     this.out_ptr, this.out_len, 0);
        if (ret < 0)
            throw 'opus_decode failed: ' + ret;
        var samples = new Float32Array(ret * this.channels);
        samples.set(this.out_f32.subarray(0, samples.length));
        return samples;
    }

    destroy(): void {
        if (!this.handle) return;
        _opus_decoder_destroy(this.handle);
        _free(this.in_ptr);
        _free(this.out_ptr);
        this.handle = this.in_ptr = this.out_ptr = 0;
    }
}
