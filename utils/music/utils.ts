import { parse } from "https://esm.sh/cue-parser@0.3.0";
import * as musicMeta from "https://esm.sh/music-metadata@8.1.4";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import config from "../../config.json" assert { type: "json" };

export function msToTime(duration: number): string {
  const seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  return `${hours.toString().padStart(2, "0")}:${
    minutes.toString().padStart(2, "0")
  }:${
    seconds
      .toString()
      .padStart(2, "0")
  }`;
}

export async function getAudioDuration(path: string) {
  const command = new Deno.Command(config.ffprobePath, {
    args: [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_format",
      "-show_streams",
      path,
    ],
  });
  const { code, stdout, stderr } = await command.output();
  const textDecode = new TextDecoder();
  const out = textDecode.decode(stdout);
  const err = textDecode.decode(stderr);
  if (err) {
    console.error("getAudioDuration", err);
  }
  if (code === 0) {
    const matched = out.match(/duration="?(\d*)\.\d*"?/);
    if (matched && matched[1]) {
      return parseFloat(matched[1]);
    }
  }
}

export function getTracksDuration(
  tracks: Tracks,
  totalDuration: number | undefined,
): string[] | undefined {
  if (tracks && totalDuration) {
    const result: string[] = [];
    tracks.reduceRight<number>((pre, current) => {
      let duration;
      const timeMap = current.indexes?.filter((item) =>
        item.number === 1
      )[0].time;
      const time = timeMap
        ? parseFloat(`${timeMap.min * 60 + timeMap.sec}.${timeMap.frame}`)
        : 0;
      if (!pre) {
        duration = totalDuration - time;
      } else {
        duration = pre - time;
      }
      result.push(msToTime(duration * 1000));
      return time;
    }, 0);
    return result.reverse();
  }
  return undefined;
}
type UnionToIntersection<U> = (
  U extends unknown ? (arg: U) => 0 : never
) extends (arg: infer I) => 0 ? I
  : never;
type LastInUnion<U> = UnionToIntersection<
  U extends unknown ? (x: U) => 0 : never
> extends (x: infer L) => 0 ? L
  : never;
type ArrayType<T> = T extends Array<infer T> ? T : undefined;
type Tracks = LastInUnion<
  ArrayType<ReturnType<typeof parse>["files"]>
>["tracks"];
export function getCue(path: string) {
  try {
    const cueSheet = parse(path);
    return cueSheet;
  } catch (e) {
    console.error("getCue", e);
  }
}

export async function getID3(path: string) {
  try {
    const data = await Deno.readFile(path);
    const { common } = await musicMeta.parseBuffer(data);
    return common;
  } catch (e) {
    console.error("getID3", e);
  }
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
            if (cueSheet && cueSheet.files) {
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
