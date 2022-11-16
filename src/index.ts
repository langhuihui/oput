const U32 = Symbol(32);
const U16 = Symbol(16);
const U8 = Symbol(8);
export type InputTypes = ArrayBufferView | ArrayBufferLike;
export type NeedTypes = InputTypes | number | typeof U32 | typeof U16 | typeof U8;
export type ReturnType<T extends NeedTypes> = T extends number ? Uint8Array : T extends (typeof U32 | typeof U16 | typeof U8) ? number : T;
export default class OPut {
  static U32: typeof U32 = U32;
  static U16: typeof U16 = U16;
  static U8: typeof U8 = U8;
  need?: NeedTypes | void;
  consumed = 0;
  buffer?: Uint8Array;
  resolve?: (v: any) => void;
  reject?: (err: any) => void;
  lastReadPromise?: Promise<any>;
  pull?: (v: any) => void;
  constructor(public g?: Generator<NeedTypes, void, InputTypes | number>) {
    if (g) this.need = g.next().value;
  }
  setG(g: Generator<NeedTypes, void, InputTypes | number>) {
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
  demand<T extends NeedTypes>(n: T | void, consume?: boolean): ReturnType<T> | undefined {
    if (consume) this.consume();
    this.need = n;
    return this.flush() as ReturnType<T>;
  }
  async read<T extends NeedTypes>(need: T) {
    if (this.lastReadPromise) {
      await this.lastReadPromise;
    }
    return this.lastReadPromise = new Promise<ReturnType<T>>((resolve, reject) => {
      this.reject = reject;
      this.resolve = (data) => {
        delete this.lastReadPromise;
        delete this.resolve;
        delete this.need;
        resolve(data);
      };
      const result = this.demand(need, true);
      if (!result) this.pull?.(need);//已饥饿，等待数据
    });
  }
  readU32(): Promise<number> {
    return this.read(U32);
  }
  readU16(): Promise<number> {
    return this.read(U16);
  }
  readU8(): Promise<number> {
    return this.read(U8);
  }
  close() {
    if (this.g) this.g.return();
    if (this.buffer) this.buffer.subarray(0, 0);
    this.reject?.(new Error('EOF'));
    delete this.lastReadPromise;
  }
  flush(): InputTypes | number | undefined {
    if (!this.buffer || !this.need) return;
    let returnValue: ReturnType<typeof this.need> | null = null;
    const unread = this.buffer.subarray(this.consumed);
    let n = 0;
    const notEnough = (x: number) => unread.length < (n = x);
    if (typeof this.need === 'number') {
      if (notEnough(this.need)) return;
      returnValue = unread.subarray(0, n);
    } else if (this.need === U32) {
      if (notEnough(4)) return;
      returnValue = (unread[0] << 24) | (unread[1] << 16) | (unread[2] << 8) | unread[3];
    } else if (this.need === U16) {
      if (notEnough(2)) return;
      returnValue = (unread[0] << 8) | unread[1];
    } else if (this.need === U8) {
      if (notEnough(1)) return;
      returnValue = unread[0];
    } else if (!('buffer' in this.need)) {
      if (notEnough(this.need.byteLength)) return;
      new Uint8Array(this.need).set(unread.subarray(0, n));
      returnValue = this.need;
    } else if ('byteOffset' in this.need) {
      if (notEnough(this.need.byteLength - this.need.byteOffset)) return;
      new Uint8Array(this.need.buffer, this.need.byteOffset).set(unread.subarray(0, n));
      returnValue = this.need;
    } else if (this.g) {
      this.g.throw(new Error('Unsupported type'));
      return;
    }
    this.consumed += n;
    if (this.g) this.demand(this.g.next(returnValue!).value, true);
    else if (this.resolve)
      this.resolve(returnValue);
    return returnValue!;
  }
  write(value: InputTypes) {
    if(value instanceof Uint8Array){
      this.malloc(value.length).set(value);
    } else if ('buffer' in value) {
      this.malloc(value.byteLength).set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
    } else {
      this.malloc(value.byteLength).set(new Uint8Array(value));
    }
    if (this.g || this.resolve) this.flush();
    //富余，需要等到饥饿
    else return new Promise<void>((resolve) => this.pull = resolve);
  }
  writeU32(value: number) {
    this.malloc(4).set([(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]);
    this.flush();
  }
  writeU16(value: number) {
    this.malloc(2).set([(value >> 8) & 0xff, value & 0xff]);
    this.flush();
  }
  writeU8(value: number) {
    this.malloc(1)[0] = value;
    this.flush();
  }
  malloc(size: number): Uint8Array {
    if (this.buffer) {
      const l = this.buffer.length;
      const nl = l + size;
      if (nl <= this.buffer.buffer.byteLength - this.buffer.byteOffset) {
        this.buffer = new Uint8Array(this.buffer.buffer, this.buffer.byteOffset, nl);
      } else {
        const n = new Uint8Array(nl);
        n.set(this.buffer);
        this.buffer = n;
      }
      return this.buffer.subarray(l, nl);
    } else {
      this.buffer = new Uint8Array(size);
      return this.buffer;
    }
  }
};