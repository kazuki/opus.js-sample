///<reference path="refs/asm.d.ts" />
///<reference path="refs/libspeexdsp.d.ts" />

class SpeexResampler {

    private handle: number = 0;
    private channels: number;
    private in_rate: number;
    private out_rate: number;
    private bits_per_sample: number;

    private copy_to_buf: (input:ArrayBuffer, ch:number, samples: number) => void;

    private in_ptr: number = 0;
    private out_ptr: number = 0;
    private in_capacity: number = 0;
    private in_len_ptr: number = 0;
    private out_len_ptr: number = 0;

    constructor(channels: number, in_rate: number, out_rate: number,
                bits_per_sample: number, is_float: boolean, quality = 5) {

        this.channels = channels;
        this.in_rate = in_rate;
        this.out_rate = out_rate;
        this.bits_per_sample = bits_per_sample;

        var bytes = bits_per_sample / 8;
        if (bits_per_sample % 8 != 0 || bytes < 1 || bytes > 4)
            throw 'argument error: bits_per_sample = ' + bits_per_sample;
        if (is_float && bits_per_sample != 32)
            throw 'argument error: if is_float=true, bits_per_sample must be 32';
        
        var err_ptr = allocate(4, 'i32', ALLOC_STACK);
        this.handle = _speex_resampler_init(channels,
                                            in_rate,
                                            out_rate,
                                            quality, err_ptr);
        if (getValue(err_ptr, 'i32') != 0)
            throw 'speex_resampler_init failed: ret=' + getValue(err_ptr, 'i32');

        if (!is_float) {
            if (bits_per_sample == 8)
                this.copy_to_buf = this._from_i8;
            else if (bits_per_sample == 16) {
                this.copy_to_buf = this._from_i16;
            }
            else if (bits_per_sample == 24)
                this.copy_to_buf = this._from_i24;
            else if (bits_per_sample == 32)
                this.copy_to_buf = this._from_i32;
        } else {
            this.copy_to_buf = this._from_f32;
        }

        this.in_len_ptr = _malloc(4);
        this.out_len_ptr = _malloc(4);
    }

    process(raw_input: ArrayBuffer): Array<Float32Array> {
        if (!this.handle) throw 'disposed object'
        var samples = (raw_input.byteLength / (this.bits_per_sample / 8) / this.channels);
        var outSamples = Math.ceil(samples * this.out_rate / this.in_rate);
        var requireSize = samples * 4;
        if (this.in_capacity < requireSize) {
            if (this.in_ptr) _free(this.in_ptr);
            if (this.out_ptr) _free(this.out_ptr);
            this.in_ptr = _malloc(requireSize);
            this.out_ptr = _malloc(outSamples * 4);
            this.in_capacity = requireSize;
        }

        var results: Array<Float32Array> = [];
        for (var ch = 0; ch < this.channels; ++ch) {
            this.copy_to_buf(raw_input, ch, samples);
            setValue(this.in_len_ptr, samples, 'i32');
            setValue(this.out_len_ptr, outSamples, 'i32');

            var ret = _speex_resampler_process_float(this.handle,
                                                     ch,
                                                     this.in_ptr,
                                                     this.in_len_ptr,
                                                     this.out_ptr,
                                                     this.out_len_ptr);
            if (ret != 0)
                throw 'speex_resampler_process_float failed: ' + ret;

            var ret_samples = getValue(this.out_len_ptr, 'i32');
            var ary = new Float32Array(ret_samples);
            ary.set(HEAPF32.subarray(this.out_ptr >> 2, (this.out_ptr >> 2) + ret_samples));
            results.push(ary);
        }

        return results;
    }

    process_interleaved(raw_input: ArrayBuffer): Float32Array {
        if (!this.handle) throw 'disposed object'
        var samples = raw_input.byteLength / (this.bits_per_sample / 8);
        var outSamples = Math.ceil(samples * this.out_rate / this.in_rate);
        var requireSize = samples * 4;
        if (this.in_capacity < requireSize) {
            if (this.in_ptr) _free(this.in_ptr);
            if (this.out_ptr) _free(this.out_ptr);
            this.in_ptr = _malloc(requireSize);
            this.out_ptr = _malloc(outSamples * 4);
            this.in_capacity = requireSize;
        }

        this.copy_to_buf(raw_input, -1, samples);
        setValue(this.in_len_ptr, samples / this.channels, 'i32');
        setValue(this.out_len_ptr, outSamples / this.channels, 'i32');

        var ret = _speex_resampler_process_interleaved_float(this.handle,
                                                             this.in_ptr,
                                                             this.in_len_ptr,
                                                             this.out_ptr,
                                                             this.out_len_ptr);
        if (ret != 0)
            throw 'speex_resampler_process_interleaved_float failed: ' + ret;

        var ret_samples = getValue(this.out_len_ptr, 'i32') * this.channels;
        var result = new Float32Array(ret_samples);
        result.set(HEAPF32.subarray(this.out_ptr >> 2, (this.out_ptr >> 2) + ret_samples));

        return result;
    }

    destroy(): void {
        if (!this.handle) return;
        _speex_resampler_destroy(this.handle);
        this.handle = 0;
        _free(this.in_len_ptr);
        _free(this.out_len_ptr);
        if (this.in_ptr) _free(this.in_ptr);
        if (this.out_ptr) _free(this.out_ptr);
        this.in_len_ptr = 
            this.out_len_ptr = 
            this.in_ptr = 
            this.out_ptr = 0;
    }

    private _from_i8(raw_input: ArrayBuffer, ch: number, samples: number): void {
        var input = new Int8Array(raw_input);
    }
    private _from_i16(raw_input: ArrayBuffer, ch: number, samples: number): void {
        var input = new Int16Array(raw_input);
        var off = this.in_ptr >> 2;
        if (ch >= 0) {
            var tc = this.channels;
            for (var i = 0; i < samples; ++i)
                HEAPF32[off + i] = input[i * tc + ch] / 32768.0;
        } else {
            for (var i = 0; i < samples; ++i)
                HEAPF32[off + i] = input[i] / 32768.0;
        }
    }
    private _from_i24(raw_input: ArrayBuffer, ch: number, samples: number): void {
        var input = new Uint8Array(raw_input);
    }
    private _from_i32(raw_input: ArrayBuffer, ch: number, samples: number): void {
        var input = new Int32Array(raw_input);
    }
    private _from_f32(raw_input: ArrayBuffer, ch: number, samples: number): void {
        var input = new Float32Array(raw_input);
        var off = this.in_ptr >> 2;
        if (ch >= 0) {
            var tc = this.channels;
            for (var i = 0; i < samples; ++i)
                HEAPF32[off + i] = input[i * tc + ch];
        } else {
            for (var i = 0; i < samples; ++i)
                HEAPF32[off + i] = input[i];
        }
    }
}
