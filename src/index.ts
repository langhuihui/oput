
const Types = [[Uint8Array, Int8Array], [Uint16Array, Int16Array], [Uint32Array, Int32Array, Float32Array], [Float64Array]];

type InputTypes = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | ArrayBuffer;
type NeedTypes = InputTypes | number;
type ReturnType<T extends NeedTypes> = T extends number ? Uint8Array : T;
const OPutMap = new Map<Function, number>();
Types.forEach((t, i) => t.forEach((t) => OPutMap.set(t, i)));
export default class OPut {
  need?: NeedTypes | void;
  consumed = 0;
  buffer?: Uint8Array;
  resolve?: (v: any) => void;
  constructor(public g?: Generator<NeedTypes, void, InputTypes>) {
    if (g) this.need = g.next().value;
  }
  async fillFromReader<T extends InputTypes>(source: ReadableStreamDefaultReader<T>): Promise<void> {
    const { done, value } = await source.read();
    if (done) {
      this.close();
      return;
    } else {
      this.write(value!);
      return this.fillFromReader(source);
    }
  };
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
  read<T extends NeedTypes>(need: T) {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      if (this.resolve) return reject("last read not complete yet");
      this.resolve = (data) => {
        delete this.resolve;
        delete this.need;
        resolve(data);
      };
      this.demand(need, true);
    });
  }
  close() {
    if (this.g) this.g.return();
  }
  flush(): InputTypes | undefined {
    if (!this.buffer || !this.need) return;
    let returnValue: InputTypes | null = null;
    const unread = this.buffer.subarray(this.consumed);
    let n = 0;
    if (typeof this.need === 'number') {
      n = this.need;
      if (unread.length < n) return;
      returnValue = unread.subarray(0, n);
    } else if (this.need instanceof ArrayBuffer) {
      n = this.need.byteLength;
      if (unread.length < n) return;
      new Uint8Array(this.need).set(unread.subarray(0, n));
      returnValue = this.need;
    } else if (OPutMap.has(this.need.constructor)) {
      n = this.need.length << OPutMap.get(this.need.constructor)!;
      if (unread.length < n) return;
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
  write(value: InputTypes): void {
    if (value instanceof ArrayBuffer) {
      this.malloc(value.byteLength).set(new Uint8Array(value));
    } else if (OPutMap.has(value.constructor)) {
      const container = this.malloc(value.length << OPutMap.get(value.constructor)!);
      container.set(new Uint8Array(value.buffer, value.byteOffset, container.length));
    } else {
      throw new Error('Unsupported type');
    }
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