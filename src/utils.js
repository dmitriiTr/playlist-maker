// @ts-check
/**
 * @template T
 * @param {T[]} arr - source array
 * @param {(elem: T) => boolean} fn - filter function
 * @return {[T[], T[]]} array with truthy elementns and array with falsy elements
 */
export function partition(arr, fn) {
  /** * @type {T[]} */
  const trueArr = [];
  /** * @type {T[]} */
  const falseArr = [];

  arr.forEach((elem) => {
    if (fn(elem)) {
      trueArr.push(elem);
    } else {
      falseArr.push(elem);
    }
  });
  return [trueArr, falseArr];
}

/**
 * @param {string} filename
 * @return {string} extension
 */
export function getFileExtension(filename) {
  const substrings = filename.split(".");

  if (substrings.length < 2) {
    return "";
  }

  return substrings.at(-1) ?? "";
}
