const { Events, ChannelType } = require("discord.js")
const { createConfigChannel } = require("../utils")

/**
 * @typedef {import("discord.js").Guild} Guild
 */

const name = Events.GuildCreate

/**
 * The function to execute when the 'GuildCreate' event is emitted.
 * @async
 * @function execute
 * @param {Guild} guild - The guild that was just created.
 * @returns {Promise<void>} - Returns nothing.
 */
const execute = async (guild) => {
  console.log(`Joined guild: ${guild.name}`)
  await createConfigChannel(guild)
}

module.exports = {
  name,
  execute
}