import OPut from '../src/index';
test('number', () => {
  function* reader(): Generator<number, void, Uint8Array> {
    let b = yield 5;
    expect(b.length).toBe(5);
    expect(b.constructor).toBe(Uint8Array);
    b = yield 3;
    expect(b.length).toBe(3);
    expect(b.constructor).toBe(Uint8Array);
  }
  const oput = new OPut(reader());
  oput.write(new Uint32Array([1, 2]));
});
test('Uint8Array', () => {
  function* reader(): Generator<Uint8Array, void, Uint8Array> {
    let b = new Uint8Array(3);
    yield b;
    expect(b[0]).toBe(1);
    b = new Uint8Array(5);
    yield b;
    expect(b[1]).toBe(2);
  }
  const oput = new OPut(reader());
  //01 00 00 00 02 00 00 00
  oput.write(new Uint32Array([1, 2]));
});

test('ArrayBuffer', () => {
  function* reader(): Generator<ArrayBuffer, void, ArrayBuffer> {
    let b = new ArrayBuffer(3);
    yield b;
    expect(new Uint8Array(b)[0]).toBe(1);
    b = new ArrayBuffer(5);
    yield b;
    expect(new Uint8Array(b)[1]).toBe(2);
  }
  const oput = new OPut(reader());
  //01 00 00 00 02 00 00 00
  oput.write(new Uint32Array([1, 2]));
});

test('malloc', () => {
  function* reader(): Generator<Uint16Array, void, Uint16Array> {
    let b = new Uint16Array(2);
    yield b;
    expect(b[0]).toBe(1);
    b = new Uint16Array(3);
    yield b;
    expect(b[0]).toBe(2);
  }
  const oput = new OPut(reader());
  //01 00 00 00 02 00 00 00
  oput.write(new Uint32Array([1, 2]));
  oput.write(new Uint32Array([1, 2]));
});