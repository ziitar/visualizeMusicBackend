import { User } from "../../dbs/index.ts";
import { helpers, Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import { isTrulyArg, isTrulyValue, setResponseBody } from "../../utils/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";

const router = new Router<{ session: Session }>();

async function checkName(name: string): Promise<boolean> {
  const [row] = await User.query({ "username": name });
  return !(row.length > 0);
}

router.get("/user", async (ctx, next) => {
  const { userId: id } = helpers.getQuery(ctx);
  const userId = id || await ctx.state.session.get("userId") as number;
  if (isTrulyValue(userId)) {
    const [user] = await User.query(
      { id: userId },
      undefined,
      "and",
      "exclude",
      ["password"],
    );
    if (user) {
      setResponseBody(
        ctx,
        200,
        user,
      );
    }
  } else {
    setResponseBody(ctx, 200, undefined, 0, "无用户信息");
  }
  await next();
});

router.get("/checkName", async (ctx, next) => {
  const { name } = helpers.getQuery(ctx);
  if (isTrulyValue(name)) {
    const flag = await checkName(name);
    setResponseBody(ctx, 200, flag, !flag ? "用户名重复" : undefined);
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});
router.post("/register", async (ctx, next) => {
  const { username, password, email, headUrl } = await ctx.request.body({
    type: "json",
  })
    .value;

  if (isTrulyArg(username, password)) {
    const flag = await checkName(username);
    if (flag) {
      const [user] = await User.create({
        username,
        password,
        email,
        headUrl,
      });
      if (user.affectedRows > 0) {
        ctx.state.session.set("userId", user.insertId);
        setResponseBody(ctx, 200, {
          id: user.insertId,
          username,
          email,
          headUrl,
        }, "创建成功");
      } else {
        setResponseBody(ctx, 400, undefined);
      }
    } else {
      setResponseBody(ctx, 200, undefined, 0, "用户名重复");
    }
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});

router.post("/login", async (ctx, next) => {
  const { username, password } = await ctx.request.body({ type: "json" })
    .value;

  if (isTrulyArg(username, password)) {
    const [user] = await User.query(
      { username, password },
      undefined,
      "and",
      "exclude",
      ["password"],
    );
    const userInfo = user[0];
    if (userInfo) {
      ctx.state.session.set("userId", userInfo.id);
      setResponseBody(ctx, 200, {
        ...userInfo,
      }, "登录成功");
    } else {
      setResponseBody(ctx, 200, undefined, 0, "用户名或密码错误");
    }
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});
router.put("/loginOut", async (ctx, next) => {
  const userId = ctx.state.session.get("userId");
  if (isTrulyArg(userId)) {
    ctx.state.session.set("userId", undefined);
    setResponseBody(ctx, 200, undefined, "退出登录成功");
  } else {
    setResponseBody(ctx, 400, undefined, "找不到用户");
  }
  await next();
});

export default router;
