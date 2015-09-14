///<reference path="typings/emscripten.d.ts" />
///<reference path="typings/libspeexdsp.d.ts" />

class SpeexResampler {
    private handle: number = 0;
    private channels: number;
    private in_rate: number;
    private out_rate: number;

    private copy_to_buf: (input:ArrayBuffer, ch:number, samples: number) => void;

    private in_ptr: number = 0;
    private out_ptr: number = 0;
    private in_capacity: number = 0;
    private in_len_ptr: number = 0;
    private out_len_ptr: number = 0;

    constructor(channels: number, in_rate: number, out_rate: number, quality: number = 5) {
        this.channels = channels;
        this.in_rate = in_rate;
        this.out_rate = out_rate;
        
        var err_ptr = Module._malloc(4);
        this.handle = _speex_resampler_init(channels,
                                            in_rate,
                                            out_rate,
                                            quality, err_ptr);
        if (Module.getValue(err_ptr, 'i32') != 0)
            throw 'speex_resampler_init failed: ret=' + Module.getValue(err_ptr, 'i32');
        Module._free(err_ptr);

        this.in_len_ptr = Module._malloc(4);
        this.out_len_ptr = Module._malloc(4);
    }

    process(input: Float32Array): Float32Array {
        if (!this.handle) throw 'disposed object'
        var samples = input.length;
        var outSamples = Math.ceil(samples * this.out_rate / this.in_rate);
        var requireSize = samples * 4;
        if (this.in_capacity < requireSize) {
            if (this.in_ptr) Module._free(this.in_ptr);
            if (this.out_ptr) Module._free(this.out_ptr);
            this.in_ptr = Module._malloc(requireSize);
            this.out_ptr = Module._malloc(outSamples * 4);
            this.in_capacity = requireSize;
        }

        var ret;
        Module.setValue(this.in_len_ptr, samples / this.channels, 'i32');
        Module.setValue(this.out_len_ptr, outSamples / this.channels, 'i32');
        if (input.buffer == Module.HEAPF32.buffer) {
            ret = _speex_resampler_process_interleaved_float(this.handle,
                                                             input.byteOffset,
                                                             this.in_len_ptr,
                                                             this.out_ptr,
                                                             this.out_len_ptr);
        } else {
            Module.HEAPF32.set(input, this.in_ptr >> 2);
            ret = _speex_resampler_process_interleaved_float(this.handle,
                                                             this.in_ptr,
                                                             this.in_len_ptr,
                                                             this.out_ptr,
                                                             this.out_len_ptr);
        }
        if (ret != 0)
            throw 'speex_resampler_process_interleaved_float failed: ' + ret;

        var ret_samples = Module.getValue(this.out_len_ptr, 'i32') * this.channels;
        return Module.HEAPF32.subarray(this.out_ptr >> 2, (this.out_ptr >> 2) + ret_samples);
    }

    destroy(): void {
        if (!this.handle) return;
        _speex_resampler_destroy(this.handle);
        this.handle = 0;
        Module._free(this.in_len_ptr);
        Module._free(this.out_len_ptr);
        if (this.in_ptr) Module._free(this.in_ptr);
        if (this.out_ptr) Module._free(this.out_ptr);
        this.in_len_ptr = 
            this.out_len_ptr = 
            this.in_ptr = 
            this.out_ptr = 0;
    }
}
