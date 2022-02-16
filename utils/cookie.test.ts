import Cookie from "./cookie.ts";
import { assertEquals } from "https://deno.land/std@0.125.0/testing/asserts.ts";

const msg =
  "MUSIC_A_T=1491737722086; Max-Age=2147483647; Expires=Mon, 6 Mar 2090 09:10:00 GMT; Path=/weapi/feedback; Domain=.music.163.com, MUSIC_R_T=1491737750534; Max-Age=2147483647; Expires=Mon, 6 Mar 2090 09:10:00 GMT; Path=/api/feedback; Domain=.music.163.com";

Deno.test("Cookie constructor", () => {
  const cookie = new Cookie(msg.replace(/Domain=\.music\.163\.com,/g, ""));

  ["Path", "Max-Age", "Expires", "Domain", "HTTPOnly"].forEach((key) => {
    cookie.deleteByKey(key);
  });

  assertEquals(
    cookie.toString(),
    "MUSIC_A_T=1491737722086;MUSIC_R_T=1491737750534",
  );
});
