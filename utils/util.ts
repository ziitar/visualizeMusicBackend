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
type EmptyOrNull = undefined | null | "";
export function isEmptyOrNull(v: any): v is EmptyOrNull {
  // 判断字符串是否为空
  return typeof v === "undefined" || v === "" || v === null ? true : false;
}

export function isTrulyValue(v: any): v is true {
  if (typeof v === "number") {
    return !(v === 0);
  } else {
    return !!v;
  }
}

export function isTrulyArg(...v: any[]): boolean {
  return v.every((item) => isTrulyValue(item));
}
