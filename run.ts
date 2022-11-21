import Encrypt from "./utils/neteaseMusicAPI/crypto.js";

const id = 1897737799;

const cryptoreq = await Encrypt({
  c: '[{"id":"1909420635"}]',
  csrf_token: "5569d7d7666399c8780a3273fdf9aa6d",
  id: "1909420635",
}, "s0iDJbDTD29PeUoB");
const body = new URLSearchParams(cryptoreq);

console.log(body.get("params"), "////\n", body.get("encSecKey"));
