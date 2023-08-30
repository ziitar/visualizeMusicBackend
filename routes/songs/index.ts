import { RowDataPacket } from "npm:mysql2@3.6.0";
import {
  Album,
  AlbumArtist,
  Artist,
  db,
  Sheet,
  Song,
  SongArtist,
  SongSheet,
} from "../../dbs/index.ts";
import { helpers, Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { getExtension, saveResult, SaveType } from "../../utils/music/exec.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
import {
  formatFileName,
  splitArtist,
  splitArtistWithAlias,
} from "../../utils/music/utils.ts";
import { isTrulyValue, setResponseBody } from "../../utils/util.ts";
import config from "../../config/config.json" assert { type: "json" };
import { PoolConnection } from "npm:mysql2@3.6.0/promise";

const router = new Router();
const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));

async function createSong(
  song: SaveType,
  albumId: number,
  artistIds: number[],
  conn: PoolConnection,
) {
  const {
    type,
    url,
    title,
    duration,
    trackNo,
    lossless,
    sampleRate,
    start,
    bitrate,
  } = song;
  await conn.beginTransaction();
  try {
    const [songModel] = await Song.create({
      type,
      url,
      title,
      duration,
      trackNo,
      lossless,
      sampleRate,
      start,
      bitrate,
      albumId,
    }, conn);
    for await (const artistId of artistIds) {
      await SongArtist.create({
        songId: songModel.insertId,
        artistId: artistId,
      }, conn);
    }
    let sheetId;
    let [rows] = await Sheet.query({ id: 1 }, conn);
    if (!rows.length) {
      const [rows] = await Sheet.create({
        id: 1,
        sheetName: "系统歌单",
        userId: 1,
      }, conn);
      if (rows.affectedRows) {
        sheetId = rows.insertId;
      }
    } else {
      sheetId = rows[0].id;
    }
    await SongSheet.create({
      songId: songModel.insertId,
      sheetId: sheetId,
    }, conn);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    console.error(title, e);
  }
}
async function storeSong(songs: SaveType[]) {
  const conn = await db.getConnection();
  for await (const song of songs) {
    const {
      type,
      artist,
      album,
      albumartist,
      year,
      trackTotal,
      diskNo,
      diskTotal,
      picUrl,
    } = song;
    try {
      const albumartistList = splitArtist(albumartist || artist || undefined);
      const artistModels = [];
      for await (const artist of albumartistList) {
        const artistObj = splitArtistWithAlias(artist);
        const [albumartists] = await Artist.query(
          {
            "name": artistObj.name,
            "alias": artistObj.alias || artistObj.name,
          },
          conn,
          "or",
        );
        if (albumartists.length) {
          artistModels.push(albumartists[0]);
        } else {
          const [rows] = await Artist.create(artistObj, conn);
          artistModels.push({ id: rows.insertId, name: artistObj.name });
        }
      }
      let albumId: number;
      let [albumModel] = await Album.query({ "name": album }, conn);
      if (
        !albumModel.length ||
        (type === "tracks" && diskTotal && diskTotal > 1 &&
          diskNo != albumModel[0].diskNo)
      ) {
        const [rows] = await Album.create({
          name: album,
          image: picUrl,
          trackTotal: trackTotal,
          diskNo,
          diskTotal,
          year,
        }, conn);
        albumId = rows.insertId;
      } else {
        albumId = albumModel[0].id;
      }
      for await (const artistModel of artistModels) {
        const [albumArtistModel] = await AlbumArtist.query({
          albumId: albumId,
          artistId: artistModel.id,
        }, conn);
        if (!albumArtistModel.length) {
          await AlbumArtist.create({
            albumId: albumId,
            artistId: artistModel.id,
          }, conn);
        }
      }
      const artistList = splitArtist(artist || undefined);
      const artistModels_2 = [];
      for await (const artist of artistList) {
        const artistObj = splitArtistWithAlias(artist);
        const [artists] = await Artist.query(
          {
            "name": artistObj.name,
            "alias": artistObj.alias || artistObj.name,
          },
          conn,
          "or",
        );
        if (artists.length) {
          artistModels_2.push(artists[0]);
        } else {
          const [rows] = await Artist.create(artistObj, conn);
          artistModels_2.push({ id: rows.insertId, name: artistObj.name });
        }
      }
      await createSong(
        song,
        albumId,
        artistModels_2.map((item) => item.id),
        conn,
      );
    } catch (e) {
      console.error(song.title, e);
    }
  }
  conn.release();
}
router.put("/store", async (ctx, next) => {
  await saveResult(config.source, config.exclude);
  const result = await Deno.readFile(
    denoPath.join(__dirname, "../../utils/music/result.json"),
  );
  const localMusicData = JSON.parse(
    new TextDecoder().decode(result),
  ) as SaveType[];
  await storeSong(
    localMusicData,
  );
  setResponseBody(ctx, 200, true, "创建成功");
  await next();
});

router.get("/", async (ctx, next) => {
  const [result] = await Song.query({});
  setResponseBody(ctx, 200, result, "查询成功");
  await next();
});
let songArtistMap: Map<number, string[]> | undefined;
export async function getSongsArtist(
  songs: RowDataPacket[],
  conn: PoolConnection,
) {
  if (!songArtistMap) {
    const [rows]: [RowDataPacket[]] = await conn.query(
      `select ${
        SongArtist.getFields("include", ["songId"]).join("")
      }, ${Artist.table}.name from ${SongArtist.table} join ${Artist.table} on ${Artist.table}.id = ${SongArtist.table}.artist_id`,
    );
    songArtistMap = rows.reduce((result, row) => {
      let value: string[] | undefined = result.get(row.songId);
      if (value) {
        value.push(row.name);
      } else {
        value = [row.name];
      }
      result.set(row.songId, value);
      return result;
    }, new Map<number, string[]>());
  }
  return songs.map((song) => ({
    ...song,
    artist: songArtistMap!.get(song.id),
  }));
}
let albumArtistMap: Map<number, string[]> | undefined;
export async function getAlbumsArtist(
  conn: PoolConnection,
) {
  if (!albumArtistMap) {
    const [rows]: [RowDataPacket[]] = await conn.query(
      `select ${
        AlbumArtist.getFields("include", ["albumId"]).join("")
      }, ${Artist.table}.name from ${AlbumArtist.table} join ${Artist.table} on ${Artist.table}.id = ${AlbumArtist.table}.artist_id`,
    );
    albumArtistMap = rows.reduce((result, row) => {
      let value: string[] | undefined = result.get(row.albumId);
      if (value) {
        value.push(row.name);
      } else {
        value = [row.name];
      }
      result.set(row.albumId, value);
      return result;
    }, new Map<number, string[]>());
  }
  return albumArtistMap;
}
router.get("/all", async (ctx, next) => {
  const conn = await db.getConnection();
  let [albums] = await Album.query({}, conn);
  const albumArtistMapClone = await getAlbumsArtist(conn);
  albums = albums.map((item) => ({
    ...item,
    albumartist: albumArtistMapClone.get(item.id),
  }));
  const albumSongs = [];
  for await (const album of albums) {
    const [songs] = await Song.query({
      album_id: album.id,
    }, conn);
    const songArtist = await getSongsArtist(songs, conn);
    albumSongs.push({
      album: {
        ...album,
        albumartist: albumArtistMap?.get(album.id),
      },
      songs: songArtist,
    });
  }
  db.releaseConnection(conn);
  setResponseBody(ctx, 200, albumSongs);
  await next();
});

router.get("/search", async (ctx, next) => {
  const { title, artist, album, offset = "0", limit = "10" } = helpers.getQuery(
    ctx,
  );
  let artists, albums, result, values: unknown[] = [], total;
  const conn = await db.getConnection();
  if (artist) {
    [artists] = await conn.execute(
      `
      select id from ${Artist.table} where ${Artist.table}.name like CONCAT('%', ?, '%') or ${Artist.table}.alias like CONCAT('%', ?, '%')
    `,
      [artist, artist],
    );
  }
  if (artists && !artists.length) {
    artists = undefined;
  }
  if (album) {
    if (artists) {
      [albums] = await conn.execute(
        `
        select ${Album.table}.id from ${Album.table} 
        join ${AlbumArtist.table} on ${AlbumArtist.table}.album_id = ${Album.table}.id
        where ${AlbumArtist.table}.artist_id in (?) and
        ${Album.table}.name like CONCAT('%', ?, '%')
      `,
        [artists.map((item) => item.id).join(", "), album],
      );
    } else {
      [albums] = await conn.execute(
        `
        select id from ${Album.table} where ${Album.table}.name like CONCAT('%', ?, '%')
      `,
        [album],
      );
    }
  }
  if (albums && !albums.length) {
    albums = undefined;
  }
  const execute = `
      from ${Song.table} 
      join ${Album.table} on ${Album.table}.id = ${Song.table}.album_id  
      ${isTrulyValue(title) || albums || artists ? "where " : ""}
      ${
    isTrulyValue(title) ? Song.table + ".title like CONCAT('%', ?, '%') " : ""
  }
      ${albums ? isTrulyValue(title) ? "and " : "" : ""}
      ${
    albums
      ? Song.table + ".album_id in (" + albums.map((item) =>
        item.id
      ).join(",") + ") "
      : ""
  }
      ${!albums && artists ? isTrulyValue(title) ? "and " : "" : ""}
      ${
    !albums && artists
      ? Song.table + ".id in (select " + SongArtist.table + ".song_id from " +
        SongArtist.table + " where " +
        SongArtist.table + ".artist_id in (" +
        artists.map((item) => item.id).join(",") +
        ")) "
      : ""
  }    
  `;
  if (isTrulyValue(title)) {
    values = values.concat(title);
  }
  [total] = await conn.execute(
    `select count(*) ${execute}`,
    values,
  );
  [result] = await conn.execute(
    `
    select 
      ${Song.getFields().join(", ")},
      ${Album.table}.name as album, 
      ${Album.getFields("exclude", ["name", "id", "created_at", "updated_at"])}
      ${execute}
    limit ${limit} offset ${offset}
    `,
    values,
  );
  const albumArtistMapClone = await getAlbumsArtist(conn);
  result = result.map((item) => ({
    ...item,
    albumartist: albumArtistMapClone.get(item.albumId),
  }));
  result = await getSongsArtist(result, conn);
  conn.release();
  setResponseBody(
    ctx,
    200,
    { data: result, total: total[0]["count(*)"] },
    "查询成功",
  );
  await next();
});

router.post("/create", async (ctx, next) => {
  const formDataReader = await ctx.request.body({ type: "form-data" }).value;
  const formData = await formDataReader.read();
  const {
    type,
    url,
    title,
    artist,
    album,
    albumartist,
    year,
    duration,
    trackNo,
    trackTotal,
    diskNo,
    diskTotal,
    lossless,
    sampleRate,
    start,
    bitrate,
  } = formData.fields;
  let picUrl = formData.fields.picUrl;
  const picData = formData.files;
  if (title && url && album && type && duration) {
    if (picData && picData.length) {
      const picFile = picData[0];
      const picName = `${formatFileName(album)}-${
        formatFileName(albumartist)
      }.${getExtension(picFile.contentType)}`;
      picUrl = denoPath.join(
        __dirname,
        "../../assets",
        picName,
      );
      if (!await exists(picUrl)) {
        if (picFile.content) {
          await Deno.writeFile(picUrl, picFile.content);
        } else if (picFile.filename && await exists(picFile.filename)) {
          await Deno.rename(
            picFile.filename,
            picUrl,
          );
        }
      }
      picUrl = `/assets/${picName}`;
    }
    await storeSong([{
      type,
      url,
      title,
      artist,
      album,
      albumartist,
      year: year ? parseInt(year) : null,
      duration,
      trackNo: trackNo ? parseInt(trackNo) : null,
      trackTotal: trackTotal ? parseInt(trackTotal) : null,
      diskNo: diskNo ? parseInt(diskNo) : null,
      diskTotal: diskTotal ? parseInt(diskTotal) : null,
      lossless: !!lossless,
      sampleRate: sampleRate ? parseInt(sampleRate) : null,
      start: start ? start : null,
      bitrate: bitrate ? bitrate : null,
      picUrl: picUrl || "",
    } as SaveType]);
    setResponseBody(ctx, 200, true, "创建成功");
  }
  await next();
});

router.delete("/:id", async (ctx, next) => {
  const id = ctx.params.id;
  const conn = await db.getConnection();
  const [exsit] = await Song.query({ id }, conn);
  if (exsit.length) {
    await db.beginTransaction();
    try {
      await Song.deleteFn({ id }, conn);
      await SongArtist.deleteFn({ songId: id }, conn);
      await SongSheet.deleteFn({ songId: id }, conn);
      await db.commit();
      conn.release();
    } catch (e) {
      await db.rollback();
      conn.release();
      throw e;
    }
    setResponseBody(ctx, 200, true, "删除成功");
  } else {
    setResponseBody(ctx, 400, false, 0, "没有此id");
  }
  await next();
});

export default router;
