import {
  Album,
  AlbumArtist,
  Artist,
  db,
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
import { FieldValue } from "https://deno.land/x/denodb@v1.4.0/lib/data-types.ts";

const router = new Router();
const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));

async function createSong(
  song: SaveType,
  albumId: FieldValue,
  artistIds: FieldValue[],
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
  const songModel = await Song.create({
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
      songId: songModel.lastInsertId as FieldValue,
      artistId: artistId,
    });
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
    const artistModels = await Promise.all(
      albumartistList.map(async (artist) => {
        const albumartists = await Artist.where("name", artist).first();
        if (albumartists) {
          return albumartists;
        } else {
          return await Artist.create({ name: artist });
        }
      }),
    );
    let albumModel = await Album.where("name", album).first();
    if (
      !albumModel || (type === "tracks" && diskTotal && diskTotal > 1 &&
        diskNo != albumModel.diskNo)
    ) {
      albumModel = await Album.create({
        name: album,
        image: picUrl,
        trackTotal: trackTotal,
        diskNo,
        diskTotal,
        year,
      });
    }
    await Promise.all(
      artistModels.map(async (artistModel) => {
        const albumArtistModel = await AlbumArtist.where({
          albumId: albumModel.id as FieldValue ||
            albumModel.lastInsertId as FieldValue,
          artistId: artistModel.id as FieldValue ||
            artistModel.lastInsertId as FieldValue,
        }).first();
        if (!albumArtistModel) {
          await AlbumArtist.create({
            albumId: albumModel.id as FieldValue ||
              albumModel.lastInsertId as FieldValue,
            artistId: artistModel.id as FieldValue ||
              artistModel.lastInsertId as FieldValue,
          });
        }
      }),
    );
    const artistList = splitArtist(artist || undefined);
    const artistModels_2 = await Promise.all(
      artistList.map(async (artist) => {
        const artists = await Artist.where("name", artist).first();
        if (artists) {
          return artists;
        } else {
          return await Artist.create({ name: artist });
        }
      }),
    );
    await createSong(
      song,
      albumModel.id as FieldValue || albumModel.lastInsertId as FieldValue,
      artistModels_2.map((item) =>
        item.id as FieldValue || item.lastInsertId as FieldValue
      ),
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
  const result = await Song.all();
  setResponseBody(ctx, 200, result, "查询成功");
  await next();
});

router.get("/all", async (ctx, next) => {
  const artist = await Artist.select(
    Artist.field("name", "albummartist"),
    Artist.field("id", "albummartistId"),
  ).all();
  const result = await Promise.all(artist.map(async (albummartist) => {
    const albums = await AlbumArtist.where(
      AlbumArtist.field("artist_id"),
      albummartist.albummartistId as FieldValue,
    ).join(Album, Album.field("id"), AlbumArtist.field("album_id")).all();
    const albumSong = await Promise.all(albums.map(async (album) => {
      const songs = await Song.where(
        Song.field("album_id"),
        album.id as FieldValue,
      ).all();
      const songArtist = await Promise.all(songs.map(async (song) => {
        const artist = await SongArtist.where(
          SongArtist.field("song_id"),
          song.id as FieldValue,
        ).join(
          Artist,
          Artist.field("id"),
          SongArtist.field("artist_id"),
        ).select(Artist.field("name")).all();
        return {
          ...song,
          artist: artist.map((item) => item.name),
        };
      }));
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
  const { title, artist, album, albumartist } = helpers.getQuery(ctx);
  let result;
  if (title) {
    result = await Song.where("title", "like", `%${title}%`);
  }
  if (artist) {
    if (result) {
      result = await result.where("artist", "like", `%${artist}%`);
    } else {
      result = await Song.where("artist", "like", `%${artist}%`);
    }
  }
  if (album) {
    //todo
  }
  if (result) {
    result = await result.all();
  } else {
    result = await Song.all();
  }
  setResponseBody(ctx, 200, result, "查询成功");
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
      const picName = `${formatFileName(album)}-${formatFileName(albumartist)}${
        getExtension(picFile.contentType)
      }`;
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
      start: start ? parseInt(start) : null,
      bitrate: bitrate ? parseInt(bitrate) : null,
      picUrl: picUrl || "",
    } as SaveType]);
    setResponseBody(ctx, 200, true, "创建成功");
  }
  await next();
});

router.delete("/:id", async (ctx, next) => {
  const id = ctx.params.id;
  const exsit = await Song.find(id);
  if (exsit) {
    await db.transaction(async () => {
      await exsit.delete();
      await SongArtist.where("songId", id).delete();
      await SongSheet.where("songId", id).delete();
    });
    setResponseBody(ctx, 200, true, "删除成功");
  } else {
    setResponseBody(ctx, 400, false, 0, "没有此id");
  }
  await next();
});

export default router;
