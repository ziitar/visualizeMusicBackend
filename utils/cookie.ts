class Cookie {
  #cookie: Map<string, string> = new Map();
  constructor(cookie?: string | Cookie) {
    if (cookie) {
      if (typeof cookie === "string") {
        const c = cookie.split(";");
        for (const kv of c) {
          const [cookieKey, ...cookieVal] = kv.split("=");
          if (cookieKey !== null) {
            const key = cookieKey.trim();
            this.#cookie.set(key, cookieVal.join(","));
          }
        }
      } else {
        if (cookie.#cookie) {
          this.#cookie = cookie.#cookie;
        }
      }
    }
  }

  toString(): string {
    if (this.#cookie.size) {
      return Array.from(this.#cookie.entries()).map(([key, value]) =>
        `${key}=${value}`
      )
        .join(
          ";",
        );
    }
    return "";
  }

  clone(cookie: Cookie) {
    if (cookie.#cookie.size) {
      return new Cookie(cookie.toString());
    }
    return new Cookie();
  }

  set(key: string, value: string) {
    this.#cookie.set(key, value);
  }

  get(key: string): string | undefined {
    return this.#cookie.get(key);
  }

  getAll() {
    return new Map(this.#cookie.entries());
  }

  deleteByKey(key: string) {
    if (key && this.#cookie.get(key)) {
      this.#cookie.delete(key);
    }
  }
}

export default Cookie;
