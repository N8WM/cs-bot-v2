const { SlashCommandBuilder } = require("discord.js")

/**
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction
 */

const data = new SlashCommandBuilder()
  .setName("server")
  .setDescription("Provides information about the server.")

/**
 * The function to execute when the command is used.
 * @function execute
 * @param {CommandInteraction} interaction - Represents a command interaction.
 * @returns {Promise<void>}
 */
const execute = async (interaction) => {
  await interaction.reply(
    `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`
  ).catch(console.error)
}

module.exports = {
  data,
  execute
}
