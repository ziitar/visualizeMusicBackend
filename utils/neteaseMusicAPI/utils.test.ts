import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import Encrypt, { aesEncrypt, rsaEncrypt } from "./crypto.js";

const modulus =
  "00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7";
const nonce = "0CoJUm6Qyw8W8jud";
const pubKey = "010001";

Deno.test("Encrypt", async () => {
  const h = await Encrypt(
    { "csrf_token": "610626cd462ba46ffa0538198ca8fb2a" },
    "DG0zlPP5yXbioQa0",
  );
  assertEquals(
    `${h.params}——${h.encSecKey}`,
    "TK2WNAjF1R//AV/97kOGpkozS7kHHETgyIG0mttFmnm7s4ZStFc+PsWevs9a7wJ49o8619h0jyLV8xYS1BtYqclMlK3Nw1O6p/Kyvh0XXO8EZ+G9yzjM+sewMa7BJp/B" +
      "——" +
      "056cc024e6f51fabf8c01d4ed01b14adf4c9e0d1e93b41ca0491f6641448d8ed344f9e47fcd84e12ef2e70a930757ea54f44f7fc7a4b62a4b738a32209f7b7ad1eca9ee6962cf4924dc09b0a7a69380000a4e0afcbc9336f3e88f141fe9839bda06f24f9bfd92fab964cd224226739a1b3e82dee29438e78e686c6502cf1d93d",
  );
});

Deno.test("aesEncrypt", async () => {
  const aesEncryptText1 = await aesEncrypt(
    '{"csrf_token":"610626cd462ba46ffa0538198ca8fb2a"}',
    nonce,
  );
  const aesEncryptText2 = await aesEncrypt(aesEncryptText1, "DG0zlPP5yXbioQa0");
  assertEquals(
    aesEncryptText2,
    "TK2WNAjF1R//AV/97kOGpkozS7kHHETgyIG0mttFmnm7s4ZStFc+PsWevs9a7wJ49o8619h0jyLV8xYS1BtYqclMlK3Nw1O6p/Kyvh0XXO8EZ+G9yzjM+sewMa7BJp/B",
  );
});
Deno.test("rsaEncrypt", () => {
  assertEquals(
    rsaEncrypt("DG0zlPP5yXbioQa0", pubKey, modulus),
    "056cc024e6f51fabf8c01d4ed01b14adf4c9e0d1e93b41ca0491f6641448d8ed344f9e47fcd84e12ef2e70a930757ea54f44f7fc7a4b62a4b738a32209f7b7ad1eca9ee6962cf4924dc09b0a7a69380000a4e0afcbc9336f3e88f141fe9839bda06f24f9bfd92fab964cd224226739a1b3e82dee29438e78e686c6502cf1d93d",
  );
});
