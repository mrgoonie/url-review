import { toFloat } from "diginext-utils/dist/object";

export function roundPrice(price: number | string) {
  return Math.round(toFloat(price) * 1000000 * 100) / 100;
}

export function roundDecimal(num: number | string, maxDecimal = 2) {
  return Math.ceil(toFloat(num) * Math.pow(10, maxDecimal)) / Math.pow(10, maxDecimal);
}
