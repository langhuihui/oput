var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Types = [[Uint8Array, Int8Array], [Uint16Array, Int16Array], [Uint32Array, Int32Array, Float32Array], [Float64Array]];
const OPutMap = new Map();
Types.forEach((t, i) => t.forEach((t) => OPutMap.set(t, i)));
export default class OPut {
    constructor(g) {
        this.g = g;
        this.consumed = 0;
        if (g)
            this.need = g.next().value;
    }
    fillFromReader(source) {
        return __awaiter(this, void 0, void 0, function* () {
            const { done, value } = yield source.read();
            if (done) {
                this.close();
                return;
            }
            else {
                this.write(value);
                return this.fillFromReader(source);
            }
        });
    }
    ;
    demand(n) {
        if (this.consumed) {
            this.buffer.copyWithin(0, this.consumed);
            this.buffer = this.buffer.subarray(0, this.buffer.length - this.consumed);
            this.consumed = 0;
        }
        this.need = n;
        this.flush();
    }
    read(need) {
        return new Promise((resolve, reject) => {
            if (this.resolve)
                return reject("last read not complete yet");
            this.resolve = (data) => {
                delete this.resolve;
                delete this.need;
                console.log(data);
                resolve(data);
            };
            this.demand(need);
        });
    }
    close() {
        if (this.g)
            this.g.return();
    }
    flush() {
        if (!this.buffer || !this.need)
            return;
        let returnValue = null;
        if (typeof this.need === 'number') {
            if (this.buffer.length >= this.need) {
                this.consumed = this.need;
                returnValue = this.buffer.subarray(0, this.consumed);
            }
        }
        else if (this.need instanceof ArrayBuffer) {
            if (this.buffer.length >= this.need.byteLength) {
                this.consumed = this.need.byteLength;
                new Uint8Array(this.need).set(this.buffer.subarray(0, this.consumed));
                returnValue = this.need;
            }
        }
        else if (OPutMap.has(this.need.constructor)) {
            const n = this.need.length << OPutMap.get(this.need.constructor);
            if (this.buffer.length >= n) {
                this.consumed = n;
                new Uint8Array(this.need.buffer, this.need.byteOffset).set(this.buffer.subarray(0, n));
                returnValue = this.need;
            }
        }
        else if (this.g) {
            this.g.throw(new Error('Unsupported type'));
        }
        if (returnValue) {
            if (this.g)
                this.demand(this.g.next(returnValue).value);
            else if (this.resolve)
                this.resolve(returnValue);
            else
                this.consumed = 0;
        }
    }
    write(value) {
        if (value instanceof ArrayBuffer) {
            this.malloc(value.byteLength).set(new Uint8Array(value));
        }
        else if (OPutMap.has(value.constructor)) {
            const container = this.malloc(value.length << OPutMap.get(value.constructor));
            container.set(new Uint8Array(value.buffer, value.byteOffset, container.length));
        }
        else {
            throw new Error('Unsupported type');
        }
        this.flush();
    }
    malloc(size) {
        if (this.buffer) {
            const l = this.buffer.length;
            const nl = l + size;
            if (nl <= this.buffer.byteLength) {
                this.buffer = new Uint8Array(this.buffer.buffer, 0, nl);
            }
            else {
                const n = new Uint8Array(nl);
                n.set(this.buffer);
                this.buffer = n;
            }
            return this.buffer.subarray(l, nl);
        }
        else {
            this.buffer = new Uint8Array(size);
            return this.buffer;
        }
    }
}
;
//# sourceMappingURL=index.js.map