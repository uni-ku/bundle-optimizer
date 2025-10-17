import { Buffer } from 'node:buffer'

export default function padString(input: string): string {
  const segmentLength = 4
  const stringLength = input.length
  const diff = stringLength % segmentLength

  if (!diff) {
    return input
  }

  let position = stringLength
  let padLength = segmentLength - diff
  const paddedStringLength = stringLength + padLength
  const buffer = Buffer.alloc(paddedStringLength)

  buffer.write(input)

  while (padLength--) {
    buffer.write('=', position++)
  }

  return buffer.toString()
}
