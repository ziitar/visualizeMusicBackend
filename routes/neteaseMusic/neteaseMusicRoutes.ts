import {
  helpers,
  RouteParams,
  Router,
  RouterContext,
  State,
} from "https://deno.land/x/oak@v12.2.0/mod.ts";
import { createWebAPIRequest } from "../../utils/neteaseMusicAPI/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";
import Cookie from "../../utils/cookie.ts";
import {
  NEMAPIFactory,
  SearchSongResultType,
  SongDetailResultType,
  SongResultType,
  UserInfoType,
} from "./typing.d.ts";

const router = new Router<{ session: Session }>();

async function resolve<
  T,
  R extends string,
  P extends RouteParams<R> = RouteParams<R>,
  // deno-lint-ignore no-explicit-any
  S extends State = Record<string, any>,
>(
  res: NEMAPIFactory<T>,
  cookie: string,
  ctx: RouterContext<R, P, S>,
  next: () => Promise<unknown>,
) {
  if (res.code === 200) {
    if (cookie) {
      ctx.state.session.set("NEM_cookie", cookie);
    }
    ctx.response.status = 200;
    ctx.response.body = res;
    await next();
  } else {
    if (res.code > 0) {
      ctx.response.status = res.code;
      await next();
    } else {
      ctx.response.status = 502;
      ctx.response.body = res;
      await next();
    }
  }
}

async function reject<
  R extends string,
  P extends RouteParams<R> = RouteParams<R>,
  // deno-lint-ignore no-explicit-any
  S extends State = Record<string, any>,
>(err: Error, ctx: RouterContext<R, P, S>, next: () => Promise<unknown>) {
  console.error(err);
  ctx.response.status = 500;
  await next();
}

router.get("/search/:keywords", async (ctx, next) => {
  const s = ctx.params.keywords;
  const { limit, offset, type } = helpers.getQuery(ctx);
  if (s) {
    const NEM_cookie = await ctx.state.session.get("NEM_cookie") as string;
    await createWebAPIRequest<NEMAPIFactory<SearchSongResultType>>(
      "music.163.com",
      "/weapi/search/get",
      {
        s: s,
        limit: limit || 10,
        type: type || 1,
        offset: offset || 0,
      },
      NEM_cookie || "",
      "POST",
      (res, cookie) => resolve(res, cookie, ctx, next),
      (err) => reject(err, ctx, next),
    );
  } else {
    ctx.response.status = 400;
    await next();
  }
});

router.get("/musicUrl/:id", async (ctx, next) => {
  const id = ctx.params.id;
  const { br = 999000 } = helpers.getQuery(ctx);
  if (id) {
    const NEM_cookie = await ctx.state.session.get("NEM_cookie") as string;
    await createWebAPIRequest<NEMAPIFactory<SongResultType>>(
      "music.163.com",
      "/weapi/song/enhance/player/url",
      {
        ids: [id],
        br: br,
      },
      NEM_cookie || "",
      "POST",
      (res, cookie) => {
        const result = {
          code: res.code,
          result: res.data,
        };
        return resolve(result, cookie, ctx, next);
      },
      (err) => reject(err, ctx, next),
    );
  } else {
    ctx.response.status = 400;
    await next();
  }
});

router.get("/song/detail/:id", async (ctx, next) => {
  const id = ctx.params.id;

  if (id) {
    const NEM_cookie = await ctx.state.session.get("NEM_cookie") as string;
    await createWebAPIRequest<NEMAPIFactory<SongDetailResultType>>(
      "music.163.com",
      "/weapi/v3/song/detail",
      {
        c: JSON.stringify([{ id: `${id}` }]),
      },
      NEM_cookie || "",
      "POST",
      (res, cookie) => {
        const result = {
          code: res.code,
          result: {
            ...res.songs[0]?.al,
            artists: res.songs[0]?.ar,
          },
        };
        return resolve(result, cookie, ctx, next);
      },
      (err) => reject(err, ctx, next),
      true,
    );
  } else {
    ctx.response.status = 400;
    await next();
  }
});

router.get("/song/lyric/:id", async (ctx, next) => {
  const id = ctx.params.id;
  if (id) {
    const NEM_cookie = await ctx.state.session.get("NEM_cookie") as string;
    await createWebAPIRequest<NEMAPIFactory<SearchSongResultType>>(
      "music.163.com",
      "/weapi/song/lyric",
      {
        id: Number(id),
        lv: -1,
        tv: -1,
      },
      NEM_cookie || "",
      "POST",
      (res, cookie) => resolve(res, cookie, ctx, next),
      (err) => reject(err, ctx, next),
    );
  } else {
    ctx.response.status = 400;
    await next();
  }
});

router.post("/login", async (ctx, next) => {
  const { username, password } = await ctx.request.body({ type: "json" }).value;
  const NEM_cookie = await ctx.state.session.get("NEM_cookie") as string;
  const cookie = new Cookie(NEM_cookie);
  cookie.set("os", "pc");
  if (username && password) {
    await createWebAPIRequest<NEMAPIFactory<UserInfoType>>(
      "music.163.com",
      "/weapi/login",
      {
        username,
        password,
        rememberLogin: true,
      },
      cookie.toString(),
      "POST",
      (res, cookie) => resolve(res, cookie, ctx, next),
      (err) => reject(err, ctx, next),
    );
  } else {
    ctx.response.status = 400;
    await next();
  }
});

router.get("/media/:url", async (ctx, next) => {
  let url = await ctx.params.url;
  url = decodeURIComponent(url);
  const res = await fetch(url);
  ctx.response.status = res.status;
  ctx.response.headers = new Headers(res.headers);
  ctx.response.body = await res.blob();
  await next();
});
export default router;
