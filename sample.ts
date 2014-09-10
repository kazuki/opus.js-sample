/// <reference path="riff_pcm_wave_reader.ts" />
/// <reference path="player.ts" />
/// <reference path="opus.ts" />
/// <reference path="d.ts/waa.d.ts" />

var _sample_instance: Sample;

class Sample {
    private input_file_element: HTMLInputElement;
    private wav_info_element: HTMLElement;
    private reader: RiffPcmWaveReader = null;
    private player: Player = null;

    private file_io_buffer_size = 65536 * 2;

    constructor() {
        this.input_file_element = <HTMLInputElement>document.getElementById('input_file');
        this.wav_info_element = document.getElementById('wav_info');
    }

    main(): void {
        this.executeSelfTest();
        this.registerFileSelectHandler();
        this.registerPlayButtonHandler();
        this.registerOpusBenchButtonHandler();
        this.registerOpusEncDecPlayButtonHandler();
    }

    registerFileSelectHandler(): void {
        this.input_file_element.addEventListener('change', () => {
            this.reader = new RiffPcmWaveReader();
            while (this.wav_info_element.firstChild)
                this.wav_info_element.removeChild(this.wav_info_element.firstChild);
            this.reader.onerror = (reason: string) => {
                this.wav_info_element.appendChild(
                    document.createTextNode('error: ' + reason));
            };
            this.reader.onopened = () => {
                this.wav_info_element.appendChild(
                    document.createTextNode(
                        'file info: RIFF PCM Wave. ' +
                        this.reader.getSamplingRate() + 'Hz ' +
                        this.reader.getBitsPerSample() + 'bits ' +
                        this.reader.getChannels() + 'ch ' +
                        Math.floor(this.reader.getDataChunkBytes() / (this.reader.getSamplingRate() * this.reader.getChannels() * (this.reader.getBitsPerSample() / 8))) + 'sec'
                    ));
            };
            this.reader.open(this.input_file_element.files[0]);
        });
    }

    registerPlayButtonHandler(): void {
        var status_element = document.getElementById('play_status');
        var update_status = (txt: string) => {
            status_element.replaceChild(document.createTextNode(txt), status_element.firstChild);
        };
        status_element.appendChild(document.createTextNode(''));

        document.getElementById('play').addEventListener('click', () => {
            if (!this.reader || !this.reader.isOpened()) {
                alert('先にWaveファイルを開いてください');
                return;
            }
            if (this.player)
                this.player.destroy();
            this.player = new Player(this.reader.getSamplingRate(),
                                     this.reader.getChannels(),
                                     this.reader.getBitsPerSample(),
                                     false, 8192);
            update_status((this.reader.getSamplingRate() / 1000) + 'kHz =>' + (this.player.getOutputSamplingRate() / 1000) + 'kHz');
            this.player.onneedbuffer = () => {
                if (this.reader.isBusy())
                    return;
                this.reader.read(this.file_io_buffer_size);
            };
            this.reader.onloadend = (ev) => {
                if (ev.target.readyState == 2/*FileReader.DONE*/) {
                    if (ev.target.result.byteLength == 0) {
                        this.player.stop();
                        console.log('EOF');
                        return;
                    }
                    this.player.enqueue(ev.target.result);
                }
            };
            this.reader.seek(0);
            this.reader.read(this.file_io_buffer_size);
        });
    }

    registerOpusBenchButtonHandler(): void {
        var status_element = document.getElementById('opus_bench_status');
        var update_status = (txt: string) => {
            status_element.replaceChild(document.createTextNode(txt), status_element.firstChild);
        };
        status_element.appendChild(document.createTextNode(''));

        document.getElementById('opus_bench').addEventListener('click', () => {
            if (!this.reader || !this.reader.isOpened()) {
                alert('先にWaveファイルを開いてください');
                return;
            }

            var worker = new Worker('opus.worker.js');
            var total_bytes = this.reader.getDataChunkBytes();
            var length_sec = total_bytes / (this.reader.getSamplingRate() * this.reader.getChannels() * (this.reader.getBitsPerSample() / 8));
            var total_packets = Math.ceil(length_sec * 1000 / 20);
            var start_time: number;
            var encoded_bytes = 0;
            var opus_packets: Array<ArrayBuffer> = [];
            var frame_duration_in_sec = 20 / 1000;
            var encmsg;

            var decoder_bench = () => {
                var counter = 0;
                start_time = Date.now();
                worker = new Worker('opus.worker.js');
                worker.onmessage = (ev) => {
                    if (!(ev.data instanceof String)) {
                        counter++;
                        if (counter < opus_packets.length) {
                            update_status(encmsg + ', decoding: ' + Math.floor(counter * 100 / opus_packets.length) + '%');
                        } else {
                            var time = (Date.now() - start_time) / 1000.0;
                            update_status(encmsg + ', decoded: ' + time + 'sec(speed:x' + Math.round(length_sec / time) + ')');
                            worker.terminate();
                        }
                    } else {
                        if (ev.data != 'ok')
                            update_status(encmsg + ', decode failed: ' + ev.data);
                    }
                };
                worker.postMessage({
                    'type': 'decoder',
                    'sampling_rate': this.reader.getSamplingRate(),
                    'channels': this.reader.getChannels(),
                    'is_float': false
                });
                opus_packets.forEach(packet => {
                    worker.postMessage(packet);
                    return;
                });
            };

            this.reader.onloadend = (ev) => {
                if (ev.target.readyState == 2/*FileReader.DONE*/) {
                    if (ev.target.result.byteLength == 0) {
                        worker.postMessage(new ArrayBuffer(0));
                        return;
                    }
                    worker.postMessage(ev.target.result);
                    this.reader.read(this.file_io_buffer_size);
                }
            };
            worker.onmessage = (ev) => {
                if (ev.data != 'ok') {
                    update_status(<string>ev.data);
                    return;
                }

                update_status('encoding...');
                worker.onmessage = (ev) => {
                    var packet: ArrayBuffer = ev.data;
                    if (packet.byteLength == 0) {
                        var time = (Date.now() - start_time) / 1000.0;
                        encmsg = 'encoded: ' + time + 'sec(speed:x' + Math.round(length_sec / time) + ')';
                        update_status(encmsg);
                        worker.terminate();
                        decoder_bench();
                    } else {
                        encoded_bytes += packet.byteLength;
                        opus_packets.push(packet);
                        update_status('encoding: ' + Math.floor(opus_packets.length / total_packets * 100) + '%. avg bitrate=' + Math.floor(encoded_bytes * 8 / opus_packets.length / frame_duration_in_sec / 1000) + 'kbps');
                    }
                }
                start_time = Date.now();
                this.reader.seek(0);
                this.reader.read(this.file_io_buffer_size);
            };
            worker.postMessage({
                'type': 'encoder',
                'sampling_rate': this.reader.getSamplingRate(),
                'channels': this.reader.getChannels(),
                'is_float': false
            });
        });
    }

    registerOpusEncDecPlayButtonHandler(): void {
        document.getElementById('encdecplay').addEventListener('click', () => {
            if (!this.reader || !this.reader.isOpened()) {
                alert('先にWaveファイルを開いてください');
                return;
            }
            if (this.player)
                this.player.destroy();

            var opus_sampling_rate = parseInt((<HTMLSelectElement>document.getElementById('edp_sampling_rate')).value) * 1000;
            var opus_frame_duration = parseFloat((<HTMLSelectElement>document.getElementById('edp_duration')).value);
            var opus_app_name = (<HTMLSelectElement>document.getElementById('edp_app')).value;
            var opus_app = (():OpusApplication => {
                if (opus_app_name == 'voip')
                    return OpusApplication.VoIP;
                if (opus_app_name == 'audio')
                    return OpusApplication.Audio;
                if (opus_app_name == 'lowdelay')
                    return OpusApplication.RestrictedLowDelay;
                return OpusApplication.Audio;
            })();

            this._opusEncDecPlay(opus_sampling_rate, opus_frame_duration, opus_app);
        });
    }

    private _opusEncDecPlay(opus_sampling_rate: number, opus_frame_duration: number, opus_app: OpusApplication): void {
        var worker = new Worker('sample.roundtrip.js');
        this.player = new Player(opus_sampling_rate, this.reader.getChannels(), 32, true, 8192);

        worker.onmessage = (ev) => {
            if (ev.data != 'ok') {
                console.log(ev.data);
                this.player.stop();
                worker.terminate();
                return;
            }
            worker.onmessage = (ev) => {
                this.player.enqueue(ev.data);
            };
            this.reader.seek(0);
            this.reader.read(this.file_io_buffer_size);
        };
        worker.postMessage({
            'channels': this.reader.getChannels(),
            'in_sampling_rate': this.reader.getSamplingRate(),
            'opus_sampling_rate': opus_sampling_rate,
            'frame_duration': opus_frame_duration,
            'application': opus_app
        });

        this.player.onneedbuffer = () => {
            if (this.reader.isBusy())
                return;
            this.reader.read(this.file_io_buffer_size);
        };
        this.reader.onloadend = (ev) => {
            if (ev.target.readyState == 2/*FileReader.DONE*/) {
                if (ev.target.result.byteLength == 0) {
                    this.player.stop();
                    console.log('EOF');
                    return;
                }
                worker.postMessage(ev.target.result);
            }
        };
    }

    executeSelfTest(): boolean {
        var tests = {
            'version': () => {
                return Opus.getVersion();
            },
            'encoder-init': () => {
                try {
                    new OpusEncoder(48000, 2, OpusApplication.Audio).destroy();
                    return true;
                } catch (e) {
                    return false;
                }
            },
            'decoder-init': () => {
                try {
                    new OpusDecoder(48000, 2).destroy();
                    return true;
                } catch(e) {
                    return false;
                }
            },
            'webaudio': () => {
                if (AudioContext)
                    return true;
                return false;
            }
        };

        var failed = false;
        var msg0 = '';
        var msg1 = '';
        for (var name in tests) {
            var ret:any = false;
            try {
                ret = tests[name]();
            } catch (e) {}
            if (ret === true) {
                ret = 'ok';
            } else if (ret === false) {
                ret = 'failed';
                failed = true;
            }
            if (name === 'version') {
                msg0 = 'version: ' + ret;
            } else {
                msg1 += '  ' + name + ': ' + ret + '\n';
            }
        }

        var e = document.getElementById('info');
        while (e.firstChild) e.removeChild(e.firstChild);
        e.appendChild(document.createTextNode(msg0 + '\n\nself test: '
                                              + (failed ? 'failed' : 'ok')
                                              + '\n' + msg1));
        return !failed;
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    _sample_instance = new Sample();
    _sample_instance.main();
});
