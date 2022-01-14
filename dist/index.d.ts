declare type InputTypes = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | ArrayBuffer;
declare type NeedTypes = InputTypes | number;
declare type ReturnType<T extends NeedTypes> = T extends number ? Uint8Array : T;
export default class OPut {
    g?: Generator<NeedTypes, void, InputTypes> | undefined;
    need: NeedTypes | void;
    buffer?: Uint8Array;
    resolve?: (v: any) => void;
    constructor(g?: Generator<NeedTypes, void, InputTypes> | undefined);
    consume(n: number): void;
    read<T extends NeedTypes>(need: T): Promise<ReturnType<T>>;
    close(): void;
    flush(): void;
    write(value: InputTypes): void;
    malloc(size: number): Uint8Array;
}
export {};
