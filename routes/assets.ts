import { helpers, Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import * as path from "https://deno.land/std@0.184.0/path/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import { parseRange } from "https://deno.land/x/oak@v12.2.0/range.ts";
import { calculate } from "https://deno.land/x/oak@v12.2.0/etag.ts";
import { formatUrl } from "../utils/util.ts";
import config from "../config/config.json" assert { type: "json" };

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const router = new Router();
router.get("/:url", async (ctx, next) => {
  let url = ctx.params.url;
  url = formatUrl(url);
  const filePath = path.join(__dirname, `../assets/${url}`);
  const uint8Array = await Deno.readFile(filePath);
  ctx.response.body = uint8Array;
  ctx.response.status = 200;
  await next();
});

router.get("/proxy/:url", async (ctx, next) => {
  let url = await ctx.params.url;
  url = formatUrl(url);
  const res = await Deno.open(path.join(config.source, url), { read: true });
  const fileInfo = await res.stat();
  const range = ctx.request.headers.get("Range");
  const contentType = mime.getType(url);
  if (range) {
    const ranges = parseRange(
      range,
      fileInfo.size,
    );
    if (ranges.length <= 1) {
      const byteRange = ranges[0];
      const uint8Array = new Uint8Array(byteRange.end - byteRange.start + 1);
      await Deno.seek(res.rid, byteRange.start, Deno.SeekMode.Start);
      await res.read(uint8Array);
      ctx.response.body = uint8Array;
      ctx.response.headers.set(
        "Content-Range",
        `bytes ${byteRange.start}-${byteRange.end}/${fileInfo.size}`,
      );
      ctx.response.status = 206;
    } else {
      res.close();
      throw new Error("暂时不支持");
    }
  } else {
    const uint8Array = new Uint8Array(fileInfo.size);
    await res.read(uint8Array);
    ctx.response.body = uint8Array;
    ctx.response.headers.set(
      "Content-Range",
      `bytes 0-${fileInfo.size - 1}/${fileInfo.size}`,
    );
    ctx.response.status = 200;
  }
  const etag = await calculate(fileInfo, { weak: true });
  if (etag) {
    ctx.response.headers.set("Etag", etag);
  }
  ctx.response.headers.set("Accept-Ranges", "bytes");
  if (contentType) {
    ctx.response.headers.set("Content-Type", contentType);
  }
  res.close();
  await next();
});

router.get("/tracks/:url", async (ctx, next) => {
  let url = await ctx.params.url;
  const { duration, start, bitrate, lossless } = helpers.getQuery(ctx);
  url = formatUrl(url);
  const filePath = path.join(config.source, url);
  let args: string[] = [];
  if (bitrate) {
    args = args.concat("-ab", bitrate);
  }
  if (lossless) {
    args = args.concat("-f", "flac");
  } else {
    args = args.concat("-f", "mp3");
  }
  const cmd = new Deno.Command(config.ffmpegPath, {
    args: [
      "-ss",
      start,
      "-t",
      duration,
      "-i",
      filePath,
      ...args,
      "pipe:1",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  const child = cmd.spawn();
  const { stderr, stdout } = await child.output();
  if (stderr) {
    console.error(new TextDecoder().decode(stderr));
  }
  ctx.response.body = stdout;
  ctx.response.status = 200;
  await next();
});

export default router;
