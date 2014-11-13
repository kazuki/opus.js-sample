var RiffPcmWaveReader = (function () {
    function RiffPcmWaveReader() {
        this.header_read_state = 0;
        this.header_search_pos = 0;
        this.cur_chunk_size = 0;
        this.data_offset = 0;
        this.byteLength = 0;
        this.read_offset = 0;
        this.reading = false;
    }
    RiffPcmWaveReader.prototype.open = function (file) {
        var _this = this;
        this.sampling_rate = 0;
        this.file = file;
        this.reader = new FileReader();
        this.reader.onloadend = function (ev) {
            _this.reading = false;
            _this.parseHeader(ev);
        };
        this.beginRead(0, 12);
    };
    RiffPcmWaveReader.prototype.isOpened = function () {
        return this.sampling_rate != 0;
    };
    RiffPcmWaveReader.prototype.isBusy = function () {
        return this.reading;
    };
    RiffPcmWaveReader.prototype.getSamplingRate = function () {
        return this.sampling_rate;
    };
    RiffPcmWaveReader.prototype.getBitsPerSample = function () {
        return this.bits_per_sample;
    };
    RiffPcmWaveReader.prototype.getChannels = function () {
        return this.channels;
    };
    RiffPcmWaveReader.prototype.getBlockSize = function () {
        return (this.bits_per_sample / 8) * this.channels;
    };
    RiffPcmWaveReader.prototype.getTotalSamplesPerChannel = function () {
        return this.byteLength / this.getBlockSize();
    };
    RiffPcmWaveReader.prototype.getDataChunkBytes = function () {
        return this.byteLength;
    };
    RiffPcmWaveReader.prototype.getPosition = function () {
        return this.read_offset;
    };
    RiffPcmWaveReader.prototype.read = function (bytes) {
        if (!this.data_offset)
            throw 'unknown file format';
        if (bytes % this.getBlockSize() != 0)
            throw 'alignment error';
        if (this.read_offset + bytes > this.byteLength)
            bytes = this.byteLength - this.read_offset;
        this.beginRead(this.data_offset + this.read_offset, bytes);
        this.read_offset += bytes;
    };
    RiffPcmWaveReader.prototype.seek = function (offset) {
        if (!this.data_offset)
            throw 'unknown file format';
        if (offset % this.getBlockSize() != 0)
            throw 'alignment error';
        if (offset > this.byteLength || offset < 0)
            throw 'out of range error';
        this.read_offset = offset;
    };
    RiffPcmWaveReader.prototype.parseHeader = function (ev) {
        var _this = this;
        if (ev.target.readyState != this.reader.DONE) {
            this.onerror('unexpected end of file while reading for header');
            return;
        }
        var view = new Uint8Array(ev.target.result);
        switch (this.header_read_state) {
            case 0:
                if (this.equals("RIFF", view.subarray(0, 4)) && this.equals("WAVE", view.subarray(8, 12))) {
                    this.header_read_state = 1;
                    this.beginRead(12, 8);
                    return;
                }
                else {
                    this.onerror('unknown file format');
                    return;
                }
            case 1:
                var chunk_size = view[4] | (view[5] << 8) | (view[6] << 16) | (view[7] << 24);
                if (this.equals('fmt ', view.subarray(0, 4))) {
                    this.header_read_state = 2;
                    this.cur_chunk_size = chunk_size;
                    this.beginRead(this.header_search_pos + 8, chunk_size);
                    return;
                }
                else if (this.equals('data', view.subarray(0, 4))) {
                    this.data_offset = this.header_search_pos + 8;
                    this.byteLength = chunk_size;
                    // RIFF wave check ok!
                    this.reader.onloadend = function (ev) {
                        _this.reading = false;
                        _this.onloadend(ev);
                    };
                    this.onopened();
                    return;
                }
                this.beginRead(this.header_search_pos + chunk_size + 8, 8);
                return;
            case 2:
                var view16 = new Uint16Array(ev.target.result);
                var view32 = new Uint32Array(ev.target.result);
                if (view16[0] != 1)
                    break; // PCM
                this.channels = view16[1];
                this.sampling_rate = view32[1];
                this.bits_per_sample = view16[7];
                this.header_read_state = 1;
                this.beginRead(this.header_search_pos + this.cur_chunk_size, 8);
                return;
        }
        this.onerror('BUG#1');
    };
    RiffPcmWaveReader.prototype.equals = function (txt, bytes) {
        if (txt.length !== bytes.length)
            return false;
        var txt2 = String.fromCharCode.apply(String, bytes);
        return (txt === txt2);
    };
    RiffPcmWaveReader.prototype.beginRead = function (offset, bytes) {
        this.reading = true;
        this.header_search_pos = offset;
        this.reader.readAsArrayBuffer(this.file.slice(offset, offset + bytes));
    };
    return RiffPcmWaveReader;
})();
