import "dotenv/config";
import { Midjourney, detectBannedWords } from "../src";
import { url } from "inspector";

import fs from 'fs';

const filePath = './src/configs/secrets.json';

export interface DiscordConfig {
  name: string,
  buyer: string,
  token: string,
  server: string,
  channel: string,
  modes: string[],
}
interface Secrets {
  discords: DiscordConfig[];
  salali_tokens: string[];
  salali_frees: string[];
  channels: string[];
  channels_free: string[];
}

console.log('start');
const secret: Secrets = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const discord = secret.discords[secret.discords.length - 1];
console.log(discord);
/**
 *
 * a simple example of how to use faceSwap
 * ```
 * npx tsx example/faceswap.ts
 * ```
 */
async function main() {
  const source = `https://cdn.discordapp.com/attachments/1132651717503225908/1158289689221009419/mahdi2.jpg`;
  // const source = `https://cdn.discordapp.com/attachments/1108587422389899304/1129321826804306031/guapitu006_Cute_warrior_girl_in_the_style_of_Baten_Kaitos__111f39bc-329e-4fab-9af7-ee219fedf260.png`;
  const target = `https://felixrosberg-face-swap.hf.space/file=/home/user/app/assets/musk.jpg`;
  const client = new Midjourney({
    ServerId: discord.server,
    ChannelId: discord.channel,
    SalaiToken: discord.token,
    Debug: true,
    HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
  });
  const info = await client.FaceSwap(target, source);
  console.log(info?.uri);
}
main()
  .then(() => {
    console.log("finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
