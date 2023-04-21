import { Sheet, Song, SongSheet } from "../../dbs/index.ts";
import { Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import {
  isEmptyObject,
  isEmptyOrNull,
  isTrulyArg,
  isTrulyValue,
} from "../../utils/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";

const router = new Router<{ session: Session }>();

router.post("/", async (ctx, next) => {
  const { name, url } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyValue(name)) {
    const userId = await ctx.state.session?.get("userId") as number;
    if (userId) {
      const userSheets = await Sheet.where({ userId, sheetName: name }).count();
      if (!userSheets) {
        try {
          await Sheet.create({
            sheetName: name,
            url,
            userId: userId,
          });
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            result: true,
            msg: "创建成功",
          };
        } catch (e) {
          ctx.response.status = 500;
          ctx.response.body = {
            code: 500,
            result: false,
            msg: e.message,
          };
        }
      } else {
        ctx.response.status = 200;
        ctx.response.body = {
          code: 402,
          result: false,
          msg: "名称重复",
        };
      }
    } else {
      ctx.response.status = 200;
      ctx.response.body = {
        code: 401,
        msg: "获取不到用户信息，请登录",
      };
    }
  } else {
    ctx.response.status = 400;
  }
  await next();
});

router.get("/", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  if (userId) {
    try {
      const userSheets = await Sheet.where("userId", userId).get();
      ctx.response.status = 200;
      ctx.response.body = {
        code: 200,
        result: userSheets,
        msg: "查询成功",
      };
    } catch (e) {
      ctx.response.status = 500;
      ctx.response.body = {
        code: 500,
        result: false,
        msg: e.message,
      };
    }
  } else {
    ctx.response.status = 200;
    ctx.response.body = {
      code: 401,
      msg: "获取不到用户信息，请登录",
    };
  }
  await next();
});

router.delete("/:id", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  const id = ctx.params.id;
  if (userId) {
    if (!isEmptyOrNull(id)) {
      try {
        const userSheets = await Sheet.where({ userId }).find(id);
        if (userSheets) {
          await userSheets.delete();
          await SongSheet.where({ sheetId: id }).delete();
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            result: true,
            msg: "操作成功",
          };
        } else {
          ctx.response.status = 403;
          ctx.response.body = {
            code: 403,
            result: false,
            msg: "删除失败，不存在此歌单",
          };
        }
      } catch (e) {
        ctx.response.status = 500;
        ctx.response.body = {
          code: 500,
          result: false,
          msg: e.message,
        };
      }
    } else {
      ctx.response.status = 400;
    }
  } else {
    ctx.response.status = 200;
    ctx.response.body = {
      code: 401,
      msg: "获取不到用户信息，请登录",
    };
  }
  await next();
});

router.post("/song", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  if (userId) {
    const { id, song } = await ctx.request.body({ type: "json" }).value;
    if (isTrulyArg(id, song)) {
      try {
        const userSheets = await Sheet.where({ userId }).find(id);
        if (userSheets && !isEmptyObject(userSheets)) {
          const songModel = await Song.find(song.id);
          if (songModel && !isEmptyObject(songModel)) {
            const num = await SongSheet.where({
              "songId": song.id,
              "sheetId": id,
            }).count();
            if (!num) {
              await SongSheet.create({
                songId: song.id,
                sheetId: id,
              });
              ctx.response.status = 200;
              ctx.response.body = {
                code: 200,
                result: true,
                msg: "操作成功",
              };
            } else {
              ctx.response.status = 200;
              ctx.response.body = {
                code: 403,
                result: false,
                msg: "改歌曲已存在歌单中",
              };
            }
          } else {
            await Song.create({
              id: song.id,
              songName: song.songName,
              authors: song.authors,
            });
            await SongSheet.create({
              songId: song.id,
              sheetId: id,
            });
            ctx.response.status = 200;
            ctx.response.body = {
              code: 200,
              result: true,
              msg: "操作成功",
            };
          }
        } else {
          ctx.response.status = 400;
          ctx.response.body = {
            code: 400,
            msg: "获取不到歌单",
          };
        }
      } catch (e) {
        ctx.response.status = 500;
        ctx.response.body = {
          code: 500,
          result: false,
          msg: e.message,
        };
      }
    } else {
      ctx.response.status = 400;
    }
  } else {
    ctx.response.status = 200;
    ctx.response.body = {
      code: 401,
      msg: "获取不到用户信息，请登录",
    };
  }
  await next();
});

router.delete("/song", async (ctx, next) => {
  const { id, songId } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyArg(id, songId)) {
    try {
      const num = await SongSheet.where({
        "songId": songId,
        "sheetId": id,
      }).count();
      if (num) {
        await SongSheet.where({ songId: songId, sheetId: id }).delete();
        ctx.response.status = 200;
        ctx.response.body = {
          code: 200,
          result: true,
          msg: "操作成功",
        };
      } else {
        ctx.response.status = 400;
        ctx.response.body = {
          code: 400,
          result: false,
          msg: "删除失败，歌单不存在此歌曲",
        };
      }
    } catch (e) {
      ctx.response.status = 500;
      ctx.response.body = {
        code: 500,
        result: false,
        msg: e.message,
      };
    }
  } else {
    ctx.response.status = 400;
  }
  await next();
});

router.get("/song/:id", async (ctx, next) => {
  const id = ctx.params.id;
  const userId = await ctx.state.session?.get("userId") as number;
  if (userId) {
    if (isTrulyArg(id)) {
      try {
        const sheetsModel = await Sheet.where({
          userId,
          id,
        });
        const num = await sheetsModel.count();
        if (num) {
          const data = await SongSheet.where(SongSheet.field("sheet_id"), id)
            .leftJoin(
              Song,
              Song.field("id"),
              SongSheet.field("song_id"),
            ).get();
          ctx.response.status = 200;
          ctx.response.body = {
            code: 200,
            result: {
              songs: data,
              sum: data.length,
            },
            msg: "操作成功",
          };
        } else {
          ctx.response.status = 400;
          ctx.response.body = {
            code: 400,
            result: false,
            msg: "获取歌曲失败，不存在此歌单",
          };
        }
      } catch (e) {
        ctx.response.status = 500;
        ctx.response.body = {
          code: 500,
          result: false,
          msg: e.message,
        };
      }
    } else {
      ctx.response.status = 400;
    }
  } else {
    ctx.response.status = 200;
    ctx.response.body = {
      code: 401,
      msg: "获取不到用户信息，请登录",
    };
  }

  await next();
});

export default router;
