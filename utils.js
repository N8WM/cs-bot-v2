const { Collection } = require("discord.js")
const fs = require("node:fs")
const path = require("node:path")
const dotenv = require("dotenv")

dotenv.config()

/**
 * @typedef {import("discord.js").Channel} Channel
 * @typedef {import("discord.js").Guild} Guild
 * @typedef {import("discord.js").Snowflake} Snowflake
 * @typedef {import("discord.js").Message} Message
 * @typedef {import("discord.js").Client} Client
 * @typedef {{ name: string, value: string }[]} AssignableRoles
 * @typedef {{ assignableRoles?: AssignableRoles }} GuildGlobals
 * @typedef {import("discord.js").Collection<string, GuildGlobals>} GuildsGlobals
 */

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
    guildsGlobals.set(guild.id, {})
    guildGlobals = guildsGlobals.get(guild.id)
  }

  guildGlobals[key] = value
}

/**
 * Checks if a given item is a directory.
 * @function isDir
 * @param {string} item - The item to check.
 * @returns {boolean} - True if the item is a directory, false otherwise.
 */
const isDir = (item) => fs.lstatSync(item).isDirectory()

/**
 * Checks if a given item is a JavaScript file.
 * @function isJsFile
 * @param {string} item - The item to check.
 * @returns {boolean} - True if the item is a JavaScript file, false otherwise.
 */
const isJsFile = (item) => item.endsWith(".js")

/**
 * Recursively handles all files and directories in a given directory.
 * @function itemHandler
 * @param {string} dirName - The name of the directory to handle.
 * @param {function} callback - The function to call for each file found.
 * @returns {void}
 */
const itemHandler = (dirName, callback) => {
  // Get the full path to the directory to handle.
  const dirPath = path.join(__dirname, dirName)
  // Get a list of all items in the dir that are either dirs or js files.
  const items = fs
    .readdirSync(dirPath)
    .filter(
      (item) =>
        isDir(path.join(dirPath, item)) || isJsFile(path.join(dirPath, item))
    )

  // For each item, if it's a dir, recursively call this function, else call the callback.
  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    if (isDir(itemPath)) {
      itemHandler(itemPath, callback)
    } else {
      callback(itemPath)
    }
  }
}

/**
 * Sends a message to a specific channel in a guild.
 * @async
 * @function sendMessage
 * @param {Guild} guild - The guild where the message will be sent.
 * @param {Snowflake} channelId - The ID of the channel where the message will be sent.
 * @param {string} message - The message to be sent.
 * @returns {Promise<Message|null>} - The message that was sent, or null if the channel does not exist.
 */
const sendMessage = async (guild, channelId, message) => {
  /** @type {Channel|void} */
  const channel = await guild.channels
    .fetch(channelId)
    .catch(console.error)
  if (!channel) {
    console.error(`The channel with ID ${channelId} does not exist.`)
    return null
  }
  if (!channel.isTextBased()) {
    console.error(`The channel with ID ${channelId} is not a text channel.`)
    return null
  }
  const result = channel.send(message)
  return result
}

/**
 * Updates the global assignableRoles array.
 * @function updateAssignableRoleCache
 * @param {Client} client - The client to use to fetch the guilds.
 * @returns {Promise<void>}
 */
const updateAssignableRoleCache = (client) =>
  client.guilds.fetch().then(oa2guilds => {
    oa2guilds.forEach(oa2guild => {
      oa2guild.fetch().then(guild => {
        /** @type {AssignableRoles} */
        const guildAssignableRoles = []
        guild.roles.fetch().then(roles => {
          roles.forEach(role => {
            let roleRegexStr = process.env.COURSE_ROLES_REGEXP + "|" + process.env.MISC_ROLES_REGEXP
            let roleRegex = new RegExp(roleRegexStr)
            if (roleRegex.test(role.name)) guildAssignableRoles.push({ name: role.name, value: role.id })
          })
        }).catch(console.error)
        setGuildGlobal(guild, "assignableRoles", guildAssignableRoles)
      }).catch(console.error)
    })
  }).catch(console.error)


module.exports = { getGuildGlobals, itemHandler, sendMessage, updateAssignableRoleCache }
