const { Events, Collection } = require("discord.js")
const { updateGuildAssignableRoleCache } = require("../utils/globals")
const { parseGuildConfig } = require("../utils/configuration")
const cliProgress = require("cli-progress")

/**
 * @typedef {import("discord.js").Client} Client
 * @typedef {import("discord.js").OAuth2Guild} OAuth2Guild
 */

const name = Events.ClientReady
const once = true

/**
 * Load a guild.
 * @async
 * @function loadGuild
 * @param {OAuth2Guild} guild - The guild to load.
 * @param {cliProgress.SingleBar} progressBar - The progress bar to update.
 * @param {boolean} stopProgress - Whether or not to stop the progress bar.
 * @returns {Promise<void>}
 */
const loadGuild = async (guild, progressBar, stopProgress) => {
  const fetchedGuild = await guild.fetch().catch(console.error)
  progressBar.increment(0.333)
  if (!fetchedGuild) {
    console.error(`Failed to fetch guild ${guild.name}`)
    return
  }
  await parseGuildConfig(fetchedGuild)
  progressBar.increment(0.333)
  await updateGuildAssignableRoleCache(fetchedGuild)
  progressBar.increment(0.334)
  if (stopProgress) {
    progressBar.stop()
    console.log("[ Ready ]")
  }
}

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
  let i = 0
  guilds.forEach(guild => {
    if (i === guilds.size - 1)
      loadGuild(guild, progressBar, true)
    else
      loadGuild(guild, progressBar, false)
    i++
  })
}

module.exports = {
  name,
  once,
  execute
}
