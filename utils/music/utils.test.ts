import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { getAudioDuration, getCue, getID3, mapReadDir } from "./utils.ts";
import * as denoPath from "https://deno.land/std@0.184.0/path/mod.ts";
import { saveResult } from "./exec.ts";
import { exists } from "https://deno.land/std@0.184.0/fs/mod.ts";

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
Deno.test({
  name: "test cue parse",
  ignore: true,
  fn: async () => {
    const path =
      "Y:\\林俊杰46专辑54CD\\2003-乐行者[内地首版][WAV]\\2003-乐行者[内地首版][WAV]\\林俊杰.-.[乐行者](2003)[WAV].cue";

    const cueSheet = getCue(path);
    const textEncode = new TextEncoder();
    const uint8array = textEncode.encode(JSON.stringify(cueSheet));
    await Deno.writeFile("./cueSheet.json", uint8array);
    if (cueSheet) {
      assertEquals(cueSheet.performer, "林俊杰");
      assertEquals(cueSheet.title, "乐行者 [内地版]");
      if (cueSheet.files) {
        assertEquals(
          cueSheet.files[0].name,
          "林俊杰.-.[乐行者](2003)[WAV].wav",
        );
        assertNotEquals(cueSheet.files[0].tracks, undefined);
        assertNotEquals(cueSheet.files[0].tracks, []);
        if (cueSheet.files[0].tracks) {
          assertEquals(cueSheet.files[0].tracks[0].title, "就是我");
        }
      }
    }
  },
});

Deno.test({
  name: "test getID3",
  ignore: true,
  fn: async () => {
    const path = "Y:\\TRA$H\\ＷＡＩＴＩＮＧ\\ＷＡＩＴＩＮＧ.mp3";
    const common = await getID3(path);
    console.log(common);
    if (common) {
      assertEquals(common.title, "intro红");
    }
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
      "Y:\\梁咏琪",
      ["最爱梁咏琪"],
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
  name: "test getAudioDuration with wav",
  ignore: true,
  fn: async () => {
    const path =
      "Y:\\陈奕迅63专辑\\2000 陈奕迅.林子祥.-.[拉阔压轴林子祥.&.陈奕迅演唱会].专辑.(APE)\\陈奕迅.林子祥.-.[拉阔压轴林子祥.&.陈奕迅演唱会CD1].专辑.(APE).ape";
    const duration = await getAudioDuration(path);
    console.log(duration);
    assertEquals(typeof duration, "number");
  },
});

Deno.test({
  name: "test getAudioDuration with mp3",
  ignore: true,
  fn: async () => {
    const path = "Y:\\A Fine Frenzy\\One Cell in the Sea\\06 Almost Lover.mp3";
    const duration = await getAudioDuration(path);
    console.log(duration);
    assertEquals(typeof duration, "number");
  },
});

Deno.test({
  name: "test getAudioDuration with flac",
  ignore: true,
  fn: async () => {
    const path = "Y:\\周杰伦\\1.JAY\\印第安老斑鸠.flac";
    const duration = await getAudioDuration(path);
    console.log(duration);
    assertEquals(typeof duration, "number");
  },
});
