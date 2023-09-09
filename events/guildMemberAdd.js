const { Events, GuildMember } = require("discord.js")
const { sendMessage } = require("../utils")
const dotenv = require("dotenv")

dotenv.config()

const name = Events.GuildMemberAdd

/**
 * The function to execute when the 'GuildMemberAdd' event is emitted.
 * @async
 * @function execute
 * @param {GuildMember} member - The member that has just joined the guild.
 */
const execute = async (member) => {
  const welcomeMsgStr = `Welcome, ${member}! Please read the rules, then assign your course roles in <#${process.env.ROLES_CHANNEL_ID}> to gain access to course channels.`
  const message = await sendMessage(member.guild, process.env.WELCOME_CHANNEL_ID, welcomeMsgStr)
  if (!message) return
  await message.react("👋").catch(console.error)
}

module.exports = {
  name,
  execute
}