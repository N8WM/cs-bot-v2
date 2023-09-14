const { Events } = require("discord.js")

/**
 * @typedef {import("discord.js").BaseInteraction} BaseInteraction
 * @typedef {import("discord.js").ChatInputCommandInteraction} CommandInteraction
 * @typedef {import("discord.js").AutocompleteInteraction} AutocompleteInteraction
 */

const name = Events.InteractionCreate

/**
 * The function to handle commands.
 * @async
 * @function handleCommand
 * @param {CommandInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const handleCommand = async (interaction) => {
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

/**
 * The function to handle autocomplete interactions.
 * @async
 * @function handleAutocomplete
 * @param {AutocompleteInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const handleAutocomplete = async (interaction) => {
  const command = global.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.autocomplete(interaction)
  } catch (error) {
    console.error(error)
  }
}

/**
 * The function to execute when the 'InteractionCreate' event is emitted.
 * @async
 * @function execute
 * @param {BaseInteraction} interaction - The interaction that was created.
 */
const execute = async (interaction) => {
  if (interaction.isChatInputCommand()) await handleCommand(interaction)
  else if (interaction.isAutocomplete()) await handleAutocomplete(interaction)
}

module.exports = {
  name,
  execute
}
