import {
  helpers,
  Router,
  RouterMiddleware,
} from "https://deno.land/x/oak@v12.2.0/mod.ts";
import * as path from "https://deno.land/std@0.184.0/path/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import { parseRange } from "https://deno.land/x/oak@v12.2.0/range.ts";
import { calculate } from "https://deno.land/x/oak@v12.2.0/etag.ts";
import { formatUrl, limitRange, setResponseBody } from "../utils/util.ts";
import config from "../config/config.json" assert { type: "json" };
import { formatFileName } from "../utils/music/utils.ts";
import { getExtension } from "../utils/music/exec.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";

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

router.put("/upload", async (ctx, next) => {
  const formDataReader = await ctx.request.body({ type: "form-data" }).value;
  const formData = await formDataReader.read();
  const files = formData.files;
  if (files) {
    for await (const file of files) {
      if (file.content) {
        let url: string | undefined;
        if (file.filename) {
          url = formatFileName(formatUrl(file.filename));
        } else if (file.originalName) {
          url = formatFileName(
            formatUrl(`${file.name}.${getExtension(file.contentType)}`),
          );
        } else {
          url = formatFileName(formatUrl(`${file.originalName}`));
        }
        const filePath = path.join(__dirname, `../assets/${url}`);
        await Deno.writeFile(filePath, file.content);
      }
    }
  }
  setResponseBody(ctx, 200, undefined);
  await next();
});

const getResource: RouterMiddleware<
  string,
  Record<string, any>,
  { url: string }
> = async (ctx, next) => {
  const url = ctx.state.url;
  const res = await Deno.open(url, { read: true });
  const fileInfo = await res.stat();
  const range = ctx.request.headers.get("Range");
  const contentType = mime.getType(url);
  if (range) {
    const ranges = parseRange(
      range,
      fileInfo.size,
    );
    if (ranges.length <= 1) {
      const byteRange = limitRange(ranges[0], 3);
      const uint8Array = new Uint8Array(byteRange.end - byteRange.start + 1);
      await Deno.seek(res.rid, byteRange.start, Deno.SeekMode.Start);
      await res.read(uint8Array);
      ctx.response.body = uint8Array;
      ctx.response.headers.set(
        "Content-Range",
        `bytes ${byteRange.start}-${byteRange.end}/${fileInfo.size}`,
      );
      if (contentType) {
        ctx.response.headers.set("Content-Type", contentType);
      }
    } else {
      const boundary = crypto.randomUUID().replace(/.+-(\w+)$/, "$1");
      const body = (await Promise.all(ranges.map(async (byteRange) => {
        const uint8Array = new Uint8Array(byteRange.end - byteRange.start + 1);
        await Deno.seek(res.rid, byteRange.start, Deno.SeekMode.Start);
        await res.read(uint8Array);
        return `--${boundary}\r\nContent-Type: ${contentType}\r\nContent-Range: bytes ${byteRange.start}-${byteRange.end}/${fileInfo.size}\r\n\r\n${
          uint8Array.join(" ")
        }\r\n`;
      }))).join("");
      ctx.response.body = `${body}--${boundary}--`;
      ctx.response.headers.set(
        "Content-Type",
        `multipart/byteranges; boundary=${boundary}`,
      );
    }
    ctx.response.status = 206;
  } else {
    const uint8Array = new Uint8Array(fileInfo.size);
    await res.read(uint8Array);
    ctx.response.body = uint8Array;
    ctx.response.headers.set(
      "Content-Range",
      `bytes 0-${fileInfo.size - 1}/${fileInfo.size}`,
    );
    if (contentType) {
      ctx.response.headers.set("Content-Type", contentType);
    }
    ctx.response.status = 200;
  }
  const etag = await calculate(fileInfo, { weak: true });
  if (etag) {
    ctx.response.headers.set("Etag", etag);
  }
  ctx.response.headers.set("Accept-Ranges", "bytes");
  res.close();
  await next();
};

router.get("/proxy/:url", async (ctx, next) => {
  let url = await ctx.params.url;
  url = formatUrl(url);
  url = path.join(config.source, url);
  ctx.state.url = url;
  await next();
}, getResource);

router.get("/decode/:url", async (ctx, next) => {
  const {
    duration,
    start,
    bitrate,
    lossless: losslessStr,
    type,
    title,
    album,
    artist,
  } = helpers.getQuery(ctx);
  const lossless = losslessStr && JSON.parse(losslessStr);
  if (type === "single" && lossless) {
    let url = await ctx.params.url;
    url = formatUrl(url);
    ctx.state.url = path.join(config.source, url);
    await next();
  } else {
    const fileName = `${formatFileName(album)}-${formatFileName(title)}-${
      formatFileName(artist)
    }${bitrate ? "-" + bitrate : ""}.${lossless ? "flac" : "mp3"}`;
    const fileTmp = path.join(__dirname, "../tmp", fileName);
    if (!await exists(fileTmp)) {
      let url = await ctx.params.url;
      url = formatUrl(url);
      const filePath = path.join(config.source, url);
      let args: string[] = [];
      let trackArgs: string[] = [];
      if (type === "tracks") {
        trackArgs = [
          "-ss",
          start,
          "-t",
          duration,
        ];
      }
      if (lossless) {
        args = args.concat(
          "-f",
          "flac",
        );
      } else {
        if (bitrate) {
          args = args.concat("-ab", bitrate);
        }
        args = args.concat("-f", "mp3");
      }
      const cmd = new Deno.Command(config.ffmpegPath, {
        args: [
          ...trackArgs,
          "-i",
          filePath,
          ...args,
          fileTmp,
        ],
      });
      const { stderr, stdout } = await cmd.output();
      const encode = new TextDecoder();
      console.log(encode.decode(stdout));
      console.error(encode.decode(stderr));
    }
    ctx.state.url = fileTmp;
    await next();
  }
}, getResource);

export default router;
