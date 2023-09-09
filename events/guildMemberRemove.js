const { Events, GuildMember } = require("discord.js")
const { sendMessage } = require("../utils")
const dotenv = require("dotenv")

dotenv.config()

const name = Events.GuildMemberRemove

/**
 * The function to execute when the 'GuildMemberRemove' event is emitted.
 * @async
 * @function execute
 * @param {GuildMember} member - The member that has just left the guild.
 */
const execute = async (member) => {
  const goodbyeMsgStr = `Farewell, ${member}. Best of luck moving forward!`
  const message = await sendMessage(member.guild, process.env.WELCOME_CHANNEL_ID, goodbyeMsgStr)
  if (!message) return
  await message.react("🫡").catch(console.error)
}

module.exports = {
  name,
  execute
}
