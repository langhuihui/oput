
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
  demand(n: NeedTypes | void) {
    if (this.consumed) {
      this.buffer!.copyWithin(0, this.consumed);
      this.buffer = this.buffer!.subarray(0, this.buffer!.length - this.consumed);
      this.consumed = 0;
    }
    this.need = n;
    this.flush();
  }
  read<T extends NeedTypes>(need: T) {
    if (this.resolve) Promise.reject("last read not complete yet");
    return new Promise<ReturnType<T>>((resolve, reject) => {
      this.resolve = (data) => {
        delete this.resolve;
        delete this.need;
        console.log(data)
        resolve(data);
      };
      this.demand(need);
    });
  }
  close() {
    if (this.g) this.g.return();
  }
  flush() {
    if (!this.buffer || !this.need) return;
    let returnValue: InputTypes | null = null;
    if (typeof this.need === 'number') {
      if (this.buffer.length >= this.need) {
        this.consumed = this.need;
        returnValue = this.buffer.subarray(0, this.consumed);
      }
    } else if (this.need instanceof ArrayBuffer) {
      if (this.buffer.length >= this.need.byteLength) {
        this.consumed = this.need.byteLength;
        new Uint8Array(this.need).set(this.buffer.subarray(0, this.consumed));
        returnValue = this.need
      }
    } else if (OPutMap.has(this.need.constructor)) {
      const n = this.need.length << OPutMap.get(this.need.constructor)!;
      if (this.buffer.length >= n) {
        this.consumed = n;
        new Uint8Array(this.need.buffer, this.need.byteOffset).set(this.buffer.subarray(0, n));
        returnValue = this.need
      }
    } else if (this.g) {
      this.g.throw(new Error('Unsupported type'));
    }
    if (returnValue) {
      if (this.g) this.demand(this.g.next(returnValue).value);
      else if (this.resolve)
        this.resolve(returnValue);
      else this.consumed = 0;
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