importScripts("libopus.js");
var handle_ = null;
var encoding_ = false, decoding_ = false;
var in_ = null, out_ = null, out2_ = null, max_packet_size_ = null;
var sampling_ = null, channels_ = null, framesize_ = null;
var float_ = false, deinterleave = false;
onmessage = function(ev) {
    const OPUS_OK = 0;
    const OPUS_APPLICATION_AUDIO = 2049;
    var data = ev.data;

    if (!handle_) {
        var i32ptr = allocate(1, 'i32', ALLOC_STACK);
        sampling_ = data.samplingrate;
        channels_ = data.channels;
        framesize_ = data.framesize;
        if (data.float) float_ = true;
        if (data.deinterleave) deinterleave = true;
        if (!sampling_ || !channels_ || (data.type !== 'encoder' && data.type !== 'decoder')) {
            postMessage("argument error");
            return;
        }
        max_packet_size_ = (1275 * 3 + 7) * (1);
        if (data.type === 'encoder') {
            handle_ = _opus_encoder_create(sampling_, channels_, OPUS_APPLICATION_AUDIO, i32ptr);
            encoding_ = true;
            in_ = _malloc(framesize_ * (float_ ? 4 : 2) * channels_);
            out_ = _malloc(max_packet_size_);
        } else {
            handle_ = _opus_decoder_create(sampling_, channels_, i32ptr);
            decoding_ = true;
            in_ =  _malloc(max_packet_size_);
            framesize_ = 120 /*[ms]*/ * sampling_ / 1000;
            out_ = _malloc(framesize_ * channels_ * (float_ ? 4 : 2));
            if (deinterleave)
                out2_ = _malloc(framesize_ * channels_ * (float_ ? 4 : 2));
        }
        if (getValue(i32ptr, 'i32') != OPUS_OK) {
            postMessage("opus_" + (encoding_ ? "encoder" : "decoder") + "_create: failed. err=" + getValue(i32ptr, 'i32'));
            return;
        }
        return;
    }

    if (!data || !(data instanceof ArrayBuffer)) {
        postMessage(data);
        return;
    }

    if (encoding_) {
        var ret = -1;
        if (float_) {
            var in_samples = new Float32Array(data);
            HEAPF32.set(in_samples, in_ >> 2);
            if (in_samples.length / channels_ < framesize_) { // padding
                for (var i = in_samples.length; i < framesize_ * channels_; i++)
                    HEAPF32[(in_ >> 1) + i] = 0;
            }
            ret = _opus_encode_float(handle_, in_, framesize_, out_, max_packet_size_);
        } else {
            var in_samples = new Int16Array(data);
            HEAP16.set(in_samples, in_ >> 1);
            if (in_samples.length / channels_ < framesize_) { // padding
                for (var i = in_samples.length; i < framesize_ * channels_; i++)
                    HEAP16[(in_ >> 1) + i] = 0;
            }
            ret = _opus_encode(handle_, in_, framesize_, out_, max_packet_size_);
        }
        if (ret < 0) {
            postMessage("opus_encode failed. err=" + ret);
            return;
        }
        postMessage(HEAP16.buffer.slice(out_, out_ + ret));
    } else {
        var ret = -1;
        HEAPU8.set(new Uint8Array(data), in_);
        if (float_) {
            ret = _opus_decode_float(handle_, in_, data.byteLength, out_, framesize_, 0);
        } else {
            ret = _opus_decode(handle_, in_, data.byteLength, out_, framesize_, 0);
        }
        if (ret < 0) {
            postMessage("opus_decode failed. err=" + ret);
            return;
        }
        var bytes_per_sample = (float_ ? 4 : 2);
        if (deinterleave && channels_ === 2 && float_) {
            var l = out2_ >>> 2;
            var r = l + ret;
            var m = out_ >>> 2;
            for (var i = 0; i < ret; i ++) {
                HEAPF32[l + i] = HEAPF32[m + i * 2 + 0];
                HEAPF32[r + i] = HEAPF32[m + i * 2 + 1];
            }
            postMessage(HEAPU8.buffer.slice(out2_, out2_ + (ret * channels_ * bytes_per_sample)));
        } else {
            postMessage(HEAPU8.buffer.slice(out_, out_ + (ret * channels_ * bytes_per_sample)));
        }
    }
};
