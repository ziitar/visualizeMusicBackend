import { Sheet, Song, SongSheet } from "../../dbs/index.ts";
import { Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import {
  isEmptyObject,
  isEmptyOrNull,
  isTrulyArg,
  isTrulyValue,
  setResponseBody,
} from "../../utils/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";
import Album from "../../models/album.ts";
import { getSongsArtist } from "../songs/index.ts";

const router = new Router<{ session: Session }>();

router.post("/", async (ctx, next) => {
  const { name, url } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyValue(name)) {
    const userId = await ctx.state.session?.get("userId") as number;
    const userSheets = await Sheet.where({ userId, sheetName: name }).count();
    if (!userSheets) {
      await Sheet.create({
        sheetName: name,
        url,
        userId: userId,
      });
      setResponseBody(ctx, 200, true, "创建成功");
    } else {
      setResponseBody(ctx, 400, false, "名称重复");
    }
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});

router.get("/", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  const userSheets = await Sheet.where("userId", userId).get();
  setResponseBody(ctx, 200, userSheets);
  await next();
});

router.delete("/:id", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  const id = ctx.params.id;

  if (!isEmptyOrNull(id) && id != "1") {
    const userSheets = await Sheet.where({ userId }).find(id);
    if (userSheets) {
      await userSheets.delete();
      await SongSheet.where({ sheetId: id }).delete();
      setResponseBody(ctx, 200, true, "删除成功");
    } else {
      setResponseBody(ctx, 400, false, 0, "删除失败，不存在此歌单");
    }
  } else {
    setResponseBody(ctx, 400, undefined);
  }

  await next();
});

router.post("/song", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;

  const { id, song } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyArg(id, song)) {
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
          setResponseBody(ctx, 200, true, "操作成功");
        } else {
          setResponseBody(ctx, 400, false, "该歌曲已存在歌单中");
        }
      }
    } else {
      setResponseBody(ctx, 400, false, "获取不到歌单");
    }
  } else {
    setResponseBody(ctx, 400, undefined);
  }

  await next();
});

router.delete("/song", async (ctx, next) => {
  const { id, songId } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyArg(id, songId)) {
    const num = await SongSheet.where({
      "songId": songId,
      "sheetId": id,
    }).count();
    if (num) {
      await SongSheet.where({ songId: songId, sheetId: id }).delete();
      setResponseBody(ctx, 200, true, "操作成功");
    } else {
      setResponseBody(ctx, 400, false, "删除失败，歌单不存在此歌曲");
    }
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});

router.get("/song/:id", async (ctx, next) => {
  const id = ctx.params.id;
  const userId = await ctx.state.session?.get("userId") as number;
  if (isTrulyArg(id)) {
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
        ).join(Album, Album.field("id"), Song.field("album_id")).select(
          Album.field("name", "album"),
          Song.field("id"),
          ...Object.keys(Song.fields).filter((item) => item !== "id"),
        ).all();
      setResponseBody(ctx, 200, {
        songs: await getSongsArtist(data),
        sum: data.length,
      }, "操作成功");
    } else {
      setResponseBody(ctx, 400, false, "获取歌曲失败，不存在此歌单");
    }
  } else {
    setResponseBody(ctx, 400, undefined);
  }

  await next();
});

export default router;
