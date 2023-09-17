const { isCourseRole, isMiscRole } = require("./validators")

/**
 * @typedef {import("discord.js").Guild} Guild
 * @typedef {import("discord.js").Client} Client
 * @typedef {{ name: string, value: string, type: "course"|"misc" }} AssignableRole
 * @typedef {{
 *   welcomeChannelId?: string,
 *   welcomeMessage: string,
 *   goodbyeMessage: string,
 *   moreAssignables?: string,
 *   baseRolePos: string
 * }} Config
 * @typedef {{ assignableRoles?: AssignableRole[], config: Config }} GuildGlobals
 * @typedef {import("discord.js").Collection<string, GuildGlobals>} GuildsGlobals
 */

/** @type {Config} */
const defaultConfig = {
  welcomeChannelId: null,
  welcomeMessage: "Welcome to the server, {user}!",
  goodbyeMessage: "Farewell, {user}!",
  moreAssignables: null,
  baseRolePos: "1"
}

/**
 * Gets the global variables for a guild.
 * @function getGuildGlobals
 * @param {Guild} guild - The guild to get the global variables for.
 * @returns {GuildGlobals} - The global variables for the guild.
 */
const getGuildGlobals = (guild) => {
  if (!guild) {
    console.error("No guild provided.")
    return null
  }
  /** @type {GuildsGlobals} */
  const guildsGlobals = global.guildsGlobals
  let guildGlobals = guildsGlobals.get(guild.id)
  if (!guildGlobals) {
    guildsGlobals.set(guild.id, { config: defaultConfig })
    guildGlobals = guildsGlobals.get(guild.id)
  }

  return guildsGlobals.get(guild.id)
}

/**
 * Sets a global variable for a guild.
 * @function setGuildGlobal
 * @param {Guild} guild - The guild to set the global variable for.
 * @param {string} key - The key of the global variable to set.
 * @param {any} value - The value to set the global variable to.
 * @returns {void}
 */
const setGuildGlobal = (guild, key, value) => {
  if (!guild) {
    console.error("No guild provided.")
    return
  }
  /** @type {GuildsGlobals} */
  const guildsGlobals = global.guildsGlobals
  let guildGlobals = guildsGlobals.get(guild.id)

  if (!guildGlobals) {
    guildsGlobals.set(guild.id, { config: defaultConfig })
    guildGlobals = guildsGlobals.get(guild.id)
  }

  guildGlobals[key] = value
}

/**
 * Updates the global assignableRoles array.
 * @function updateAssignableRoleCache
 * @param {Client} client - The client to use to fetch the guilds.
 * @returns {Promise<void>}
 */
const updateAssignableRoleCache = (client) => (
  client.guilds.fetch().then(oa2guilds => {
    oa2guilds.forEach(oa2guild => {
      oa2guild.fetch().then(guild => {
        /** @type {AssignableRole[]} */
        const guildAssignableRoles = []
        guild.roles.fetch().then(roles => {
          roles.forEach(role => {
            if (isCourseRole(role))
              guildAssignableRoles.push({
                name: role.name,
                value: role.id,
                type: "course"
              })
            else if (isMiscRole(role))
              guildAssignableRoles.push({
                name: role.name,
                value: role.id,
                type: "misc"
              })
          })
        }).catch(console.error)
        setGuildGlobal(guild, "assignableRoles", guildAssignableRoles)
      }).catch(console.error)
    })
  }).catch(console.error)
)

module.exports = {
  defaultConfig,
  getGuildGlobals,
  setGuildGlobal,
  updateAssignableRoleCache
}
