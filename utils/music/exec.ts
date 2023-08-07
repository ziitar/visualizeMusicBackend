import { formatFileName, ItemType, mapReadDir } from "./utils.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import { filterInvalidValueForStore } from "../util.ts";
export function getExtension(str: string) {
  return mime.getExtension(str);
}

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
export type TAndNull<T> = T extends undefined ? null : T;
export type Nullable<T> = {
  [P in keyof T]-?: TAndNull<T[P]>;
};
export type SaveType = Nullable<
  Omit<ItemType, "picture" | "track" | "disk"> & {
    picUrl: string;
    trackNo?: number;
    trackTotal?: number;
    diskTotal?: number;
    diskNo?: number;
    start?: number;
    bitrate?: number;
  }
>;
export async function saveResult(path: string, exclude: string[]) {
  const result = await mapReadDir(path, exclude);
  const saveArr: SaveType[] = [];
  for (const item of result) {
    const {
      type,
      url,
      picture,
      title,
      artist,
      album,
      albumartist,
      year,
      duration,
      track,
      disk,
      lossless,
      sampleRate,
    } = item;
    let picUrl = "";
    try {
      if (picture) {
        picUrl = denoPath.join(
          __dirname,
          "../../assets",
          `${formatFileName(album)}-${formatFileName(albumartist || artist)}.${
            getExtension(picture[0].format)
          }`,
        );
        const exist = await exists(picUrl);
        if (!exist) {
          await Deno.writeFile(
            picUrl,
            picture[0].data,
          );
        }
      } else {
        const mb: string[] = [
          "Cover.jpg",
          "cover.jpg",
          "front.jpg",
          "Front.jpg",
          "Back.jpg",
          "back.jpg",
          "folder.jpg",
          "folder.png",
          "Cover.png",
          "cover.png",
          "front.png",
          "Front.png",
          "Back.png",
          "back.png",
        ];
        while (mb.length && picUrl === "") {
          const fileName = mb.shift();
          const path = denoPath.join(
            denoPath.dirname(item.url),
            fileName || "",
          );
          if (await exists(path)) {
            picUrl = denoPath.join(
              __dirname,
              "../../assets",
              `${formatFileName(album)}-${
                formatFileName(albumartist || artist)
              }${denoPath.extname(path)}`,
            );
            const exist = await exists(picUrl);
            if (!exist) {
              await Deno.copyFile(path, picUrl);
            }
          }
        }
      }
    } catch (e) {
      console.error("write img", e);
    }
    saveArr.push(filterInvalidValueForStore({
      type,
      url,
      picUrl: `/assets/${denoPath.basename(picUrl)}`,
      title,
      artist,
      album,
      albumartist: albumartist || artist,
      year,
      duration,
      trackNo: track.no || undefined,
      trackTotal: track.of || undefined,
      diskNo: disk.no || undefined,
      diskTotal: disk.of || undefined,
      lossless,
      sampleRate,
      start: item.type === "tracks" ? item.start : undefined,
      bitrate: item.type === "single" ? item.bitrate : undefined,
    }));
  }
  const textEncode = new TextEncoder();
  await Deno.writeFile(
    denoPath.join(__dirname, "result.json"),
    textEncode.encode(JSON.stringify(saveArr)),
  );
}
