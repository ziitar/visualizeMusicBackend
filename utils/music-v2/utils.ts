import { File } from "npm:node-taglib-sharp@5.2.3";
import { join } from "https://deno.land/std@0.184.0/path/mod.ts";

const audio = File.createFromPath(
    join(
        "Y:/",
        "庄心妍\\庄心·妍时代\\1. 再没见你的身份.flac",
    ),
);

console.log(
    audio.tag.title,
    audio.tag.performers,
    audio.tag.album,
    audio.properties.durationMilliseconds,
);
