import configs from "./configs/env.configs";
import { Midjourney } from ".";

let all_info: any[] = [];

async function get_infos() {
  await Promise.all(configs.discord.free.map((async (discordConfig) => {
    const client = new Midjourney({
      ServerId: discordConfig ? <string>discordConfig.server : <string>process.env.SERVER_ID,
      ChannelId: discordConfig ? <string>discordConfig.channel : <string>process.env.CHANNEL_ID,
      SalaiToken: discordConfig ? <string>discordConfig.token : <string>process.env.SALAI_TOKEN,
      HuggingFaceToken: <string>process.env.HUGGINGFACE_TOKEN,
      Debug: false,
      Ws: true,
    });
    await client.Connect();
    let msg: any = await client.Info();
    msg.name = discordConfig ? discordConfig.name : "default";
    all_info.push(msg);
    client.Close();
  })));
  console.log(all_info);
  return all_info;
}

get_infos();
