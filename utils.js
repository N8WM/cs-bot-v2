const fs = require("node:fs")
const path = require("node:path")

const isDir = (item) => fs.lstatSync(item).isDirectory()
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
 * @param {import("discord.js").Guild} guild - The guild where the message will be sent.
 * @param {import("discord.js").Snowflake} channelId - The ID of the channel where the message will be sent.
 * @param {string} message - The message to be sent.
 * @returns {Promise<import("discord.js").Message|null>} - The message that was sent, or null if the channel does not exist.
 */
const sendMessage = async (guild, channelId, message) => {
  const channel = await guild.channels
    .fetch(channelId)
    .catch(console.error)
  if (!channel) {
    console.error(`The channel with ID ${channelId} does not exist.`)
    return null
  }
  const result = channel.send(message)
  return result
}

module.exports = { itemHandler, sendMessage }
