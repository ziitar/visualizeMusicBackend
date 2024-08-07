import {
  assertEquals,
  assertExists,
  assertNotEquals,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import {
  errorLog,
  filterCUEWavFiles,
  getAllFilePaths,
  getCue,
  getID3,
  mapReadDir,
  processMusicFileMsg,
  splitArtist,
  splitArtistWithAlias,
} from "./utils.ts";
import { getExtension } from "./exec.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { saveResult } from "./exec.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";
import config from "../../config/config.json" assert { type: "json" };

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
Deno.test({
  name: "test cue parse",
  ignore: true,
  fn: async () => {
    const path =
      "Y:\\林俊杰46专辑54CD\\2004-第二天堂[台湾版][WAV]\\2004-第二天堂[台湾版][WAV]\\林俊杰.-.[第二天堂](2004)[WAV].cue";

    const cueSheet = await getCue(path);
    if (cueSheet) {
      assertEquals(cueSheet.performer, "林俊杰");
      assertEquals(cueSheet.title, "第二天堂 [台湾版]");
      if (cueSheet.files) {
        assertEquals(
          cueSheet.files[0].name,
          "林俊杰.-.[第二天堂](2004)[WAV].wav",
        );
        assertNotEquals(cueSheet.files[0].tracks, undefined);
        assertNotEquals(cueSheet.files[0].tracks, []);
        if (cueSheet.files[0].tracks) {
          assertEquals(cueSheet.files[0].tracks[0].title, "一开始....");
        }
      }
    }
  },
});

Deno.test({
  name: "test getID3",
  ignore: true,
  fn: async () => {
    const path =
      "Y:\\陈奕迅63专辑\\2002粤语 陈奕迅.-.[THE.LINE-UP].专辑.(ape)\\陈奕迅.-.[THE.LINE-UP].专辑.(ape).ape";
    const result = await getID3(path);
    console.log(result);
    assertNotEquals(result, undefined);
  },
});

Deno.test({
  name: "test mapReadDir",
  ignore: true,
  fn: async () => {
    const path = "Y:\\林俊杰46专辑54CD";
    const result = await mapReadDir(path, []);
    console.log(JSON.stringify(result));
    assertEquals(result.length > 45, true);
    assertEquals(result[0].type, "tracks");
    assertEquals(
      result.filter((item) => denoPath.extname(item.url) === ".wav").length,
      0,
    );
  },
});

Deno.test({
  name: "test mapReadDir with exclude",
  ignore: true,
  fn: async () => {
    const path = "Y:\\梁静茹";
    const result = await mapReadDir(path, [
      "爱久见人心",
      "崇拜",
      "静茹&情歌 别再为他流泪",
      "恋爱的力量",
      "亲亲",
    ]);
    console.log(result.map((item) => item.title));
    assertEquals(result.length, 14);
    assertEquals(result[0].type, "single");
  },
});

Deno.test({
  name: "test exec",
  ignore: true,
  fn: async () => {
    await saveResult(
      "Y:\\陈奕迅63专辑",
      [],
    );
    const path = denoPath.join(__dirname, "result.json");
    assertEquals(await exists(path), true);
  },
});

Deno.test({
  name: "test exec with cue",
  ignore: true,
  fn: async () => {
    await saveResult(
      "Y:\\",
      ["tmp"],
    );
    const path = denoPath.join(__dirname, "result.json");
    assertEquals(await exists(path), true);
  },
});

Deno.test({
  name: "test file exist",
  ignore: true,
  fn: async () => {
    const path =
      "C:\\Users\\uziit\\AppData\\Local\\Temp\\55324f96/5d8395c7f324f7455b09abddc2fea32c060c906b.jpeg";
    const exist = await exists(path);
    console.log(exist);
    assertEquals(exist, true);
  },
});

Deno.test({
  name: "test path resolve",
  ignore: true,
  fn: () => {
    const path = "Y:\\林忆莲\\Love,Sandy\\为你我受冷风吹.flac";
    const i = denoPath.relative(config.source, path);
    assertEquals(i, "Love,Sandy\\为你我受冷风吹.flac");
    const j = denoPath.join(config.source, i);
    assertEquals(j, path);
  },
});

Deno.test({
  name: "test getExtension",
  ignore: true,
  fn: async () => {
    const path = "Y:\\李荣浩\\麻雀\\在一起嘛好不好.mp3";
    const id3 = await getID3(path);
    assertNotEquals(id3, undefined);
    assertNotEquals(id3?.common.picture, undefined);
    console.log(id3);
    if (id3 && id3.common.picture) {
      const ext = getExtension(id3.common.picture[0].format);
      console.log(ext, id3.common.picture[0].format);
      assertNotEquals(ext, undefined);
    }
  },
});

Deno.test({
  name: "test splitArtist",
  ignore: false,
  fn: async () => {
    const path =
      "Y:\\Various Artists\\Various Artists\\2-10 椎名豪 featuring 中川奈美 - 竈門炭治郎のうた -OST ver.-.flac";
    const id3 = await getID3(path);
    const artist = id3?.common.artist;
    const result = splitArtist(artist);
    console.log(result, artist, id3?.common);
    assertEquals(result.length, 2);
  },
});
Deno.test({
  name: "test splitArtistWithAlias",
  ignore: false,
  fn: async () => {
    const path =
      "Y:\\澤野弘之\\澤野弘之\\15 澤野弘之 _Vocal_ mpi & CASG (Caramel Apple Sound Gadget)_ - Call your name.flac";
    const id3 = await getID3(path);
    const artist = id3?.common.artist;
    //'澤野弘之 <Vocal: mpi&CASG (Caramel Apple Sound Gadget)>'
    const artists = splitArtist(artist);
    console.log(id3, artist, artists);
    assertEquals(artists.length, 3);
    const result = artists.map((item) => {
      const result = splitArtistWithAlias(item);
      return result.alias;
    }).filter((item) => !!item);
    assertEquals(result.length, 1);
  },
});

Deno.test({
  name: "test getAllFilePaths",
  ignore: false,
  fn: async () => {
    const path = "Y:\\林俊杰46专辑54CD";
    const result = await getAllFilePaths(path);
    console.log(result);
    assertEquals(result.length, 1);
  },
});
Deno.test({
  name: "test filterCUEWavFiles",
  ignore: false,
  fn: async () => {
    const path = "Y:\\林俊杰46专辑54CD";
    const files = await getAllFilePaths(path);
    const result = filterCUEWavFiles(files);
    const filter = result.filter((item) => denoPath.extname(item) === ".wav");
    console.log(result, filter);
    assertEquals(filter.length, 0);
  },
});

Deno.test({
  name: "test path dirname ",
  ignore: false,
  fn: () => {
    const path =
      "Y:\\林俊杰46专辑54CD\\2004-第二天堂[台湾版][WAV]\\2004-第二天堂[台湾版][WAV]\\林俊杰.-.[第二天堂](2004)[WAV].cue";
    const fatherPath = denoPath.dirname(path);
    assertEquals(
      fatherPath,
      "Y:\\林俊杰46专辑54CD\\2004-第二天堂[台湾版][WAV]\\2004-第二天堂[台湾版][WAV]",
    );
  },
});
Deno.test({
  name: "test errorLog ",
  ignore: false,
  fn: async () => {
    try {
      throw new Error("test errorLog");
    } catch (e) {
      await errorLog(e);
    }
    const text = await Deno.readTextFile("error.log");
    console.log(text);
    assertExists(text);
  },
});
Deno.test({
  name: "test processMusicFileMsg ",
  ignore: false,
  fn: async () => {
    await processMusicFileMsg("Y:\\陈雪燃");
    const text = await Deno.readTextFile(
      denoPath.join(__dirname, "result.json"),
    );
    console.log(text);
    assertExists(text);
  },
});
