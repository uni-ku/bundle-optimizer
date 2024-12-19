// `rollup/rust/xxhash/src/lib.rs` 的 `node` 实现
// <https://github.com/rollup/rollup/blob/master/rust/xxhash/src/lib.rs>
// <https://github.com/rollup/rollup/blob/master/src/utils/crypto.ts>

import { Buffer } from 'node:buffer'
import { xxh3 } from '@node-rs/xxhash'
import { toString } from './base_encode'

// 将 `BigInt` 转换为小端字节序的 `Uint8Array` ｜ 对标 rust 中的 `u128.to_le_bytes()`
function toLeBytes(value: bigint, byteLength: number): Uint8Array {
  const buffer = Buffer.alloc(byteLength)
  buffer.writeBigUInt64LE(value & BigInt('0xFFFFFFFFFFFFFFFF'), 0)
  buffer.writeBigUInt64LE(value >> BigInt(64), 8)
  return new Uint8Array(buffer)
}

// 定义字符集
const CHARACTERS_BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const CHARACTERS_BASE36 = 'abcdefghijklmnopqrstuvwxyz0123456789'
const CHARACTERS_BASE16 = '0123456789abcdef'

// 计算哈希值并编码为 Base64 URL 格式
export function xxhashBase64Url(input: Uint8Array) {
  const hashBigInt = xxh3.xxh128(input)
  const hashBuffer = toLeBytes(hashBigInt, 16)

  return toString(new Uint8Array(hashBuffer), 64, CHARACTERS_BASE64)
}

// 计算哈希值并编码为 Base36 格式
export function xxhashBase36(input: Uint8Array) {
  const hashBigInt = xxh3.xxh128(input)
  const hashBuffer = toLeBytes(hashBigInt, 16)
  return toString(new Uint8Array(hashBuffer), 36, CHARACTERS_BASE36)
}

// 计算哈希值并编码为 Base16 格式
export function xxhashBase16(input: Uint8Array) {
  const hashBigInt = xxh3.xxh128(input)
  const hashBuffer = toLeBytes(hashBigInt, 16)
  return toString(new Uint8Array(hashBuffer), 16, CHARACTERS_BASE16)
}
