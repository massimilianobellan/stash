type AnyObject = Record<string, unknown>;

function arrayShallowEqual<T>(a: T[], b: T[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((_, index): boolean => {
    return shallowEqual(a[index], b[index]);
  });
}

function objectShallowEqual(a: AnyObject, b: AnyObject) {
  if (a === b) return true;
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();

  const sortedA = aKeys.map((key) => a[key]);
  const sortedB = bKeys.map((key) => b[key]);

  return arrayShallowEqual(sortedA, sortedB);
}

function isPlainObject(value: unknown): value is AnyObject {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Checks if the two parameters are shallow equal or not.
 *
 * @param a Variable to check a
 * @param b Variable to check b
 * @returns true or false if the variables are shallowly equal or not
 *
 * @example
 * const equal = shallowEqual(0, 0) // true
 * const equal = shallowEqual(0, 1) // false
 * const equal = shallowEqual({a : 0}, {a: 0}) // true
 * const equal = shallowEqual({a : 0}, {a: 1}) // false
 */
export function shallowEqual<T>(a: T, b: T) {
  if (Object.is(a, b)) return true;

  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayShallowEqual(a, b);
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    return objectShallowEqual(a, b);
  }

  return false;
}
