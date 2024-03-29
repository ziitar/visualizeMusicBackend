import { Album, db, Sheet, Song, SongSheet } from "../../dbs/index.ts";
import { Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import {
  isEmptyOrNull,
  isTrulyArg,
  isTrulyValue,
  setResponseBody,
} from "../../utils/util.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.3/mod.ts";
import { getSongsArtist } from "../songs/index.ts";

const router = new Router<{ session: Session }>();

router.post("/", async (ctx, next) => {
  const { name, url } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyValue(name)) {
    const conn = await db.getConnection();
    const userId = await ctx.state.session?.get("userId") as number;
    const [userSheets] = await Sheet.query({ userId, sheetName: name }, conn);
    if (!userSheets.length) {
      const [result] = await Sheet.create(
        { sheetName: name, url, userId },
        conn,
      );
      if (result.affectedRows > 0) {
        setResponseBody(ctx, 200, true, "创建成功");
      }
    } else {
      setResponseBody(ctx, 400, false, "名称重复");
    }
    conn.release();
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});

router.get("/", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  const [userSheets] = await Sheet.query({ userId });
  setResponseBody(ctx, 200, userSheets);
  await next();
});

router.delete("/:id", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  const id = ctx.params.id;

  if (!isEmptyOrNull(id) && id != "1") {
    const conn = await db.getConnection();
    const [userSheets] = await Sheet.query({ userId }, conn);
    if (userSheets.length) {
      let flag = false;
      await conn.beginTransaction();
      try {
        await Sheet.deleteFn({ id }, conn);
        await SongSheet.deleteFn({ sheetId: id }, conn);
        await conn.commit();
        flag = true;
      } catch (e) {
        console.error(e);
        await conn.rollback();
        setResponseBody(ctx, 500, false, e);
      }
      if (flag) {
        setResponseBody(ctx, 200, true, "删除成功");
      }
    } else {
      setResponseBody(ctx, 400, false, 0, "删除失败，不存在此歌单");
    }
    conn.release();
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});

router.post("/song", async (ctx, next) => {
  const userId = await ctx.state.session?.get("userId") as number;
  const { id, song } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyArg(id, song)) {
    const conn = await db.getConnection();
    const [userSheets] = await Sheet.query({ userId }, conn);
    if (userSheets.length) {
      const [songModel] = await Song.query({ id: song.id }, conn);
      if (songModel.length) {
        const [num] = await SongSheet.query({
          "songId": song.id,
          "sheetId": id,
        }, conn);
        if (!num.length) {
          const [rows] = await SongSheet.create({
            songId: song.id,
            sheetId: id,
          }, conn);
          if (rows.affectedRows) {
            setResponseBody(ctx, 200, true, "操作成功");
          }
        } else {
          setResponseBody(ctx, 400, false, "该歌曲已存在歌单中");
        }
      }
    } else {
      setResponseBody(ctx, 400, false, "获取不到歌单");
    }
    conn.release();
  } else {
    setResponseBody(ctx, 400, undefined);
  }

  await next();
});

router.delete("/song", async (ctx, next) => {
  const { id, songId } = await ctx.request.body({ type: "json" }).value;
  if (isTrulyArg(id, songId)) {
    const conn = await db.getConnection();
    const [num] = await SongSheet.query({
      "songId": songId,
      "sheetId": id,
    }, conn);
    if (num.length) {
      const [rows] = await SongSheet.deleteFn(
        { songId: songId, sheetId: id },
        conn,
      );
      if (rows.affectedRows) {
        setResponseBody(ctx, 200, true, "操作成功");
      }
    } else {
      setResponseBody(ctx, 400, false, "删除失败，歌单不存在此歌曲");
    }
    conn.release();
  } else {
    setResponseBody(ctx, 400, undefined);
  }
  await next();
});

router.get("/song/:id", async (ctx, next) => {
  const id = ctx.params.id;
  const userId = await ctx.state.session?.get("userId") as number;
  if (isTrulyArg(id)) {
    const conn = await db.getConnection();
    let sheetsModel;
    if (parseInt(id) !== 1) {
      [sheetsModel] = await Sheet.query({
        userId,
        id,
      }, conn);
    } else {
      [sheetsModel] = await Sheet.query({ id }, conn);
    }
    const num = sheetsModel.length;
    if (num) {
      const [data] = await conn.execute(
        `
        select ${Song.getFields().join(",")}, ${Album.table}.name as album, 
        ${
          Album.getFields("exclude", ["name", "id", "created_at", "updated_at"])
        } from ${Song.table} 
        join ${SongSheet.table} on ${SongSheet.table}.song_id = ${Song.table}.id 
        join ${Album.table} on ${Album.table}.id = ${Song.table}.album_id 
        where ${SongSheet.table}.sheet_id = ?
      `,
        [id],
      );
      setResponseBody(ctx, 200, {
        sheet: sheetsModel[0],
        songs: await getSongsArtist(data, conn),
        total: data.length,
      }, "操作成功");
    } else {
      setResponseBody(ctx, 400, false, "获取歌曲失败，不存在此歌单");
    }
    conn.release();
  } else {
    setResponseBody(ctx, 400, undefined);
  }

  await next();
});

export default router;
