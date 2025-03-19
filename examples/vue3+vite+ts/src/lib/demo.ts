/* eslint-disable ts/no-namespace */
import { styleText } from "@https-enable/colors"

export namespace MathUtils {
  export const add = (a: number, b: number) => {
    return styleText(["bgBrightYellow", "underline", "cyan"], `${a} + ${b} = ${a + b}`)
  }
}