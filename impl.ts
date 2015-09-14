/// <reference path="api.d.ts" />
class AudioEncoder {
    worker: Worker;

    constructor(path: string) {
        this.worker = new Worker(path);
    }

    setup(cfg: IAudioEncoderConfig): Promise<Array<Packet>> {
        return new Promise<Array<Packet>>((resolve, reject) => {
            this.worker.onmessage = (ev) => {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(<Array<Packet>>ev.data.packets);
            };
            this.worker.postMessage(cfg);
        });
    }

    encode(data: IAudioBuffer): Promise<Array<Packet>> {
        return new Promise<Array<Packet>>((resolve, reject) => {
            this.worker.onmessage = (ev) => {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(<Array<Packet>>ev.data.packets);
            };
            this.worker.postMessage(data);
        });
    }
}

class AudioDecoder {
    worker: Worker;

    constructor(path: string) {
        this.worker = new Worker(path);
    }

    setup(cfg: any, packets: Array<Packet>): Promise<IAudioInfo> {
        var transfer_list = [];
        for (var i = 0; i < packets.length; ++i)
            transfer_list.push(packets[i].data);
        return new Promise<IAudioInfo>((resolve, reject) => {
            this.worker.onmessage = (ev) => {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(<IAudioInfo>ev.data);
            };
            this.worker.postMessage({
                config: cfg,
                packets: packets,
            }, transfer_list);
        });
    }

    decode(packet: Packet): Promise<IAudioBuffer> {
        return new Promise<IAudioBuffer>((resolve, reject) => {
            this.worker.onmessage = (ev) => {
                if (ev.data.status != 0) {
                    reject(ev.data);
                    return;
                }
                resolve(<IAudioBuffer>ev.data);
            };
            this.worker.postMessage(packet, [packet.data]);
        });
    }
}
