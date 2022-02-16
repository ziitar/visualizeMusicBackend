import Encrypt from "./crypto.js";
import request from "../request/index.ts";
import Cookie from "../cookie.ts";

function randomUserAgent() {
  const userAgentList = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
    "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 5.1.1; Nexus 6 Build/LYZ28E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89;GameHelper",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/603.2.4 (KHTML, like Gecko) Version/10.1.1 Safari/603.2.4",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:46.0) Gecko/20100101 Firefox/46.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:46.0) Gecko/20100101 Firefox/46.0",
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)",
    "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
    "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Win64; x64; Trident/6.0)",
    "Mozilla/5.0 (Windows NT 6.3; Win64, x64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/13.10586",
    "Mozilla/5.0 (iPad; CPU OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1",
  ];
  const num = Math.floor(Math.random() * userAgentList.length);
  return userAgentList[num];
}

export async function createWebAPIRequest<
  T extends Record<string | number, any>,
>(
  host: string,
  path: string,
  data: Record<string | number, any>,
  cookie: string,
  method: string,
  callback: (res: T, cookie: string) => Promise<void>,
  errorcallback: (e: Error) => Promise<void>,
): Promise<void> {
  const requestCookie = new Cookie(cookie);
  const csrf_token = requestCookie.get("__csrf") || "";
  const cryptoreq = await Encrypt({
    ...data,
    csrf_token,
  });
  const body = new URLSearchParams(cryptoreq);
  const options = {
    url: `http://${host}${path}`,
    method: method,
    headers: {
      Accept: "*/*",
      "Accept-Language": "zh-CN,zh;q=0.8,gl;q=0.6,zh-TW;q=0.4",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: "http://music.163.com",
      Host: "music.163.com",
      Cookie: cookie,
      "User-Agent": randomUserAgent(),
    },
    body: body,
  };

  try {
    const res = await request(options);
    //格式化 网易云 cookie
    const setCookie: string | null = res.headers.get("set-cookie");
    if (setCookie) {
      const _cookie = new Cookie(
        setCookie.replace(/Domain=\.music\.163\.com,/g, ""),
      );
      ["Path", "Max-Age", "Expires", "Domain", "HTTPOnly"].forEach((key) => {
        _cookie.deleteByKey(key);
      });
      Array.from(_cookie.getAll().entries()).map(([key, value]) => {
        requestCookie.set(key, value);
      });
    }
    const json = await res.json();
    await callback(json, requestCookie.toString());
  } catch (e) {
    await errorcallback(e);
  }
}
