import { isObj, isStr } from "../util.ts";
export interface RequestConfig extends Omit<RequestInit, "body"> {
  url: string;
  body?: RequestInit["body"] | Record<string | number, any>;
}

function isRequestBodyInit(
  bodyInit: RequestConfig["body"],
): bodyInit is RequestInit["body"] {
  return !isObj(bodyInit);
}

export function formatConfig(config: RequestConfig): Request {
  if (typeof config.url === "string") {
    const { url, body, ...rest } = config;
    let transformUrl: string = url;
    let transformBody: RequestInit["body"] | undefined;
    if (body) {
      if (!isRequestBodyInit(body)) {
        switch (config.method) {
          case "get":
          case "GET": {
            const searchParam = new URLSearchParams(
              body as Record<string | number, any>,
            );
            if (/\/[^?]+\?.*/.test(transformUrl)) {
              transformUrl += `&${searchParam.toString()}`;
            } else {
              transformUrl += `?${searchParam.toString()}`;
            }
            break;
          }
          case "post":
          case "POST":
          default:
            transformBody = JSON.stringify(body);
            break;
        }
      } else {
        transformBody = body;
      }
    }
    const req = new Request(transformUrl, { ...rest, body: transformBody });
    return req;
  } else {
    throw new Error(`request config.url仅支持string类型,当前为${typeof config.url}`);
  }
}

function request(config: RequestConfig): Promise<Response> {
  return fetch(formatConfig(config));
}

request.get = (url: string | Omit<RequestConfig, "method">) => {
  if (isStr(url)) {
    return request({ url, method: "get" });
  } else {
    return request({ ...url, method: "get" });
  }
};

request.post = (config: Omit<RequestConfig, "method">) => {
  return request({ ...config, method: "post" });
};

export default request;
