import { Application } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import router from "./routes/index.ts";
import { Session } from "https://deno.land/x/oak_sessions@v3.2.5/mod.ts";

const app = new Application();
const session = new Session();

//@ts-ignore
app.use(session.initMiddleware());

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (ctx, next) => {
  try {
    await next();
    ctx.response.headers.set(
      "Access-Control-Allow-Origin",
      "http://localhost:4200",
    );
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
