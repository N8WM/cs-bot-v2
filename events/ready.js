const { Events, Collection } = require("discord.js")
const { updateAssignableRoleCache } = require("../utils/globals")
const { parseGuildConfig } = require("../utils/configuration")
const cliProgress = require("cli-progress")

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
  console.log(`Logged in as ${client.user.tag}`)
  global.guildsGlobals = new Collection()
  const guilds = await client.guilds.fetch().catch(console.error)
  if (!guilds) {
    console.error("Failed to fetch guilds")
    return
  }
  const progressBar = new cliProgress.SingleBar(
    {
      format: "Loading guilds | [{bar}] {value}/{total}",
      clearOnComplete: true
    },
    cliProgress.Presets.shades_classic
  )
  progressBar.start(guilds.size, 0)
  guilds.forEach(async guild => {
    const fetchedGuild = await guild.fetch().catch(console.error)
    progressBar.increment(0.5)
    if (!fetchedGuild) {
      console.error(`Failed to fetch guild ${guild.name}`)
      return
    }
    await parseGuildConfig(fetchedGuild)
    progressBar.increment(0.5)
  })

  await updateAssignableRoleCache(client)
  progressBar.stop()
  console.log(`Loaded ${guilds.size} guilds\nReady!`)
}

module.exports = {
  name,
  once,
  execute
}
