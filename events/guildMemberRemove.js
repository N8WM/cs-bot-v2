const { Events } = require("discord.js")
const { getGuildGlobals } = require("../utils/globals")
const { sendMessage } = require("../utils/helpers")

/**
 * @typedef {import("discord.js").GuildMember} GuildMember
 */

const name = Events.GuildMemberRemove

/**
 * The function to execute when the 'GuildMemberRemove' event is emitted.
 * @async
 * @function execute
 * @param {GuildMember} member - The member that has just left the guild.
 */
const execute = async (member) => {
  const config = getGuildGlobals(member.guild).config
  const goodbyeMsgStr = config.goodbyeMessage
    .replace(/{user}/g, `**${member.displayName}**`)
    .replace(/{n}/g, "\n")
  const message = await sendMessage(
    member.guild,
    config.welcomeChannelId,
    goodbyeMsgStr
  ).catch(console.error)
  if (!message) return
  await message.react("🫡").catch(console.error)
}

module.exports = {
  name,
  execute
}
