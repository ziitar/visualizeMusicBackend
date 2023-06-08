import { parse } from "https://esm.sh/cue-parser@0.3.0";
import * as musicMeta from "https://esm.sh/music-metadata@8.1.4";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
export function getCue(path: string) {
  const cueSheet = parse(path);
  return cueSheet;
}

export async function getID3(path: string) {
  const data = await Deno.readFile(path);
  const { common } = await musicMeta.parseBuffer(data);
  return common;
}

export interface ItemType {
  type: "tracks" | "single";
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  albumartist?: string;
  year?: number;
  picture?: musicMeta.IPicture[];
}
export async function mapReadDir(
  path: string,
  exclude: string[],
): Promise<ItemType[]> {
  let result: ItemType[] = [];
  let excludeFiles: string[] = [];
  let childFiles: ItemType[] = [];
  const files = Deno.readDir(path);
  for await (const file of files) {
    if (file.isDirectory) {
      if (!exclude.includes(file.name)) {
        const depFiles = await mapReadDir(
          denoPath.join(path, file.name),
          exclude,
        );
        childFiles = childFiles.concat(depFiles);
      }
    } else {
      const extname = denoPath.extname(file.name);
      if (
        [".mp3", ".wav", ".wma", ".flac", ".ogg", ".aac", ".cue"].includes(
          extname,
        ) &&
        !excludeFiles.includes(file.name)
      ) {
        if (extname === ".cue") {
          try {
            const cueSheet = getCue(denoPath.join(path, file.name));
            if (cueSheet.files) {
              const referenceFiles = cueSheet.files.map((item) => item.name!);
              excludeFiles = excludeFiles.concat(
                referenceFiles,
              );
              result = result.filter((item) =>
                !referenceFiles.includes(denoPath.basename(item.url))
              );
              result.push({
                type: "tracks",
                url: denoPath.join(path, file.name),
              });
            }
          } catch (e) {
            console.error(e, path, file.name);
          }
        } else {
          const id3 = await getID3(denoPath.join(path, file.name));
          result.push({
            type: "single",
            url: denoPath.join(path, file.name),
            ...id3,
          });
        }
      }
    }
  }
  result = result.concat(childFiles);
  return result;
}
