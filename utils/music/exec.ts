import { formatFileName, ItemType, mapReadDir } from "./utils.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import { filterInvalidValueForStore } from "../util.ts";
import config from "../../config/config.json" assert { type: "json" };
export function getExtension(str: string) {
  return mime.getExtension(str.replace(/(\w+\/\w+).*/, "$1"));
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
/**
 * 异步保存目录扫描结果到文件。
 * @param path 需要扫描的目录路径。
 * @param exclude 需要排除的文件或目录列表。
 */
export async function saveResult(path: string, exclude: string[]) {
  // 获取目录扫描结果
  const result = await mapReadDir(path, exclude);
  // 定义保存数组，用于存储处理后的数据
  const saveArr: SaveType[] = [];
  
  // 遍历扫描结果中的每个项目
  for (const item of result) {
    // 解构每个项目的信息
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
            denoPath.dirname(item.url),
            fileName || "",
          );
          // 如果找到封面图片，复制到指定目录
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
      // 如果在处理图片过程中发生错误，打印错误信息
      console.error("write img", e);
    }
    
    // 过滤无效值，并准备数据存储格式
    saveArr.push(filterInvalidValueForStore({
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
      start: item.type === "tracks" ? item.start : undefined,
      bitrate: item.type === "single" ? item.bitrate : undefined,
    }));
  }
  
  // 使用TextEncoder将处理后的数据编码为UTF-8，并写入到result.json文件中
  const textEncode = new TextEncoder();
  await Deno.writeFile(
    denoPath.join(__dirname, "result.json"),
    textEncode.encode(JSON.stringify(saveArr)),
  );
}
