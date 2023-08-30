import { parse } from "npm:cue-parser@0.3.0";
import { IPicture, parseBuffer } from "npm:music-metadata@8.1.4";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
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
export function formatFileName(name?: string) {
  return name?.replace(/[\\/:?''<>|]/g, "_");
}
const excludeArtist = [
  "K/DA",
];
export function splitArtist(str?: string) {
  let tmp = str?.trimEnd().trimStart() || "";
  const result: string[] = [];
  excludeArtist.forEach((exc) => {
    const reg = new RegExp(`(${exc})`);
    const match = tmp.match(reg);
    if (match !== null) {
      result.push(match[1]);
      tmp = tmp.replace(reg, "");
    }
  });
  return result.concat(
    tmp.replace(
      /\s?([,:+×\/\&]|feat\.|featuring)\s?/g,
      "$1",
    ).split(
      /[,:+×\/&]|feat\.|featuring/g,
    ) || [],
  ).filter((item) => item !== "");
}
export type ArtistType = {
  name: string;
  alias?: string;
};
export function splitArtistWithAlias(str: string) {
  const reg = /[\(（](CV:)?(.+)[\)）]/;
  const match = str.match(reg);
  const artist: ArtistType = {
    name: str.replace(reg, ""),
  };
  if (match) {
    artist.alias = match[2];
  }
  return artist;
}
export function getTracksDuration(
  tracks: Tracks,
  totalDuration: number | undefined,
): (string | undefined)[] | undefined {
  if (tracks) {
    const result: (string | undefined)[] = [];
    tracks.reduceRight<number>((pre, current) => {
      let duration;
      const timeMap = current.indexes?.filter((item) =>
        item.number === 1
      )[0].time;
      const time = timeMap
        ? parseFloat(`${timeMap.min * 60 + timeMap.sec}.${timeMap.frame}`)
        : 0;
      if (!pre) {
        if (totalDuration) {
          duration = totalDuration - time;
        }
      } else {
        duration = pre - time;
      }
      if (duration) {
        result.push(msToTime(duration * 1000));
      } else {
        result.push(undefined);
      }
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
    console.error(`getCue ${path}`, e);
  }
}
type IAudioMetadata = ReturnType<typeof parseBuffer>;
export async function getID3(
  path: string,
): Promise<IAudioMetadata | undefined> {
  try {
    const data = await Deno.readFile(path);
    return await parseBuffer(data);
  } catch (e) {
    console.error(`getID3 ${path}`, e);
    return undefined;
  }
}
export type ItemType = TrackItemType | SingleItemType;

interface TrackItemType extends BaseItemType {
  type: "tracks";
  start: number;
}
interface SingleItemType extends BaseItemType {
  type: "single";
  bitrate?: number;
}
interface BaseItemType {
  track: {
    no: number | null;
    of: number | null;
  };
  disk: {
    no: number | null;
    of: number | null;
  };
  lossless?: boolean;
  url: string;
  title?: string;
  artist?: string;
  album?: string;
  albumartist?: string;
  year?: number;
  picture?: IPicture[];
  duration?: string;
  sampleRate?: number;
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
              for (const file of cueSheet.files) {
                if (file.tracks) {
                  const audioFile = denoPath.join(
                    path,
                    file.name || "",
                  );
                  const id3 = await getID3(audioFile);
                  const durations = getTracksDuration(
                    file.tracks,
                    id3?.format.duration,
                  );
                  for (const [index, track] of file.tracks.entries()) {
                    let startTime: number = 0;
                    if (track.indexes) {
                      const timeMap =
                        track.indexes[track.indexes.length - 1].time;
                      startTime = parseFloat(
                        `${timeMap.min * 60 + timeMap.sec}.${timeMap.frame}`,
                      );
                    }
                    const song: ItemType = {
                      ...id3?.format,
                      ...id3?.common,
                      type: "tracks",
                      url: audioFile,
                      title: track.title,
                      artist: track.performer || cueSheet.performer ||
                        id3?.common.artist,
                      album: cueSheet.title,
                      albumartist: cueSheet.performer ||
                        id3?.common.albumartist,
                      duration: durations ? durations[index] : undefined,
                      track: {
                        no: index + 1,
                        of: file.tracks.length,
                      },
                      disk: id3 ? id3.common.disk : { no: null, of: null },
                      start: startTime,
                    };
                    if (song.album) {
                      result.push(song);
                    } else {
                      console.error(song.title, " not album");
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error(e, path, file.name);
          }
        } else {
          const id3Result = await getID3(denoPath.join(path, file.name));
          if (id3Result) {
            let duration = "";
            if (id3Result.format.duration) {
              duration = msToTime(id3Result.format.duration * 1000);
            }
            if (id3Result.common.album) {
              result.push({
                type: "single",
                url: denoPath.join(path, file.name),
                ...id3Result.common,
                ...id3Result.format,
                duration,
              });
            } else {
              console.error(id3Result.common.title, " not album");
            }
          }
        }
      }
    }
  }
  result = result.concat(childFiles);
  return result;
}
