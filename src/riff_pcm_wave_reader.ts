class RiffPcmWaveReader {
    private file: File;
    private reader: FileReader;

    private sampling_rate: number;
    private bits_per_sample: number;
    private channels: number;

    private header_read_state = 0;
    private header_search_pos = 0;
    private cur_chunk_size = 0;

    private data_offset = 0;
    private byteLength = 0;

    private read_offset = 0;
    private reading = false;

    onopened:()=>void;
    onerror: (reason: string)=>void;
    onloadend: (event)=>void;

    open(file: File): void {
        this.sampling_rate = 0;
        this.file = file;
        this.reader = new FileReader();
        this.reader.onloadend = (ev) => {
            this.reading = false;
            this.parseHeader(ev);
        };
        this.beginRead(0, 12);
    }

    isOpened(): boolean { return this.sampling_rate != 0; }
    isBusy(): boolean { return this.reading; }
    getSamplingRate(): number { return this.sampling_rate; }
    getBitsPerSample(): number { return this.bits_per_sample; }
    getChannels(): number { return this.channels; }
    getBlockSize(): number { return (this.bits_per_sample / 8) * this.channels; }
    getTotalSamplesPerChannel(): number {
        return this.byteLength / this.getBlockSize();
    }
    getDataChunkBytes(): number { return this.byteLength; }
    getPosition(): number { return this.read_offset; }

    read(bytes: number): void {
        if (!this.data_offset)
            throw 'unknown file format';
        if (bytes % this.getBlockSize() != 0)
            throw 'alignment error';

        if (this.read_offset + bytes > this.byteLength)
            bytes = this.byteLength - this.read_offset;

        this.beginRead(this.data_offset + this.read_offset, bytes);
        this.read_offset += bytes;
    }

    seek(offset: number): void {
        if (!this.data_offset)
            throw 'unknown file format';
        if (offset % this.getBlockSize() != 0)
            throw 'alignment error';
        if (offset > this.byteLength || offset < 0)
            throw 'out of range error';
        this.read_offset = offset;
    }

    private parseHeader(ev): void {
        if (ev.target.readyState != this.reader.DONE) {
            this.onerror('unexpected end of file while reading for header');
            return;
        }

        var view = new Uint8Array(ev.target.result);
        switch(this.header_read_state) {
        case 0: // check RIFF header
            if (this.equals("RIFF", view.subarray(0, 4)) && this.equals("WAVE", view.subarray(8, 12))) {
                this.header_read_state = 1;
                this.beginRead(12, 8);
                return;
            } else {
                this.onerror('unknown file format');
                return;
            }
        case 1: // find fmt/data chunk
            var chunk_size = view[4] | (view[5] << 8) | (view[6] << 16) | (view[7] << 24);
            if (this.equals('fmt ', view.subarray(0, 4))) {
                this.header_read_state = 2;
                this.cur_chunk_size = chunk_size;
                this.beginRead(this.header_search_pos + 8, chunk_size);
                return;
            } else if (this.equals('data', view.subarray(0, 4))) {
                this.data_offset = this.header_search_pos + 8;
                this.byteLength = chunk_size;
                    
                // RIFF wave check ok!
                this.reader.onloadend = (ev) => {
                    this.reading = false;
                    this.onloadend(ev);
                };
                this.onopened();
                return;
            }
            this.beginRead(this.header_search_pos + chunk_size + 8, 8);
            return;
        case 2: // parse fmt chunk
            var view16 = new Uint16Array(ev.target.result);
            var view32 = new Uint32Array(ev.target.result);
            if (view16[0] != 1) break; // PCM
            this.channels = view16[1];
            this.sampling_rate = view32[1];
            this.bits_per_sample = view16[7];
            this.header_read_state = 1;
            this.beginRead(this.header_search_pos + this.cur_chunk_size, 8);
            return;
        }
        this.onerror('BUG#1');
    }

    private equals(txt: string, bytes: Uint8Array): boolean {
        if (txt.length !== bytes.length)
            return false;
        var txt2 = String.fromCharCode.apply(String, bytes);
        return (txt === txt2);
    }

    private beginRead(offset: number, bytes: number): void {
        this.reading = true;
        this.header_search_pos = offset;
        this.reader.readAsArrayBuffer(this.file.slice(offset, offset + bytes));
    }
}
