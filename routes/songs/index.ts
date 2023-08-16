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
import { formatFileName, splitArtist } from "../../utils/music/utils.ts";
import { setResponseBody } from "../../utils/util.ts";
import config from "../../config/config.json" assert { type: "json" };

const router = new Router();
const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));

async function createSong(
  song: SaveType,
  albumId: number,
  artistIds: number[],
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
  await db.beginTransaction();
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
    });
    for await (const artistId of artistIds) {
      await SongArtist.create({
        songId: songModel.insertId,
        artistId: artistId,
      });
    }
    let sheetId;
    let [rows] = await Sheet.query({ id: 1 });
    if (!rows.length) {
      const [rows] = await Sheet.create({
        id: 1,
        sheetName: "系统歌单",
        userId: 1,
      });
      if (rows.affectedRows) {
        sheetId = rows.insertId;
      }
    } else {
      sheetId = rows[0].id;
    }
    await SongSheet.create({
      songId: songModel.insertId,
      sheetId: sheetId,
    });
    await db.commit();
  } catch (e) {
    await db.rollback();
    throw e;
  }
}
async function storeSong(songs: SaveType[]) {
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
    const albumartistList = splitArtist(albumartist || artist || undefined);
    const artistModels = (await Promise.all(
      albumartistList.map(async (artist) => {
        const [albumartists] = await Artist.query({ "name": artist });
        if (albumartists.length) {
          return albumartists;
        } else {
          const [rows] = await Artist.create({ name: artist });
          return [{ id: rows.insertId, name: artist }];
        }
      }),
    )).flat();
    let albumId: number;
    let [albumModel] = await Album.query({ "name": album });
    if (
      !albumModel.length || (type === "tracks" && diskTotal && diskTotal > 1 &&
        diskNo != albumModel[0].disk_no)
    ) {
      const [rows] = await Album.create({
        name: album,
        image: picUrl,
        trackTotal: trackTotal,
        diskNo,
        diskTotal,
        year,
      });
      albumId = rows.insertId;
    } else {
      albumId = albumModel[0].id;
    }
    await Promise.all(
      artistModels.map(async (artistModel) => {
        const [albumArtistModel] = await AlbumArtist.query({
          albumId: albumId,
          artistId: artistModel.id,
        });
        if (!albumArtistModel.length) {
          await AlbumArtist.create({
            albumId: albumId,
            artistId: artistModel.id,
          });
        }
      }),
    );
    const artistList = splitArtist(artist || undefined);
    const artistModels_2 = (await Promise.all(
      artistList.map(async (artist) => {
        const [artists] = await Artist.query({ "name": artist });
        if (artists.length) {
          return artists;
        } else {
          const [rows] = await Artist.create({ name: artist });
          return [{ id: rows.insertId, name: artist }];
        }
      }),
    )).flat();
    await createSong(
      song,
      albumId,
      artistModels_2.map((item) => item.id),
    );
  }
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

export async function getSongsArtist(songs: RowDataPacket[]) {
  return await Promise.all(songs.map(async (song) => {
    const [artist] = await db.execute<RowDataPacket[]>(
      `
      select ${Artist.table}.name from ${SongArtist} 
      join ${Artist.table} on ${Artist.table}.id = ${SongArtist.table}.artist_id 
      where ${SongArtist.table}.song_id = ?
    `,
      [song.id],
    );
    return {
      ...song,
      artist: artist.map((item) => item.name),
    };
  }));
}

router.get("/all", async (ctx, next) => {
  const [artists] = await db.query<RowDataPacket[]>(`
    select ${Artist.table}.name as albumartist, ${Artist.table}.id as albumartistId from ${AlbumArtist.table}
    join ${Artist.table} on ${Artist.table}.id = ${AlbumArtist.table}.artist_id
    group by ${AlbumArtist.table}.artist_id
  `);
  const result = await Promise.all(artists.map(async (albummartist) => {
    const [albums] = await db.query<RowDataPacket[]>(
      `
      select ${Album.getFields().join(", ")} from ${AlbumArtist.table} 
      join ${Album.table} on ${AlbumArtist.table}.album_id = ${Album.table}.id
      where ${AlbumArtist.table}.artist_id = ?
    `,
      [albummartist.albumartistId],
    );
    const albumSong = await Promise.all(albums.map(async (album) => {
      const [songs] = await Song.query({
        album_id: album.id,
      });
      const songArtist = await getSongsArtist(songs);
      return {
        album: album,
        songs: songArtist,
      };
    }));

    return {
      albums: albumSong,
      albummartist: albummartist.albummartist,
    };
  }));
  setResponseBody(ctx, 200, result);
  await next();
});

router.get("/search", async (ctx, next) => {
  // const { title, artist, album, offset, limit } = helpers.getQuery(ctx);
  // let songs, artists, albums, result;

  // if (artist) {
  //   artists = await Artist.where("name", "like", `%${artist}%`).all();
  // }
  // if (album) {
  //   albums = await Album.where("name", "like", `%${album}%`).all();

  //   if (artists) {
  //     const AlbumArtists = (await Promise.all(artists.map(async (artist) => {
  //       return await AlbumArtist.where(
  //         "artist_id",
  //         artist.id as FieldValue,
  //       )
  //         .all();
  //     }))).flat().map((item) => item.albumId as FieldValue);
  //     albums = albums.filter((album) =>
  //       AlbumArtists.includes(album.id as FieldValue)
  //     );
  //   }
  // }
  // if (title) {
  //   songs = Song.where("title", "like", `%${title}%`);
  // } else {
  //   songs = Song;
  // }
  // result = await songs.join(Album, Album.field("id"), Song.field("album_id"))
  //   .select(
  //     Album.field("name", "album"),
  //     Album.field("year"),
  //     Album.field("track_total"),
  //     Album.field("image"),
  //     Song.field("id"),
  //     ...Object.keys(Song.fields).filter((item) => item !== "id"),
  //   )
  //   .all();
  // if (albums) {
  //   result = result.filter((song) =>
  //     albums?.some((album) => album.id === song.albumId)
  //   );
  // }
  // if (artists && !albums) {
  //   const songArtists = (await Promise.all(artists.map(async (artist) => {
  //     return await SongArtist.where(
  //       "artist_id",
  //       artist.id as FieldValue,
  //     )
  //       .all();
  //   }))).flat().map((item) => item.songId as FieldValue);
  //   result = result.filter((song) =>
  //     songArtists.includes(song.id as FieldValue)
  //   );
  // }
  // result = await getSongsArtist(result);
  // setResponseBody(ctx, 200, result, "查询成功");
  // await next();
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
  const [exsit] = await Song.query({ id });
  if (exsit.length) {
    await db.beginTransaction();
    try {
      await Song.deleteFn({ id });
      await SongArtist.deleteFn({ songId: id });
      await SongSheet.deleteFn({ songId: id });
      await db.commit();
    } catch (e) {
      await db.rollback();
      throw e;
    }
    setResponseBody(ctx, 200, true, "删除成功");
  } else {
    setResponseBody(ctx, 400, false, 0, "没有此id");
  }
  await next();
});

export default router;
