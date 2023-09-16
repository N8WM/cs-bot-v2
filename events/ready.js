const { Events, Collection } = require("discord.js")
const { updateAssignableRoleCache, parseGuildConfig } = require("../utils")

/**
 * @typedef {import("discord.js").Client} Client
 */

const name = Events.ClientReady
const once = true

/**
 * The function to execute when the 'ClientReady' event is emitted.
 * @async
 * @function execute
 * @param {Client} client - The client that emitted the event.
 * @returns {Promise<void>}
 */
const execute = async (client) => {
  console.log(`Ready! Logged in as ${client.user.tag}`)
  global.guildsGlobals = new Collection()
  await updateAssignableRoleCache(client)
  const guilds = await client.guilds.fetch().catch(console.error)
  if (!guilds) {
    console.error("Failed to fetch guilds")
    return
  }
  guilds.forEach(async guild => {
    const fetchedGuild = await guild.fetch().catch(console.error)
    if (!fetchedGuild) {
      console.error(`Failed to fetch guild ${guild.name}`)
      return
    }
    parseGuildConfig(fetchedGuild)
  })
}

module.exports = {
  name,
  once,
  execute
}
