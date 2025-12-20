import axios from "axios";
import { Message } from "discord.js";

export default {
  name: "createuser",
  description: "Create a new Pterodactyl user",
  async execute(message: Message, args: string[]) {
    // Restrict to Payouters role only
    const PAYOUTERS_ROLE_ID = "1451581007286370525";
    if (!message.member?.roles.cache.has(PAYOUTERS_ROLE_ID)) {
      return message.reply("❌ You don’t have permission to run this command.");
    }

    // Usage: !createuser <username> <email> <firstName> <lastName>
    if (args.length < 4) {
      return message.reply("Usage: !createuser <username> <email> <firstName> <lastName>");
    }

    const [username, email, firstName, lastName] = args;

    const host = process.env.PTERO_HOST;
    const apiKey = process.env.PTERO_API_KEY;

    if (!host || !apiKey) {
      return message.reply("⚠️ Pterodactyl host or API key not configured.");
    }

    try {
      // Generate random password
      const password = Math.random().toString(36).slice(-10);

      // Create user via Pterodactyl API
      const response = await axios.post(
        `${host}/api/application/users`,
        {
          username,
          email,
          first_name: firstName,
          last_name: lastName,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Confirm in channel
      await message.reply(`✅ User created successfully! ID: ${response.data.attributes.id}`);

      // Send password in DM
      await message.author.send(
        `🔑 User created:\nUsername: ${username}\nEmail: ${email}\nPassword: ${password}`
      );
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      message.reply("❌ Failed to create user. Check console for details.");
    }
  },
};
