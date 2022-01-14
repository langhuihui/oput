
const Types = [[Uint8Array, Int8Array], [Uint16Array, Int16Array], [Uint32Array, Int32Array, Float32Array], [Float64Array]];

type InputTypes = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | ArrayBuffer;
type NeedTypes = InputTypes | number;
const OPutMap = new Map<Function, number>();
Types.forEach((t, i) => t.forEach((t) => OPutMap.set(t, i)));
export default class OPut {
  need: NeedTypes | void;
  buffer?: Uint8Array;
  constructor(public g: Generator<NeedTypes, void, InputTypes>) {
    this.need = g.next().value;
  }
  consume(n: number) {
    this.buffer!.copyWithin(0, n);
    this.buffer = this.buffer!.subarray(0, this.buffer!.length - n);
    this.flush();
  }
  close(){
    this.g.return();
  }
  flush() {
    if (!this.buffer || !this.need) return;
    if (typeof this.need === 'number') {
      const n = this.need;
      if (this.buffer.length >= n) {
        this.need = this.g.next(this.buffer.subarray(0, n)).value;
        this.consume(n);
      }
    } else if (this.need instanceof ArrayBuffer) {
      const n = this.need.byteLength;
      if (this.buffer.length >= n) {
        new Uint8Array(this.need).set(this.buffer.subarray(0, n));
        this.need = this.g.next().value;
        this.consume(n);
      }
    } else if (OPutMap.has(this.need.constructor)) {
      const n = this.need.length << OPutMap.get(this.need.constructor)!;
      if (this.buffer.length >= n) {
        new Uint8Array(this.need.buffer, this.need.byteOffset).set(this.buffer.subarray(0, n));
        this.need = this.g.next().value;
        this.consume(n);
      }
    } else {
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