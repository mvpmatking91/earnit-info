export const CHALLENGE_HOST = "earnit-info.onrender.com";
export const APP_STORE_URL = "https://apps.apple.com/app/id6819877235";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.michaelpersichini.betterfirst";
export const LINK_TASKS = [
  "pushups",
  "squats",
  "situps",
  "jumpingjacks",
  "pullups",
];
const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function encode(bytes) {
  let bits = 0,
    value = 0,
    out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      out += alphabet[(value >>> bits) & 63];
    }
  }
  if (bits) out += alphabet[(value << (6 - bits)) & 63];
  return out;
}
function decode(text) {
  if (!/^[A-Za-z0-9_-]{42}$/.test(text)) throw Error("Invalid challenge link.");
  let bits = 0,
    value = 0,
    out = [];
  for (const ch of text) {
    value = (value << 6) | alphabet.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 255);
    }
  }
  const bytes = Uint8Array.from(out);
  if (encode(bytes) !== text) throw Error("Invalid challenge link.");
  return bytes;
}
function write(bytes, start, size, value) {
  for (let i = size - 1; i >= 0; i--) {
    bytes[start + i] = value % 256;
    value = Math.floor(value / 256);
  }
}
function read(bytes, start, size) {
  let n = 0;
  for (let i = 0; i < size; i++) n = n * 256 + bytes[start + i];
  return n;
}
export function challengeToken(c) {
  const index = LINK_TASKS.indexOf(c.taskId);
  if (
    index < 0 ||
    !Number.isSafeInteger(c.goal) ||
    c.goal < 1 ||
    !Number.isSafeInteger(c.createdAt) ||
    c.createdAt < 0 ||
    c.createdAt > 281474976710655 ||
    !/^[a-f0-9]{32}$/i.test(c.id)
  )
    throw Error("Invalid challenge.");
  const b = new Uint8Array(31);
  b[0] = 1;
  b[1] = index;
  write(b, 2, 7, c.goal);
  write(b, 9, 6, c.createdAt);
  for (let i = 0; i < 16; i++)
    b[15 + i] = parseInt(c.id.slice(i * 2, i * 2 + 2), 16);
  return encode(b);
}
export function challengeCodeFromToken(token) {
  const b = decode(token),
    goal = read(b, 2, 7),
    createdAt = read(b, 9, 6),
    taskId = LINK_TASKS[b[1]];
  if (b[0] !== 1 || !taskId || !Number.isSafeInteger(goal) || goal < 1)
    throw Error("Invalid challenge link.");
  const id = Array.from(b.slice(15), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
  return ["EI1", taskId, goal, createdAt, id].join(":");
}
export function publicChallengeLink(c) {
  return "https://" + CHALLENGE_HOST + "/challenge.html?c=" + challengeToken(c);
}
