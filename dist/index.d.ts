declare type InputTypes = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | ArrayBuffer;
declare type NeedTypes = InputTypes | number;
declare type ReturnType<T extends NeedTypes> = T extends number ? Uint8Array : T;
export default class OPut {
    g?: Generator<NeedTypes, void, InputTypes> | undefined;
    need?: NeedTypes | void;
    consumed: number;
    buffer?: Uint8Array;
    resolve?: (v: any) => void;
    constructor(g?: Generator<NeedTypes, void, InputTypes> | undefined);
    fillFromReader<T extends InputTypes>(source: ReadableStreamDefaultReader<T>): Promise<void>;
    demand(n: NeedTypes | void): void;
    read<T extends NeedTypes>(need: T): Promise<ReturnType<T>>;
    close(): void;
    flush(): void;
    write(value: InputTypes): void;
    malloc(size: number): Uint8Array;
}
export {};
