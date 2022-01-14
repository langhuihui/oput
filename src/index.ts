
const Types = [[Uint8Array, Int8Array], [Uint16Array, Int16Array], [Uint32Array, Int32Array, Float32Array], [Float64Array]];

type InputTypes = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | ArrayBuffer;
type NeedTypes = InputTypes | number;
type ReturnType<T extends NeedTypes> = T extends number ? Uint8Array : T;
const OPutMap = new Map<Function, number>();
Types.forEach((t, i) => t.forEach((t) => OPutMap.set(t, i)));
export default class OPut {
  need: NeedTypes | void;
  buffer?: Uint8Array;
  resolve?: (v: any) => void;
  constructor(public g?: Generator<NeedTypes, void, InputTypes>) {
    if (g) this.need = g.next().value;
  }
  consume(n: number) {
    this.buffer!.copyWithin(0, n);
    this.buffer = this.buffer!.subarray(0, this.buffer!.length - n);
    this.flush();
  }
  read<T extends NeedTypes>(need: T) {
    this.need = need;
    if (this.resolve) this.resolve("read next before last done");
    return new Promise<ReturnType<T>>((resolve, reject) => {
      this.resolve = (data) => {
        this.resolve = reject;
        resolve(data);
      };
      this.flush();
    });
  }
  close() {
    if (this.g) this.g.return();
  }
  flush() {
    if (!this.buffer || !this.need) return;
    if (typeof this.need === 'number') {
      const n = this.need;
      if (this.buffer.length >= n) {
        if (this.g) this.need = this.g.next(this.buffer.subarray(0, n)).value;
        else if (this.resolve)
          this.resolve(this.buffer.subarray(0, n));
        else
          return;
        this.consume(n);
      }
    } else if (this.need instanceof ArrayBuffer) {
      const n = this.need.byteLength;
      if (this.buffer.length >= n) {
        new Uint8Array(this.need).set(this.buffer.subarray(0, n));
        if (this.g) this.need = this.g.next().value;
        else if (this.resolve)
          this.resolve(this.need);
        else
          return;
        this.consume(n);
      }
    } else if (OPutMap.has(this.need.constructor)) {
      const n = this.need.length << OPutMap.get(this.need.constructor)!;
      if (this.buffer.length >= n) {
        new Uint8Array(this.need.buffer, this.need.byteOffset).set(this.buffer.subarray(0, n));
        if (this.g) this.need = this.g.next().value;
        else if (this.resolve)
          this.resolve(this.need);
        else
          return;
        this.consume(n);
      }
    } else if (this.g) {
      this.g.throw(new Error('Unsupported type'));
    }
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
      if (nl <= this.buffer.byteLength) {
        this.buffer = new Uint8Array(this.buffer.buffer, 0, nl);
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