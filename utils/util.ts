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
// 判断一个对象是否为空
export function isEmptyObject(obj: { [key: string]: any }): boolean {
  for (const i in obj) {
    return false;
  }
  return true;
}
export function isTrulyValue(v: any): boolean {
  if (typeof v === "number") {
    return !(v === 0);
  } else {
    return !!v;
  }
}

export function isTrulyArg(...v: any[]): boolean {
  return v.every((item) => isTrulyValue(item));
}

/**
 * 判定表单有效值(指除了 undefined null '' [] {} 之外的值为有效值)
 *   @param {undefined |null | string | number | Array<any> | object} value 待判定值
 *   @param {boolean} isStrict 是否是严格模式
 */
export function hasFormItemValue(
  value: undefined | null | string | number | Array<any> | object,
  isStrict = false,
): boolean {
  if (!isEmptyOrNull(value)) {
    if (Array.isArray(value)) {
      if (isStrict) {
        return !!value.filter((item) => hasFormItemValue(item))
          .length;
      } else {
        return !!value.length;
      }
    }
    if (typeof value === "object") {
      return isEmptyObject(value);
    }
    return true;
  }
  return false;
}
