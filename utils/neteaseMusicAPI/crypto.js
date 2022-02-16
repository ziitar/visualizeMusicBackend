// 参考 https://github.com/darknessomi/musicbox/wiki/
import { encode as base64Encode } from 'https://deno.land/std@0.125.0/encoding/base64.ts'
import * as B from 'https://deno.land/x/bigint@v0.3/mod.ts'
import { encode as hexEncode } from 'https://deno.land/std@0.125.0/encoding/hex.ts'

const modulus =
  '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7'
const nonce = '0CoJUm6Qyw8W8jud'
const pubKey = '010001'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

/**
 * 生成16位随机字符串
*/
export function createSecretKey(size) {
  const keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = ''
  for (let i = 0; i < size; i++) {
    let pos = Math.random() * keys.length
    pos = Math.floor(pos)
    key = key + keys.charAt(pos)
  }
  return key
}

/**
 *  AES-CBC 明文加密方法 
 * @param {string} text 明文
 * @param {string} secKey 公钥
 * @returns base64编码的密文
 */
export async function aesEncrypt(text, secKey) {
  const _text = textEncoder.encode(text)
  const lv = textEncoder.encode('0102030405060708')
  const _secKey = textEncoder.encode(secKey)

  const importKey = await crypto.subtle.importKey(
    'raw',
    _secKey,
    'AES-CBC',
    true,
    ['encrypt']
  )

  const encryptArrayBuffer = await crypto.subtle.encrypt({
    name: 'AES-CBC',
    iv: lv,
  }, importKey, _text)

  return base64Encode(encryptArrayBuffer)
}

/**
 * RSA 公钥加密方法
 * @param {string} text 密钥的明文字符串
 * @param {string} pubKey 公共key的16进制字符串
 * @param {string} modulus N的16进制字符串
 * @returns 256位16进制字符串
 */
export function rsaEncrypt(text, pubKey, modulus) {
  const _text = text.split('').reverse().join('');
  
  const biText = BigInt(`0x${textDecoder.decode(hexEncode(textEncoder.encode(_text)))}`),
    biEx = BigInt(`0x${pubKey}`),
    biMod = BigInt(`0x${modulus}`),
    biRet = B.modPow(biText, biEx, biMod);
  return biRet.toString(16).padStart(256,'0')
}

/**
 * 整合加密程序
 * @param {object} obj 待加密的明文对象
 * @param {string} [secKeyde]  公钥 可选
 * @returns 网易云音乐接口所需的 params和encSecKey
 */
export default async function Encrypt(obj, secKeyde) {
  const text = JSON.stringify(obj)
  const secKey =  secKeyde || createSecretKey(16)
  const encryptStep1 = await aesEncrypt(text, nonce)
  const encText = await aesEncrypt(encryptStep1, secKey)
  const encSecKey = rsaEncrypt(secKey, pubKey, modulus)
  return {
    params: encText,
    encSecKey: encSecKey
  }
}
