var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const U32 = Symbol(32);
const U16 = Symbol(16);
const U8 = Symbol(8);
export default class OPut {
    constructor(g) {
        this.g = g;
        this.consumed = 0;
        if (g)
            this.need = g.next().value;
    }
    setG(g) {
        this.g = g;
        this.demand(g.next().value, true);
    }
    consume() {
        if (this.buffer && this.consumed) {
            this.buffer.copyWithin(0, this.consumed);
            this.buffer = this.buffer.subarray(0, this.buffer.length - this.consumed);
            this.consumed = 0;
        }
    }
    demand(n, consume) {
        if (consume)
            this.consume();
        this.need = n;
        return this.flush();
    }
    read(need) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.lastReadPromise) {
                yield this.lastReadPromise;
            }
            return this.lastReadPromise = new Promise((resolve, reject) => {
                var _a;
                this.reject = reject;
                this.resolve = (data) => {
                    delete this.lastReadPromise;
                    delete this.resolve;
                    delete this.need;
                    resolve(data);
                };
                const result = this.demand(need, true);
                if (!result)
                    (_a = this.pull) === null || _a === void 0 ? void 0 : _a.call(this, need); //已饥饿，等待数据
            });
        });
    }
    readU32() {
        return this.read(U32);
    }
    readU16() {
        return this.read(U16);
    }
    readU8() {
        return this.read(U8);
    }
    close() {
        var _a;
        if (this.g)
            this.g.return();
        if (this.buffer)
            this.buffer.subarray(0, 0);
        (_a = this.reject) === null || _a === void 0 ? void 0 : _a.call(this, new Error('EOF'));
        delete this.lastReadPromise;
    }
    flush() {
        if (!this.buffer || !this.need)
            return;
        let returnValue = null;
        const unread = this.buffer.subarray(this.consumed);
        let n = 0;
        const notEnough = (x) => unread.length < (n = x);
        if (typeof this.need === 'number') {
            if (notEnough(this.need))
                return;
            returnValue = unread.subarray(0, n);
        }
        else if (this.need === U32) {
            if (notEnough(4))
                return;
            returnValue = (unread[0] << 24) | (unread[1] << 16) | (unread[2] << 8) | unread[3];
        }
        else if (this.need === U16) {
            if (notEnough(2))
                return;
            returnValue = (unread[0] << 8) | unread[1];
        }
        else if (this.need === U8) {
            if (notEnough(1))
                return;
            returnValue = unread[0];
        }
        else if (!('buffer' in this.need)) {
            if (notEnough(this.need.byteLength))
                return;
            new Uint8Array(this.need).set(unread.subarray(0, n));
            returnValue = this.need;
        }
        else if ('byteOffset' in this.need) {
            if (notEnough(this.need.byteLength - this.need.byteOffset))
                return;
            new Uint8Array(this.need.buffer, this.need.byteOffset).set(unread.subarray(0, n));
            returnValue = this.need;
        }
        else if (this.g) {
            this.g.throw(new Error('Unsupported type'));
            return;
        }
        this.consumed += n;
        if (this.g)
            this.demand(this.g.next(returnValue).value, true);
        else if (this.resolve)
            this.resolve(returnValue);
        return returnValue;
    }
    write(value) {
        if ('buffer' in value) {
            this.malloc(value.byteLength).set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
        }
        else {
            this.malloc(value.byteLength).set(new Uint8Array(value));
        }
        if (this.g || this.resolve)
            this.flush();
        //富余，需要等到饥饿
        if (!this.resolve)
            return new Promise((resolve) => this.pull = resolve);
    }
    writeU32(value) {
        this.malloc(4).set([(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]);
        this.flush();
    }
    writeU16(value) {
        this.malloc(2).set([(value >> 8) & 0xff, value & 0xff]);
        this.flush();
    }
    writeU8(value) {
        this.malloc(1)[0] = value;
        this.flush();
    }
    malloc(size) {
        if (this.buffer) {
            const l = this.buffer.length;
            const nl = l + size;
            if (nl <= this.buffer.buffer.byteLength - this.buffer.byteOffset) {
                this.buffer = new Uint8Array(this.buffer.buffer, this.buffer.byteOffset, nl);
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
OPut.U32 = U32;
OPut.U16 = U16;
OPut.U8 = U8;
;
//# sourceMappingURL=index.js.map