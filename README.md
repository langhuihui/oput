# 0 put do 零存整取库
[![codecov](https://codecov.io/gh/langhuihui/oput/branch/master/graph/badge.svg)](https://codecov.io/gh/langhuihui/oput)
该库旨在解决js需要缓存内存块来解决接收不定长度的数据，取出不定长度的数据的问题。例如tcp的粘包问题。

## 典型需求

接收一个远程请求，不断接收到不定长度的数据，然后根据协议解析到长度字段，然后读取一段长度来解包，此时可能缓存不够，需要等待继续接收数据，如果缓存够了，则读取长度后，需要修改缓存为剩余的数据

> 用核酸筛查来比喻，陆续有人来排队，需要排满10人为一组进行采样。

## 安装
```shell
$ npm install oput
```

## 使用

分成生产端和消费端，生产端负责向OPut中写入数据（TypedArray或者ArrayBuffer）。
```ts
import OPut from 'oput'
const oput = new OPut(reader)
oput.write(new Uint32Array([1,2,3]))
```

消费端负责从OPut中读取数据。根据实际需要可以选择两种读取模式。

### 模式一：按字节数读取，返回缓冲中头部N个字节的数据
读取出来的是Uint8Array对象，要及时处理，后续读取出的数据会覆盖前面的数据。
```js
function *reader(){
  let b = yield 5;//读取5个字节
  console.log(b[0])
}
```

### 模式二：向生产者提供TypedArray对象，接收数据
可以自行选择是否复用TypedArray对象
```js
function *reader(){
  let b = new Uint8Array(5);
  yield b;//填充到b中
  console.log(b[0])
}
```
```js
function *reader(){
  let b = new Uint32Array(5);
  yield b;//填充到b中,一共读取了20个字节
  console.log(b[0])
}
```