const { ChannelType } = require("discord.js")
const { isDir, isJsFile, isCourseRole } = require("./validators")
const fs = require("node:fs")
const path = require("node:path")
const chroma = require("chroma-js")

/**
 * @typedef {import("discord.js").Message} Message
 * @typedef {import("discord.js").Guild} Guild
 * @typedef {import("discord.js").GuildBasedChannel} GuildBasedChannel
 * @typedef {import("discord.js").Snowflake} Snowflake
 * @typedef {import("discord.js").ColorResolvable} ColorResolvable
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction
 * @typedef {import("discord.js").Role} Role
 * @typedef {import("discord.js").CategoryChannel} CategoryChannel
 * @typedef {import("discord.js").Collection<string, GuildBasedChannel>} RoleCollection
 */

/**
 * Recursively handles all files and directories in a given directory.
 * @function itemHandler
 * @param {string} dirName - The name of the directory to handle.
 * @param {function} callback - The function to call for each file found.
 * @returns {void}
 */
const itemHandler = (dirName, callback) => {
  // Get the full path to the directory to handle.
  const dirPath = path.join(__dirname, "../", dirName)
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
  if (!channelId) {
    console.error("No channel ID provided.")
    return null
  }
  /** @type {GuildBasedChannel|void} */
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
 * Gets the course items for a given interaction.
 * @async
 * @function getInteractionCourseItems
 * @param {CommandInteraction} interaction - The interaction to get the course items for.
 * @param {Snowflake} roleId - The ID of the role to get the course items for.
 * @returns {Promise<{role: Role, category: CategoryChannel, courseChannels: RoleCollection}>}
 */
const getInteractionCourseItems = async (interaction, roleId) => {
  const role = await interaction.guild.roles
    .fetch(roleId)
    .catch(console.error)

  if (!role) {
    await interaction
      .editReply(`No role matching id \`${roleId}\` was found.`)
      .catch(console.error)
    console.log(`No role matching id ${roleId} was found.`)
    return { role: null, category: null, courseChannels: null }
  }

  if (!isCourseRole(role)) {
    await interaction
      .editReply(`Role \`${role.name}\` is not a course role.`)
      .catch(console.error)
    console.log(`Role ${role.name} is not a course role.`)
    return { role: null, category: null, courseChannels: null }
  }

  const channels = await interaction.guild.channels.fetch().catch(console.error)
  if (!channels) {
    await interaction
      .editReply("Failed to load channels.")
      .catch(console.error)
    console.log(`Failed to load channels.`)
    return { role: null, category: null, courseChannels: null }
  }

  const category = channels.find(c =>
    (c.type === ChannelType.GuildCategory)
    && (c.name.toLowerCase() === role.name.toLowerCase())
  )

  if (!category || category.type !== ChannelType.GuildCategory) {
    await interaction
      .editReply(`Failed to find category ${role.name}.`)
      .catch(console.error)
    console.log(`Failed to find category ${role.name}.`)
    return { role: null, category: null, courseChannels: null }
  }

  const courseChannels = channels.filter(c =>
    c.parentId === category.id
  )

  if (!courseChannels) {
    await interaction
      .editReply(`Failed to find channels for category ${role.name}.`)
      .catch(console.error)
    console.log(`Failed to find channels for category ${role.name}.`)
    return { role: null, category: null, courseChannels: null }
  }

  return { role, category, courseChannels }
}

/**
 * Generates a random color that is not too similar to any of the predefined colors.
 * @function generateRoleColor
 * @async
 * @param {Guild} guild - The guild to generate the color for.
 * @param {number} maxAttempts - The maximum number of attempts to generate a color.
 * @param {number} minDeltaE - The minimum deltaE between the generated color and any of the predefined colors.
 * @returns {Promise<ColorResolvable>}
 */
const generateRoleColor = async (guild, maxAttempts = 25, minDeltaE = 5) => {
  const randomColor = () => chroma.random()
  /**
   * @param {chroma.Color[]} colors 
   * @param {chroma.Color} ctrl 
   * @returns {boolean}
  */
  const isTooSimilar = (colors, ctrl) => colors.some(
    color => chroma.deltaE(ctrl, color) < minDeltaE
  )
  const roles = await guild.roles.fetch().catch(console.error)
  if (!roles) return randomColor().num()
  const predefinedColors = roles
    .filter((r) => !isCourseRole(r))
    .map((r) => chroma(r.color))
  predefinedColors.push(chroma("#000000"))
  predefinedColors.push(chroma("#35393e"))
  predefinedColors.push(chroma("#ffffff"))
  let attempts = 0
  let color = randomColor()
  while (isTooSimilar(predefinedColors, color) && attempts < maxAttempts) {
    color = randomColor()
    attempts++
  }
  if (predefinedColors.some(
    predef => chroma.deltaE(color, predef) < minDeltaE
  )) {
    return "#000000"
  }
  return color.num()
}

/**
 * Sort an array of strings by how they should appear in a search.
 * @param {string} target - The string to search for.
 * @param {string[]} array - The array to sort.
 * @returns {string[]} - The sorted array of indices.
 */
const searchSort = (target, array) => {
  const ranked = array.map(item => {
    const targetLower = target.toLowerCase()
    const itemLower = item.toLowerCase()
    const segs = itemLower.split(/[\s-]/)

    const absStart = itemLower.startsWith(targetLower)
    const segsStart = segs.some(seg => seg.startsWith(targetLower))
    const absContains = itemLower.includes(targetLower)

    return absStart ? 3 : segsStart ? 2 : absContains ? 1 : 0
  })

  const grouped = { 0: [], 1: [], 2: [], 3: [] }
  ranked.forEach((rank, i) => grouped[rank].push(i))
  return [...grouped[3], ...grouped[2], ...grouped[1], ...grouped[0]]
}

module.exports = {
  itemHandler,
  sendMessage,
  getInteractionCourseItems,
  generateRoleColor,
  searchSort,
}
