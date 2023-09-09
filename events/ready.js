const { Events } = require("discord.js")

const name = Events.ClientReady
const once = true

/**
 * The function to execute when the 'ClientReady' event is emitted.
 * @function execute
 * @param {import("discord.js").Client} client - The client that emitted the event.
 */
const execute = (client) => {
  console.log(`Ready! Logged in as ${client.user.tag}`)
}

module.exports = {
  name,
  once,
  execute
}
