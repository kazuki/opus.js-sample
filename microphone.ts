/// <reference path="api.d.ts" />
/// <reference path="typings/MediaStream.d.ts" />
/// <reference path="ring_buffer.ts" />

interface MediaStreamAudioSourceNode extends AudioNode {}
interface AudioContext {
    createMediaStreamSource(strm: MediaStream): MediaStreamAudioSourceNode;
}

class MicrophoneReader implements IAudioReader {
    in_flight: boolean;

    private context: AudioContext;
    private src_node: MediaStreamAudioSourceNode;
    private proc_node: ScriptProcessorNode;
    private ringbuf: RingBuffer;
    private read_unit: number;

    open(buffer_samples_per_ch: number, params: any): Promise<IAudioInfo> {
        this.context = new AudioContext();
        return new Promise<IAudioInfo>((resolve, reject) => {
            var callback = (strm) => {
                this.src_node = this.context.createMediaStreamSource(strm);
                this.ringbuf = new RingBuffer(new Float32Array(buffer_samples_per_ch * this.src_node.channelCount * 8));
                this.proc_node = this.context.createScriptProcessor(0, 1, this.src_node.channelCount);
                this.proc_node.onaudioprocess = (ev: AudioProcessingEvent) => {
                    this._onaudioprocess(ev);
                };
                this.src_node.connect(this.proc_node);
                this.proc_node.connect(this.context.destination);
                this.read_unit = buffer_samples_per_ch * this.src_node.channelCount;
                resolve({
                    sampling_rate: this.context.sampleRate / 2,
                    num_of_channels: this.src_node.channelCount,
                });
            };
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                }).then(callback, reject);
            } else {
                navigator.getUserMedia = (navigator.getUserMedia ||
                                          navigator.webkitGetUserMedia ||
                                          navigator.mozGetUserMedia ||
                                          navigator.msGetUserMedia);
                navigator.getUserMedia({
                    audio: true,
                    video: false,
                }, callback, reject);
            }
        });
    }

    private _onaudioprocess(ev: AudioProcessingEvent) {
        var num_of_ch = ev.inputBuffer.numberOfChannels;
        var samples_per_ch = ev.inputBuffer.getChannelData(0).length;
        var data = new Float32Array(num_of_ch * samples_per_ch);
        for (var i = 0; i < num_of_ch; ++i) {
            var ch = ev.inputBuffer.getChannelData(i);
            for (var j = 0; j < samples_per_ch; ++j)
                data[j * num_of_ch + i] = ch[j];
        }
        this.ringbuf.append(data);
    }

    read(): Promise<IAudioBuffer> {
        this.in_flight = true;
        return new Promise<IAudioBuffer>((resolve, reject) => {
            var buf = new Float32Array(this.read_unit);
            var func = () => {
                var size = this.ringbuf.read_some(buf);
                if (size == 0) {
                    window.setTimeout(() => {
                        func();
                    }, 10);
                    return;
                }
                this.in_flight = false;
                resolve({
                    timestamp: 0,
                    samples: buf.subarray(0, size),
                    transferable: true,
                });
            };
            func();
        });
    }

    close() {
    }
}
