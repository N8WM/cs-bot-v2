const { Events } = require("discord.js")
const { getGuildGlobals } = require("../utils/globals")
const { sendMessage } = require("../utils/helpers")

/**
 * @typedef {import("discord.js").GuildMember} GuildMember
 */

const name = Events.GuildMemberAdd

/**
 * The function to execute when the 'GuildMemberAdd' event is emitted.
 * @async
 * @function execute
 * @param {GuildMember} member - The member that has just joined the guild.
 */
const execute = async (member) => {
  const config = getGuildGlobals(member.guild).config
  const welcomeMsgStr = config.welcomeMessage.replace(/{user}/g, `${member}`)
  const message = await sendMessage(
    member.guild,
    config.welcomeChannelId,
    welcomeMsgStr
  ).catch(console.error)
  if (!message) return
  await message.react("👋").catch(console.error)
}

module.exports = {
  name,
  execute
}
