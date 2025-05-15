const { Events } = require("discord.js")
const { getGuildGlobals } = require("../utils/globals")
const { sendMessage } = require("../utils/helpers")

// TODO: refactor these three constants into the configuration

// Array of role ID's to alert about in alert channel when a user adds or removes one
const alert_when_applied = ["1372419348932591636"]
// Alert channel ID
const alert_channel_id = "774449340030255105"
// Admin ID
const alerted_role_id = "774433650011668500"

/**
 * @typedef {import("discord.js").GuildMember} GuildMember
 */

const name = Events.GuildMemberUpdate

/**
 * The function to execute when the 'GuildMemberUpdate' event is emitted.
 * @async
 * @function execute
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
const execute = async (oldMember, newMember) => {
  const or = oldMember.roles.cache
  const nr = newMember.roles.cache

  if (or.size === nr.size) return

  alert_when_applied.forEach(async (x) => {
    if (nr.has(x) && !or.has(x)) {
      const assigned_role = nr.get(x)
      const alert_role = await newMember.guild.roles.fetch(alerted_role_id).catch(console.error)
      await sendMessage(
        newMember.guild,
        alert_channel_id,
        `**${alert_role} Alert:** ${newMember} has been assigned the role ${assigned_role}\n-# This role is tagged as *AlertWhenApplied*`
      ).catch(console.error)
    }

    if (!nr.has(x) && or.has(x)) {
      const assigned_role = or.get(x)
      const alert_role = await newMember.guild.roles.fetch(alerted_role_id).catch(console.error)
      await sendMessage(
        newMember.guild,
        alert_channel_id,
        `**${alert_role} Alert:** ${newMember} has been removed from the role ${assigned_role}\n-# This role is tagged as *AlertWhenApplied*`
      ).catch(console.error)
    }
  })
}

module.exports = {
  name,
  execute
}
