import { User } from "../../dbs/index.ts";
import { helpers, Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import { isTrulyArg, isTrulyValue } from "../../utils/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";

const router = new Router<{ session: Session }>();

async function checkName(name: string): Promise<boolean> {
  const count = await User.where("username", name).count();
  return !(count > 0);
}

router.get("/user", async (ctx, next) => {
  const { userId: id } = helpers.getQuery(ctx);
  const userId = id || await ctx.state.session.get("userId") as number;
  if (isTrulyValue(userId)) {
    try {
      const user = await User.find(userId);
      if (user) {
        ctx.response.body = {
          code: 200,
          result: user,
        };
        await next();
        return;
      }
    } catch (e) {
      ctx.response.status = 500;
      await next();
    }
  }
  ctx.response.body = {
    code: 200,
    result: undefined,
    msg: "无用户信息",
  };
  await next();
});

router.get("/checkName", async (ctx, next) => {
  const { name } = helpers.getQuery(ctx);
  if (isTrulyValue(name)) {
    try {
      const flag = await checkName(name);
      ctx.response.body = {
        code: 200,
        result: flag,
        msg: !flag ? "用户名重复" : undefined,
      };
      await next();
    } catch (e) {
      ctx.response.status = 500;
      await next();
    }
  } else {
    ctx.response.status = 400;
    await next();
  }
});
router.post("/register", async (ctx, next) => {
  const { username, password, email } = await ctx.request.body({ type: "json" })
    .value;

  if (isTrulyArg(username, password)) {
    try {
      const flag = await checkName(username);
      if (flag) {
        const user = await User.create({
          username,
          password,
          email,
        });
        ctx.state.session.set("userId", user.id);
        ctx.response.status = 200;
        ctx.response.body = {
          code: 200,
          status: 1,
          result: {
            ...user,
            password: undefined,
          },
          msg: "创建成功",
        };
      } else {
        ctx.response.status = 200;
        ctx.response.body = {
          code: 200,
          status: 0,
          msg: "用户名重复",
        };
      }
      await next();
    } catch (e) {
      ctx.response.status = 500;
      await next();
    }
  } else {
    ctx.response.status = 400;
    await next();
  }
});

router.post("/login", async (ctx, next) => {
  const { username, password } = await ctx.request.body({ type: "json" })
    .value;

  if (isTrulyArg(username, password)) {
    try {
      const user = await User.where({ username, password }).limit(1).get();
      if (!Array.isArray(user)) {
        if (user) {
          ctx.state.session.set("userId", user.id);
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            status: 1,
            msg: "登录成功",
            result: {
              ...user,
              password: undefined,
            },
          };
        } else {
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            status: 0,
            msg: "用户名或密码错误",
          };
        }
      } else {
        const userInfo = user[0];
        if (userInfo) {
          ctx.state.session.set("userId", userInfo.id);
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            status: 1,
            msg: "登录成功",
            result: {
              ...userInfo,
              password: undefined,
            },
          };
        } else {
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            status: 0,
            msg: "用户名或密码错误",
          };
        }
      }
      await next();
    } catch (e) {
      ctx.response.status = 500;
      await next();
    }
  } else {
    ctx.response.status = 400;
    await next();
  }
});
router.put("/loginOut", async (ctx, next) => {
  const userId = ctx.state.session.get("userId");
  if (isTrulyArg(userId)) {
    ctx.state.session.set("userId", undefined);
    ctx.response.status = 200;
    ctx.response.body = {
      code: 200,
      status: 1,
      msg: "退出登录成功",
    };
    await next();
  } else {
    ctx.response.status = 400;
    ctx.response.body = {
      code: 400,
      status: 0,
      msg: "找不到用户",
    };
    await next();
  }
});

export default router;
