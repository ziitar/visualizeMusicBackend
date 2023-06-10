import {
  getAudioDuration,
  getCue,
  getTracksDuration,
  ItemType,
  mapReadDir,
  msToTime,
} from "./utils.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
import { t2s } from "./chinese-s2t/index.ts";

export function getExtension(mine: string) {
  const [main, sub] = mine.split("/");
  if (main === "image") {
    switch (sub) {
      case "png":
      case "x-png":
      case "x-citrix-png":
        return ".png";
      case "x-icon":
        return ".ico";
      case "gif":
        return ".gif";
      case "bmp":
        return ".bmp";
      case "webp":
        return ".webp";
      case "tiff":
        return ".tiff";
      case "x-rgb":
        return ".rgb";
      case "svg+xml":
        return ".svg";
      case "jpeg":
      case "x-citrix-jpeg":
      default:
        return ".jpg";
    }
  }
  return "";
}

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
export type SaveType = Omit<ItemType, "picture"> & {
  picUrl: string;
  duration?: string;
};
export async function saveResult(path: string, exclude: string[]) {
  const result = await mapReadDir(path, exclude);
  console.log("step 1", result.length);
  const saveArr: SaveType[] = [];
  for (const item of result) {
    if (item.type === "single") {
      let picUrl = "";
      const title = t2s(item.title || "");
      const album = t2s(item.album || "");
      if (item.picture) {
        try {
          picUrl = denoPath.join(
            __dirname,
            "../../assets",
            (album.replace(/[\\/:?''<>|]/g, "-")) +
              getExtension(item.picture[0].format),
          );
          const exist = await exists(picUrl);
          if (!exist) {
            await Deno.writeFile(
              picUrl,
              item.picture[0].data,
            );
          }
        } catch (e) {
          console.error("write img", e);
        }
        delete item.picture;
      }
      const duration = await getAudioDuration(item.url);
      saveArr.push({
        title,
        url: item.url,
        artist: t2s(item.artist || ""),
        album,
        albumartist: t2s(item.albumartist || ""),
        year: item.year,
        type: item.type,
        picUrl,
        duration: duration ? msToTime(duration * 1000) : "",
      });
    } else {
      const cueSheet = getCue(item.url);
      if (cueSheet && cueSheet.files) {
        let picUrl = "";
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
          if (await exists(path) && denoPath.extname(path) !== "") {
            picUrl = path;
          }
        }
        for (const file of cueSheet.files) {
          if (file.tracks) {
            const audioFile = denoPath.join(
              denoPath.dirname(item.url),
              file.name || "",
            );
            const totalDuration = await getAudioDuration(audioFile);
            const durations = getTracksDuration(file.tracks, totalDuration);
            for (const [index, track] of file.tracks.entries()) {
              saveArr.push({
                ...item,
                url: audioFile,
                title: track.title,
                artist: track.performer || cueSheet.performer,
                album: cueSheet.title,
                albumartist: cueSheet.performer,
                picUrl,
                duration: durations ? durations[index] : undefined,
              });
            }
          }
        }
      }
    }
  }
  const textEncode = new TextEncoder();
  await Deno.writeFile(
    denoPath.join(__dirname, "result.json"),
    textEncode.encode(JSON.stringify(saveArr)),
  );
}
