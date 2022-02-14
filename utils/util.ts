export function isObj<
  T extends Record<string | number, any>,
>(
  obj: any,
): obj is T {
  return /^\[object\sObject\]$/.test(Object.prototype.toString.call(obj));
}

export function isStr(str: any): str is string {
  return typeof str === "string";
}
