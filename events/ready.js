const { Events } = require("discord.js")
const { updateAssignableRoleCache } = require("../utils")

/**
 * @typedef {import("discord.js").Client} Client
 */

const name = Events.ClientReady
const once = true

/**
 * The function to execute when the 'ClientReady' event is emitted.
 * @function execute
 * @param {Client} client - The client that emitted the event.
 * @returns {Promise<void>}
 */
const execute = (client) => {
  console.log(`Ready! Logged in as ${client.user.tag}`)
  return updateAssignableRoleCache(client)
}

module.exports = {
  name,
  once,
  execute
}
