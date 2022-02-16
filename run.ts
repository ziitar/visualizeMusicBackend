import { Md5 } from "https://deno.land/std@0.125.0/hash/md5.ts";

const md5 = new Md5();
md5.update("907674615ww");
console.log(md5.toString());
