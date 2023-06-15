import { Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import * as path from "https://deno.land/std@0.184.0/path/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import { parseRange } from "https://deno.land/x/oak@v12.2.0/range.ts";
import { calculate } from "https://deno.land/x/oak@v12.2.0/etag.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const router = new Router();
router.get("/:url", async (ctx, next) => {
  let url = ctx.params.url;
  url = decodeURIComponent(url);
  try {
    const filePath = path.join(__dirname, `../assets/${url}`);
    const uint8Array = await Deno.readFile(filePath);
    ctx.response.body = uint8Array;
    ctx.response.status = 200;
    await next();
  } catch (e) {
    ctx.response.status = 404;
    ctx.response.body = e.message;
    await next();
  }
});

router.get("/proxy/:url", async (ctx, next) => {
  try {
    let url = await ctx.params.url;
    url = decodeURIComponent(url);
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
  } catch (e) {
    ctx.response.status = 404;
    ctx.response.body = e.message;
  }
  await next();
});
export default router;
