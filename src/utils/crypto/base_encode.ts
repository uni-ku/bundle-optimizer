// <https://docs.rs/base-encode/latest/base_encode/index.html>

import { Buffer } from 'node:buffer'

// 将字节数组编码为指定基数的字符串
export function encode(buf: Uint8Array, base: number): number[] {
  let num = BigInt(`0x${Buffer.from(buf).toString('hex')}`)
  const digits: number[] = []

  while (num > 0) {
    digits.push(Number(num % BigInt(base)))
    num = num / BigInt(base)
  }

  const zeros = buf.findIndex(byte => byte !== 0)
  if (zeros !== -1) {
    digits.push(...Array.from<number>({ length: zeros }).fill(0))
  }

  digits.reverse()
  return digits
}

// 将指定基数的编码字符串解码为字节数组
export function decode(buf: number[], base: number): Uint8Array | null {
  let num = BigInt(0)
  const zeros = buf.findIndex(digit => digit !== 0)
  if (zeros !== -1) {
    num = BigInt(zeros)
  }

  for (const digit of buf) {
    if (digit >= base) {
      return null
    }
    num = num * BigInt(base) + BigInt(digit)
  }

  const hex = num.toString(16)
  const bytes = Buffer.from(hex.length % 2 ? `0${hex}` : hex, 'hex')
  return new Uint8Array(bytes)
}

// 将字节数组转换为指定字符表的字符串
export function toString(buf: Uint8Array, base: number, chars: string): string | null {
  return encode(buf, base)
    .map(digit => chars[digit])
    .join('')
}

// 将指定字符表的字符串转换为字节数组
export function fromStr(string: string, base: number, chars: string): Uint8Array | null {
  const buf = Array.from(string).map(char => chars.indexOf(char))
  return decode(buf, base)
}

// // 测试代码
// const data = new Uint8Array([0x27, 0x10])
// console.log(encode(data, 10)) // [1, 0, 0, 0, 0]

// console.log('Decoded:', fromStr('255', 10, '0123456789'))
// console.log('Encoded:', toString(new Uint8Array([0xA]), 2, 'OX')) // XOXO
