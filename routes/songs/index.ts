import { Song } from "../../dbs/index.ts";
import { helpers, Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { getExtension, saveResult } from "../../utils/music/exec.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
import { formatFileName } from "../../utils/music/utils.ts";
import { setResponseBody } from "../../utils/util.ts";
import config from "../../config/config.json" assert { type: "json" };
interface SaveType {
  [key: string]: any;
  type: "tracks" | "single";
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  albumartist?: string;
  year?: number;
  picUrl: string;
  duration?: string;
}
const router = new Router();
const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
router.put("/store", async (ctx, next) => {
  await saveResult(config.source, config.exclude);
  const result = await Deno.readFile(
    denoPath.join(__dirname, "../../utils/music/result.json"),
  );
  const localMusicData = JSON.parse(
    new TextDecoder().decode(result),
  ) as SaveType[];
  await Song.create(
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

router.get("/search", async (ctx, next) => {
  const { title, artist } = helpers.getQuery(ctx);
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
    lossles,
    sampleRat,
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
    await Song.create({
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
      lossles,
      sampleRat,
      start,
      bitrate,
      picUrl: picUrl || "",
    });
    setResponseBody(ctx, 200, true, "创建成功");
  }
  await next();
});

router.delete("/:id", async (ctx, next) => {
  const id = ctx.params.id;
  const exsit = await Song.find(id);
  if (exsit) {
    await exsit.delete();
    setResponseBody(ctx, 200, true, "删除成功");
  } else {
    setResponseBody(ctx, 400, false, 0, "没有此id");
  }
  await next();
});

export default router;
