import { Application } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import router from "./routes/index.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";

export type AppState = {
  session: Session;
};

const app = new Application<AppState>();

//@ts-ignore
app.use(Session.initMiddleware());

app.use(router.routes());
app.use(router.allowedMethods());

const allowedHost: string[] = [
  "http://192.168.1.189:4200",
  "http://localhost:4200",
  "http://dynamic.uziitar.gq:14200",
];
app.use(async (ctx, next) => {
  try {
    await next();
    const origin = ctx.request.headers.get("Origin");
    if (origin && allowedHost.includes(origin)) {
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
  } catch (e) {
    console.error(e);
  }
});

app.addEventListener("listen", () => {
  console.log("serve is listen on localhost:7000");
});

await app.listen({ port: 7000 });
