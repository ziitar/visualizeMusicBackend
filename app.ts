import { Application } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import router from "./routes/index.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";
import config from "./config/config.json" assert { type: "json" };
import { setResponseBody } from "./utils/util.ts";
export type AppState = {
  session: Session;
};

const app = new Application<AppState>();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("app catch", err);
    setResponseBody(ctx, 500, undefined, err.message);
  }
});
//@ts-ignore
app.use(Session.initMiddleware());

app.use(async (ctx, next) => {
  await next();
  const origin = ctx.request.headers.get("Origin");
  if (origin && config.allowedHost.includes(origin)) {
    ctx.response.headers.set(
      "Access-Control-Allow-Origin",
      origin,
    );
  }
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type",
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Credentials",
    "true",
  );
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", () => {
  console.log("serve is listen on localhost:7000");
});

await app.listen({ port: 7000 });
