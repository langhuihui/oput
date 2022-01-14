declare type InputTypes = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | ArrayBuffer;
declare type NeedTypes = InputTypes | number;
export default class OPut {
    g: Generator<NeedTypes, void, InputTypes>;
    need: NeedTypes | void;
    buffer?: Uint8Array;
    constructor(g: Generator<NeedTypes, void, InputTypes>);
    consume(n: number): void;
    flush(): void;
    write(value: InputTypes): void;
    malloc(size: number): Uint8Array;
}
export {};
