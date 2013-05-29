(function(global) {
    var RiffWaveReader = function(file, open_success_callback, open_error_callback) {
        var file = file;
        var reader = new FileReader();
        var self = this;

        // event
        self.onloadend = function(ev) {};

        // Read RIFF header
        var header_read_state = 0;
        var header_search_pos = 0;
        var cur_chunk_size = null;
        reader.onloadend = function(ev) {
            if (ev.target.readyState != FileReader.DONE) {
                open_error_callback();
                return;
            }
            var view = new Uint8Array(ev.target.result);
            switch(header_read_state) {
            case 0: // check RIFF header
                if (view[0] == 82 && view[1] == 73 && view[2] == 70 && view[3] == 70 &&
                    view[8] == 87 && view[9] == 65 && view[10] == 86 && view[11] == 69) {
                    header_read_state = 1;
                    header_search_pos = 12;
                    reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + 8));
                    return;
                }
                break;
            case 1: // find fmt/data chunk
                var chunk_size = view[4] | (view[5] << 8) | (view[6] << 16) | (view[7] << 24);
                if (view[0] == 102 && view[1] == 109 && view[2] == 116 && view[3] == 32) { // 'fmt '
                    header_read_state = 2;
                    header_search_pos += 8;
                    cur_chunk_size = chunk_size;
                    reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + chunk_size));
                    return;
                } else if (view[0] == 100 && view[1] == 97 && view[2] == 116 && view[3] == 97) { // 'data'
                    self.data_offset = header_search_pos + 8;
                    self.byteLength = chunk_size;
                    
                    // RIFF wave check ok!
                    reader.onloadend = function(ev) {
                        if (ev.target.readyState == FileReader.DONE)
                            ev.target.result.read_offset = self._offset;
                        self.onloadend(ev);
                    };
                    open_success_callback();
                    return;
                }
                header_search_pos = header_search_pos + chunk_size + 8;
                reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + 8));
                return;
            case 2: // parse fmt chunk
                var view16 = new Uint16Array(ev.target.result);
                var view32 = new Uint32Array(ev.target.result);
                if (view16[0] != 1) break;
                self.channels = view16[1];
                self.sampling_rate = view32[1];
                self.bits_per_sample = view16[7];
                header_read_state = 1;
                header_search_pos += cur_chunk_size;
                reader.readAsArrayBuffer(file.slice(header_search_pos, header_search_pos + 8));
                return;
            }
            open_error_callback();
        };
        reader.readAsArrayBuffer(file.slice(0, 12));
        
        // functions
        self.read = function(offset, length) {
            if (!self.data_offset) throw 'unknown file format';
            self._offset = offset;
            if (self.data_offset + offset + length > self.byteLength)
                length = self.byteLength - offset;
            reader.readAsArrayBuffer(file.slice(self.data_offset + offset, self.data_offset + offset + length));
        };
    };

    global.RiffWaveReader = RiffWaveReader;
}) (this);
