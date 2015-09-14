/// <reference path="typings/es6-promise.d.ts" />

interface TypedArray extends ArrayBufferView, ArrayLike<number> {
    length: number;
    set(array: TypedArray, offset?: number): void;
    subarray(begin: number, end?: number): TypedArray;
};

class RingBuffer {
    static MAX_POS = (1 << 16);
    private buf: TypedArray;
    private wpos = 0;
    private rpos = 0;
    private remaining_write_data: [TypedArray, {():void}] = null;

    constructor(buffer: TypedArray) {
        this.buf = buffer;
    }

    append(data: TypedArray): Promise<any> {
        /*if (this.rpos >= RingBuffer.MAX_POS && this.wpos >= RingBuffer.MAX_POS) {
            this.wpos -= RingBuffer.MAX_POS;
            this.rpos -= RingBuffer.MAX_POS;
        }*/

        return new Promise((resolve, reject) => {
            // 書き込み処理が実施中の場合は常にrejectする
            if (this.remaining_write_data) {
                reject();
                return;
            }

            var size = this._append_some(data);
            if (size == data.length) {
                resolve();
                return;
            }

            // 空き容量がないので，読み込み処理が実施時に書き込むようにする
            this.remaining_write_data = [data.subarray(size), resolve];
        });
    }

    read_some(output: TypedArray): number {
        var ret = this._read_some(output);
        if (this.remaining_write_data) {
            this._append_remaining_data();
            if (ret < output.length)
                ret += this._read_some(output.subarray(ret));
        }
        return ret;
    }

    private _append_some(data: TypedArray): number {
        var total_size = Math.min(data.length, this.available());
        if (total_size == 0) return 0;

        // 書き込み位置からバッファの終端まで書き込む
        var pos = this.wpos % this.buf.length;
        var size = Math.min(total_size, this.buf.length - pos);
        this.buf.set(data.subarray(0, size), pos);

        // バッファの終端に達したが，書き込むデータがまだあるため
        // バッファの先頭から書き込みを継続する
        if (size < total_size) {
            this.buf.set(data.subarray(size, total_size), 0);
        }

        this.wpos += total_size;
        return total_size;
    }

    private _append_remaining_data() {
        var data = this.remaining_write_data[0];
        var resolve = this.remaining_write_data[1];
        this.remaining_write_data = null;

        var size = this._append_some(data);
        if (size == data.length) {
            resolve();
        } else {
            this.remaining_write_data = [data.subarray(size), resolve];
        }
    }

    private _read_some(output: TypedArray): number {
        var total_size = Math.min(output.length, this.size());
        if (total_size == 0) return 0;

        // 読み込み位置からバッファ終端方向に読み込む
        var pos = this.rpos % this.buf.length;
        var size = Math.min(total_size, this.buf.length - pos);
        output.set(this.buf.subarray(pos, pos + size), 0);

        // バッファの終端に達したが読み込むデータがまだあるため
        // バッファの先頭から読み込みを継続する
        if (size < total_size) {
            output.set(this.buf.subarray(0, total_size - size), size);
        }

        this.rpos += total_size;
        return total_size;
    }

    clear(): void {
        this.rpos = this.wpos = 0;
        this.remaining_write_data = null;
    }

    capacity(): number {
        return this.buf.length;
    }

    size(): number {
        return this.wpos - this.rpos;
    }

    available(): number {
        return this.capacity() - this.size();
    }
}
