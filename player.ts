/// <reference path="api.d.ts" />
/// <reference path="ring_buffer.ts" />

class WebAudioPlayer {
    private context: AudioContext;
    private node: ScriptProcessorNode;
    private resampler: Worker;
    private in_writing: boolean = false;

    private buffering: boolean = true;
    private ringbuf: RingBuffer;
    private period_samples: number;
    private delay_samples: number;

    onneedbuffer: () => void = null;

    init(sampling_rate: number, num_of_channels: number,
         period_samples: number, delay_periods: number, buffer_periods: number): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this.context = new AudioContext();
            this.node = this.context.createScriptProcessor(period_samples, 0, num_of_channels);
            this.node.onaudioprocess = (ev) => {
                this._onaudioprocess(ev);
            };
            if (sampling_rate != this.getActualSamplingRate()) {
                console.log('enable resampling: ' + sampling_rate + ' -> ' + this.getActualSamplingRate());
                this.period_samples = Math.ceil(period_samples * this.getActualSamplingRate() / sampling_rate) * num_of_channels;
                this.resampler = new Worker('resampler.js');
            } else {
                this.period_samples = period_samples * num_of_channels;
            }
            this.ringbuf = new RingBuffer(new Float32Array(this.period_samples * buffer_periods));
            this.delay_samples = this.period_samples * delay_periods;
            if (this.resampler) {
                this.resampler.onmessage = (ev) => {
                    if (ev.data.status == 0) {
                        resolve();
                    } else {
                        reject(ev.data);
                    }
                };
                this.resampler.postMessage({
                    channels: num_of_channels,
                    in_sampling_rate: sampling_rate,
                    out_sampling_rate: this.getActualSamplingRate()
                });
            } else {
                resolve();
            }
        });
    }

    enqueue(buf: IAudioBuffer): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.in_writing) {
                reject();
                return;
            }
            this.in_writing = true;
            var func = (data: Float32Array) => {
                this.ringbuf.append(data).then(() => {
                    this.in_writing = false;
                    this.check_buffer();
                }, (e) => {
                    this.in_writing = false;
                    reject(e);
                });
            };
            if (this.resampler) {
                var transfer_list = buf.transferable ? [buf.samples.buffer] : [];
                this.resampler.onmessage = (ev) => {
                    if (ev.data.status != 0) {
                        this.in_writing = false;
                        reject(ev.data);
                        return;
                    }
                    func(ev.data.result);
                };
                this.resampler.postMessage({
                    samples: buf.samples
	            }, transfer_list);
            } else {
                func(buf.samples);
            }
        });
    }

    private _onaudioprocess(ev): void {
        if (this.buffering) {
            this.check_buffer();
            return;
        }
        var N = ev.outputBuffer.numberOfChannels;
        var buf = new Float32Array(ev.outputBuffer.getChannelData(0).length * N);
        var size = this.ringbuf.read_some(buf) / N;
        for (var i = 0; i < N; ++i) {
            var ch = ev.outputBuffer.getChannelData(i);
            for (var j = 0; j < size; ++j)
                ch[j] = buf[j * N + i];
        }
        this.check_buffer(true);
    }

    private in_requesting_check_buffer = false;
    private check_buffer(useTimeOut: boolean = false): void {
        if (this.in_requesting_check_buffer || !this.onneedbuffer)
            return;
        var needbuf = this.check_buffer_internal();
        if (!needbuf)
            return;
        if (useTimeOut) {
            this.in_requesting_check_buffer = true;
            window.setTimeout(() => {
                this.in_requesting_check_buffer = false;
                if (this.check_buffer_internal())
                    this.onneedbuffer();
            }, 0);
        } else {
            this.onneedbuffer();
        }
    }

    private check_buffer_internal(): boolean {
        if (this.in_writing) return false;
        var avail = this.ringbuf.available();
        var size = this.ringbuf.size();
        if (size >= this.delay_samples)
            this.buffering = false;
        if (this.period_samples <= avail)
            return true;
        return false;
    }

    start(): void {
        if (this.node) {
            this.node.connect(this.context.destination);
        }
    }

    stop(): void {
        if (this.node) {
            this.ringbuf.clear();
            this.buffering = true;
            this.node.disconnect();
        }
    }

    close(): void {
        this.stop();
        this.context = null;
        this.node = null;
    }

    getActualSamplingRate(): number {
        return this.context.sampleRate;
    }

    getBufferStatus(): IPlayerBufferStatus {
        return {
            delay: this.ringbuf.size(),
            available: this.ringbuf.available(),
            capacity: this.ringbuf.capacity(),
        };
    }
}
