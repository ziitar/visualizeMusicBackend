/**
 * Author:luolei
 * Module dependencies.
 * 简繁体转换
 */

import { S, T } from "./lang/zh.ts";

/**
 * 转换文本
 * @param {String} str - 待转换的文本
 * @param {Boolean} toT - 是否转换成繁体
 * @returns {String} - 转换结果
 */

function tranStr(str: string, toT: boolean) {
  let i;
  let letter;
  let code;
  let isChinese;
  let index;
  let src;
  let des;
  let result = "";

  if (toT) {
    src = S;
    des = T;
  } else {
    src = T;
    des = S;
  }

  if (typeof str !== "string") {
    return str;
  }

  for (i = 0; i < str.length; i++) {
    letter = str.charAt(i);
    code = str.charCodeAt(i);
    // 根据字符的Unicode判断是否为汉字，以提高性能
    isChinese = (code > 0x3400 && code < 0x9fc3) ||
      (code > 0xf900 && code < 0xfa6a);
    if (!isChinese) {
      result += letter;
      continue;
    }

    index = src.indexOf(letter);

    if (index !== -1) {
      result += des.charAt(index);
    } else {
      result += letter;
    }
  }

  return result;
}

export function s2t(str: string) {
  return tranStr(str, true);
}
export function t2s(str: string) {
  return tranStr(str, false);
}
