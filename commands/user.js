const { SlashCommandBuilder } = require("discord.js")

/**
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction
 */

const data = new SlashCommandBuilder()
  .setName("user")
  .setDescription("Provides information about the user.")

/**
 * The function to execute when the command is used.
 * @function execute
 * @param {CommandInteraction} interaction - Represents a command interaction.
 * @returns {Promise<void>}
 */
const execute = async (interaction) => {
  await interaction.reply(
    `This command was run by ${interaction.user.displayName}.`
  )
}

module.exports = {
  data,
  execute
}
