import { Song } from "../../dbs/index.ts";
import { helpers, Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { getExtension } from "../../utils/music/exec.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
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
  try {
    const result = await Deno.readFile(
      denoPath.join(__dirname, "../../utils/music/result.json"),
    );
    const localMusicData = JSON.parse(
      new TextDecoder().decode(result),
    ) as SaveType[];
    await Song.create(
      localMusicData.map((item) => item.year ? item : { ...item, year: null }),
    );
    ctx.response.status = 200;
    ctx.response.body = {
      code: 200,
      result: true,
      msg: "创建成功",
    };
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = {
      code: 500,
      result: false,
      msg: e.message,
    };
  }
  await next();
});

router.get("/", async (ctx, next) => {
  try {
    const result = await Song.all();
    ctx.response.status = 200;
    ctx.response.body = {
      code: 200,
      result: result,
      msg: "查询成功",
    };
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = {
      code: 500,
      result: false,
      msg: e.message,
    };
  }
  await next();
});

router.get("/search", async (ctx, next) => {
  try {
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
    ctx.response.status = 200;
    ctx.response.body = {
      code: 200,
      result: result,
      msg: "查询成功",
    };
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = {
      code: 500,
      result: false,
      msg: e.message,
    };
  }
  await next();
});

router.post("/create", async (ctx, next) => {
  try {
    const formDataReader = await ctx.request.body({ type: "form-data" }).value;
    const formData = await formDataReader.read();
    const {
      title,
      url,
      artist,
      album,
      albumartist,
      year,
      duration,
      type,
    } = formData.fields;
    let picUrl = formData.fields.picUrl;
    const picData = formData.files;
    if (title && url && album && type && duration) {
      if (picData && picData.length) {
        const picFile = picData[0];
        picUrl = denoPath.join(
          __dirname,
          "../../assets",
          `${album}${getExtension(picFile.contentType)}`,
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
      }
      await Song.create({
        title,
        url,
        artist,
        type,
        duration,
        album,
        albumartist: albumartist || "",
        year: year || "",
        picUrl: picUrl || "",
      });
      ctx.response.status = 200;
      ctx.response.body = {
        code: 200,
        result: true,
        msg: "创建成功",
      };
    }
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = {
      code: 500,
      result: false,
      msg: e.message,
    };
  }
  await next();
});

router.delete("/:id", async (ctx, next) => {
  const id = ctx.params.id;
  try {
    const exsit = await Song.find(id);
    if (exsit) {
      await exsit.delete();
      ctx.response.status = 200;
      ctx.response.body = {
        code: 200,
        result: true,
        msg: "查询成功",
      };
    } else {
      ctx.response.status = 200;
      ctx.response.body = {
        code: 203,
        result: false,
        msg: "没有此id",
      };
    }
  } catch (e) {
    console.error(e);
    ctx.response.status = 500;
    ctx.response.body = {
      code: 500,
      result: false,
      msg: e.message,
    };
  }
  await next();
});

export default router;
