import { getCue, ItemType, mapReadDir } from "./utils.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
type SaveType = Omit<ItemType, "picture"> & { picUrl: string };
export async function saveResult(path: string, exclude: string[]) {
  const result = await mapReadDir(path, exclude);
  const saveArr: SaveType[] = [];
  for (const item of result) {
    if (item.type === "single") {
      let picUrl = "";
      if (item.picture) {
        picUrl = denoPath.join(
          __dirname,
          "../../assets",
          item.title || "",
          item.picture[0].format, //todo 文件名后缀
        );
        await Deno.writeFile(
          picUrl,
          item.picture[0].data,
        );
        delete item.picture;
      }
      saveArr.push({
        ...item,
        picUrl,
      });
    } else {
      const cueSheet = getCue(item.url);
      if (cueSheet.files) {
        let picUrl = "";
        const mb: string[] = [
          "Cover.jpg",
          "cover.jpg",
          "front.jpg",
          "Front.jpg",
          "Back.jpg",
          "back.jpg",
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
            for (const track of file.tracks) {
              saveArr.push({
                ...item,
                url: denoPath.join(denoPath.dirname(item.url), file.name || ""),
                title: track.title,
                artist: track.performer,
                album: cueSheet.title,
                albumartist: cueSheet.performer,
                picUrl,
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
