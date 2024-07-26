import { parse } from "npm:cue-parser@0.3.0";
import { IPicture, parseBuffer } from "npm:music-metadata@8.1.4";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { getExtension, Nullable } from "./exec.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
import { filterInvalidValueForStore } from "../util.ts";
import config from "../../config/config.json" assert { type: "json" };
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
      /\s?([,+×\/\&]|feat\.|featuring)\s?/g,
      "$1",
    ).split(
      /[,+×\/&]|feat\.|featuring/g,
    ) || [],
  ).filter((item) => item !== "");
}
export type ArtistType = {
  name: string;
  alias?: string;
};

export async function errorLog(error: Error, additionalInfo?: string) {
  // 获取当前时间
  const timestamp = new Date().toISOString();

  // 构建错误日志消息
  let errorMessage = `[${timestamp}] [ERROR] ${error.message}`;

  // 如果有额外的信息，附加到错误消息中
  if (additionalInfo) {
    errorMessage += ` - Additional Info: ${additionalInfo}\n`;
  } else {
    errorMessage += "\n";
  }

  await Deno.writeTextFile(
    "error.log",
    errorMessage,
    { append: true },
  );
}

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
      const timeMap = current.indexes?.filter((item) => item.number === 1)[0]
        .time;
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
    errorLog(e, `getCue ${path}`).then(() => {});
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
    await errorLog(e, `getID3 ${path}`);
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
/**
 * 该函数用于递归地获取指定目录下的所有文件路径，同时排除一些特定的文件或目录。
 *
 * - **功能说明**:
 *   1. 接受一个目录路径作为输入。
 *   2. 接受一个需要排除的文件或目录名的列表。
 *   3. 返回一个包含所有非排除文件的绝对路径的数组。
 *
 * - **参数**:
 *   - `path`: string类型，表示要搜索的根目录路径。
 *   2. `excludeList`: string[]类型，包含在搜索过程中应该被排除的文件或目录名。
 *
 * - **返回值**:
 *   - 一个string[]类型的数组，包含了`path`目录下所有非排除文件的绝对路径。
 */
export async function getAllFilePaths(
  path: string,
  excludeList?: string[],
): Promise<string[]> {
  const result: string[] = [];

  async function walk(dir: string): Promise<void> {
    try {
      for await (const entry of Deno.readDir(dir)) {
        const filePath = denoPath.join(dir, entry.name);
        if (entry.isDirectory) {
          if (excludeList && !excludeList.includes(entry.name)) {
            await walk(filePath);
          } else {
            await walk(filePath);
          }
        } else {
          if (excludeList && !excludeList.includes(entry.name)) {
            result.push(filePath);
          } else {
            result.push(filePath);
          }
        }
      }
    } catch (e) {
      await errorLog(
        e,
        `getAllFilePaths throw a Error: ${path} is not a directory, or ${path} is not a exist path`,
      );
    }
  }

  await walk(path);
  return result;
}

export function filterCUEWavFiles(files: string[]) {
  const cueFiles = files.filter((file) => {
    const extname = denoPath.extname(file);
    return ".cue" === extname;
  });
  const excludeFile = cueFiles.reduce<string[]>((result, cueFile) => {
    const cueSheet = getCue(cueFile);
    let referenceFiles: string[] = [];
    if (cueSheet && cueSheet.files) {
      referenceFiles = cueSheet.files.map((item) =>
        denoPath.join(denoPath.dirname(cueFile), item.name!)
      );
    }
    return result.concat(referenceFiles);
  }, []);
  return files.filter((file) => {
    if (
      [".mp3", ".wav", ".wma", ".flac", ".ogg", ".aac", ".cue"].includes(
        denoPath.extname(file),
      )
    ) {
      return !excludeFile.includes(file);
    }
    return false;
  });
}

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
export async function saveMusicMsg(music: ItemType) {
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
  } = music;
  // 初始化封面图片URL
  let picUrl = "";
  try {
    // 如果项目包含封面图片信息
    if (picture) {
      // 构建封面图片的存储路径
      picUrl = denoPath.join(
        __dirname,
        "../../assets",
        `${formatFileName(album)}-${formatFileName(albumartist || artist)}.${
          getExtension(picture[0].format)
        }`,
      );
      // 检查封面图片是否已存在，如果不存在，则写入文件系统
      const exist = await exists(picUrl);
      if (!exist) {
        await Deno.writeFile(
          picUrl,
          picture[0].data,
        );
      }
    } else {
      // 定义备选封面文件名列表
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
      // 循环查找并处理存在的封面图片
      while (mb.length && picUrl === "") {
        const fileName = mb.shift();
        const path = denoPath.join(
          denoPath.dirname(music.url),
          fileName || "",
        );
        // 如果找到封面图片，复制到指定目录
        if (await exists(path)) {
          picUrl = denoPath.join(
            __dirname,
            "../../assets",
            `${formatFileName(album)}-${formatFileName(albumartist || artist)}${
              denoPath.extname(path)
            }`,
          );
          const exist = await exists(picUrl);
          if (!exist) {
            await Deno.copyFile(path, picUrl);
          }
        }
      }
    }
  } catch (e) {
    // 如果在处理图片过程中发生错误，打印错误信息
    await errorLog(e, "write img");
  }
  return filterInvalidValueForStore({
    type,
    url: denoPath.relative(config.source, url),
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
    start: music.type === "tracks" ? music.start : undefined,
    bitrate: music.type === "single" ? music.bitrate : undefined,
  });
}
export async function getMusicFileMsg(file: string) {
  const extname = denoPath.extname(file);
  const musicFileMsg = [];
  if (extname === ".cue") {
    const cueSheet = getCue(file);
    const path = denoPath.dirname(file);
    if (cueSheet && cueSheet.files) {
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
              const timeMap = track.indexes[track.indexes.length - 1].time;
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
            const msg = await saveMusicMsg(song);
            musicFileMsg.push(msg);
          }
        }
      }
    }
  } else {
    const id3Result = await getID3(file);
    if (id3Result) {
      let duration = "";
      if (id3Result.format.duration) {
        duration = msToTime(id3Result.format.duration * 1000);
      }
      const song: ItemType = {
        type: "single",
        url: file,
        ...id3Result.common,
        ...id3Result.format,
        duration,
      };
      const msg = await saveMusicMsg(song);
      musicFileMsg.push(msg);
    }
  }
  return musicFileMsg;
}

export async function processMusicFileMsg(path: string, exclude?: string[]) {
  const files = await getAllFilePaths(path, exclude);
  const filterWavFiles = filterCUEWavFiles(files);
  const msg = await Promise.allSettled(
    filterWavFiles.map(async (file) => await getMusicFileMsg(file)),
  );
  const context: Nullable<
    {
      type: "tracks" | "single";
      url: string;
      picUrl: string;
      title: string | undefined;
      artist: string | undefined;
      album: string | undefined;
      albumartist: string | undefined;
      year: number | undefined;
      duration: string | undefined;
      trackNo: number | undefined;
      trackTotal: number | undefined;
      diskNo: number | undefined;
      diskTotal: number | undefined;
      lossless: boolean | undefined;
      sampleRate: number | undefined;
      start: number | undefined;
      bitrate: number | undefined;
    }
  >[][] = [];
  msg.forEach((item) => {
    if (item.status === "fulfilled") {
      context.push(item.value);
    }
  });
  const textEncode = new TextEncoder();
  await Deno.writeFile(
    denoPath.join(__dirname, "result.json"),
    textEncode.encode(JSON.stringify(context.flat())),
  );
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
