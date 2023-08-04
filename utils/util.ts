import { Nullable, TAndNull } from "./music/exec.ts";
import { Context, State } from "https://deno.land/x/oak@v12.2.0/mod.ts";
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
  if (v === 0) {
    return true;
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
export function convertInvalidValueForStore<
  T,
>(value: T): TAndNull<T> {
  if (value === undefined) {
    return null as TAndNull<T>;
  }
  return value as TAndNull<T>;
}
export function filterInvalidValueForStore<T extends Record<string, any>>(
  value: T,
): Nullable<T> {
  // @ts-ignore
  const obj: Nullable<T> = {
    ...value,
  };
  for (const [key, item] of Object.entries(value)) {
    obj[key as keyof T] = convertInvalidValueForStore(item);
  }
  return obj;
}

export function setResponseBody<
  S extends State,
  T,
>(ctx: Context<S>, status: number, body: T): void;
export function setResponseBody<
  S extends State,
  T,
>(ctx: Context<S>, status: number, body: T, msg?: string): void;
export function setResponseBody<
  S extends State,
  T,
>(ctx: Context<S>, status: number, body: T, flag?: 0 | 1): void;
export function setResponseBody<
  S extends State,
  T,
>(ctx: Context<S>, status: number, body: T, flag?: 0 | 1, msg?: string): void;
export function setResponseBody<
  S extends State,
  T,
>(
  ctx: Context<S>,
  status: number,
  body: T,
  flag?: 0 | 1 | string,
  msg?: string,
) {
  if (typeof flag !== "number") {
    msg = flag;
    if (status >= 200 && status <= 299) {
      flag = 1;
    } else {
      flag = 0;
    }
  }
  ctx.response.status = status;
  ctx.response.body = {
    code: status,
    result: body,
    status: flag,
    msg: msg,
  };
}

export function formatUrl(url: string) {
  url = decodeURIComponent(url);
  const reg = /\.\.\/|\.\.\\/g;
  let exec = reg.test(url);
  while (exec) {
    url = url.replace(reg, "");
    exec = reg.test(url);
  }
  return url;
}
