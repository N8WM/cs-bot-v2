const { Events } = require("discord.js")

/**
 * @typedef {import("discord.js").Interaction} Interaction
 */

const name = Events.InteractionCreate

/**
 * The function to execute when the 'InteractionCreate' event is emitted.
 * @async
 * @function execute
 * @param {Interaction} interaction - The interaction that was created.
 */
const execute = async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = global.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`)
    console.error(error)
  }
}

module.exports = {
  name,
  execute
}
