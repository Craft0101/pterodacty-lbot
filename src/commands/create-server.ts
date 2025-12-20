import axios from "axios";
import { Message } from "discord.js";

export default {
  name: "createserver",
  description: "Create a new Pterodactyl server (interactive)",
  async execute(message: Message, args: string[]) {
    // Restrict to Payouters role only
    const PAYOUTERS_ROLE_ID = "1451581007286370525";
    if (!message.member?.roles.cache.has(PAYOUTERS_ROLE_ID)) {
      return message.reply("❌ You don’t have permission to run this command.");
    }

    // Usage: !createserver <serverName> <userId>
    if (args.length < 2) {
      return message.reply("Usage: !createserver <serverName> <userId>");
    }

    const serverName = args[0];
    const userId = parseInt(args[1]);

    const host = process.env.PTERO_HOST;
    const apiKey = process.env.PTERO_API_KEY;

    if (!host || !apiKey) {
      return message.reply("⚠️ Pterodactyl host or API key not configured.");
    }

    try {
      // Step 1: Fetch nests
      const nestsRes = await axios.get(`${host}/api/application/nests`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const nests = nestsRes.data.data;
      let nestsList = nests.map((n: any) => `${n.attributes.id}: ${n.attributes.name}`).join("\n");
      await message.reply(`📦 Available Nests:\n${nestsList}\nReply with the Nest ID you want.`);
      const nestMsg = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: 30000,
      });
      const nestId = parseInt(nestMsg.first()?.content || "0");

      // Step 2: Fetch eggs
      const eggsRes = await axios.get(`${host}/api/application/nests/${nestId}/eggs`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const eggs = eggsRes.data.data;
      let eggsList = eggs.map((e: any) => `${e.attributes.id}: ${e.attributes.name}`).join("\n");
      await message.reply(`🥚 Available Eggs:\n${eggsList}\nReply with the Egg ID you want.`);
      const eggMsg = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: 30000,
      });
      const eggId = parseInt(eggMsg.first()?.content || "0");

      // Step 3: Fetch nodes
      const nodesRes = await axios.get(`${host}/api/application/nodes`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const nodes = nodesRes.data.data;
      let nodesList = nodes.map((n: any) => `${n.attributes.id}: ${n.attributes.name}`).join("\n");
      await message.reply(`🖥️ Available Nodes:\n${nodesList}\nReply with the Node ID you want.`);
      const nodeMsg = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: 30000,
      });
      const nodeId = parseInt(nodeMsg.first()?.content || "0");

      // Step 4: Fetch allocations
      const allocRes = await axios.get(`${host}/api/application/nodes/${nodeId}/allocations`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const allocations = allocRes.data.data;
      let allocList = allocations.map((a: any) => `${a.attributes.id}: ${a.attributes.ip}:${a.attributes.port}`).join("\n");
      await message.reply(`🔌 Available Allocations:\n${allocList}\nReply with the Allocation ID you want.`);
      const allocMsg = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max: 1,
        time: 30000,
      });
      const allocationId = parseInt(allocMsg.first()?.content || "0");

      // Step 5: Create server
      const response = await axios.post(
        `${host}/api/application/servers`,
        {
          name: serverName,
          user: userId,
          egg: eggId,
          docker_image: "ghcr.io/pterodactyl/yolks:java_17",
          startup: "java -Xms128M -Xmx128M -jar server.jar",
          limits: { memory: 1024, swap: 0, disk: 2048, io: 500, cpu: 100 },
          feature_limits: { databases: 1, allocations: 1 },
          allocation: { default: allocationId },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      message.reply(`✅ Server created successfully! ID: ${response.data.attributes.id}`);
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      message.reply("❌ Failed to create server. Check console for details.");
    }
  },
};
