const { SlashCommandBuilder } = require("discord.js")

/**
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction
 */

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with pong!")

/**
 * The function to execute when the command is used.
 * @function execute
 * @param {CommandInteraction} interaction - Represents a command interaction.
 * @returns {Promise<void>}
 */
const execute = async (interaction) => {
  await interaction.reply("Pong!").catch(console.error)
}

module.exports = {
  data,
  execute
}
