import { helpers, Router } from "https://deno.land/x/oak@v12.2.0/mod.ts";
import {
  Album,
  AlbumArtist,
  Artist,
  db,
  Song,
  SongArtist,
  SongSheet,
} from "../../dbs/index.ts";
import { setResponseBody } from "../../utils/util.ts";

const router = new Router();

router.get("/", async (ctx, next) => {
  const result = await Artist.all();
  setResponseBody(ctx, 200, result);
  await next();
});
