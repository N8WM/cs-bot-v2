const { SlashCommandBuilder } = require("discord.js")
const { getGuildGlobals } = require("../utils")

/**
 * @typedef {import("discord.js").CommandInteraction} CommandInteraction
 * @typedef {import("discord.js").AutocompleteInteraction} AutocompleteInteraction
 * @typedef {import("discord.js").GuildManager} GuildManager
 * @typedef {import("discord.js").Collection<string, [{ name: string, value: string }]>} RoleCollection
 */

const data = new SlashCommandBuilder()
    .setName("role")
    .setDescription("Select a role to add or remove.")
    .addStringOption(option =>
        option.setName("role")
            .setDescription("The role to add or remove.")
            .setRequired(true)
            .setAutocomplete(true)
    )

/**
 * The function to autocomplete the role option.
 * @function autocomplete
 * @param {AutocompleteInteraction} interaction - Represents a command interaction.
 * @returns {Promise<void>}
 */
const autocomplete = async (interaction) => {
    const focusedValue = interaction.options.getFocused()
    const guildAssignables = getGuildGlobals(interaction.guild).assignableRoles

    if (!guildAssignables) {
        console.error(`No assignable roles found for ${interaction.guildId}.`)
        interaction.respond([])
        return
    }

    const filtered = guildAssignables.filter(
        role => role.name.toLowerCase().includes(focusedValue.toLowerCase())
    )
    await interaction.respond(filtered)
}

/**
 * The function to execute when the command is used.
 * @function execute
 * @param {CommandInteraction} interaction - Represents a command interaction.
 * @returns {Promise<void>}
 */
const execute = async (interaction) => {
    const role = interaction.options.get("role").value.toString()
    const guild = interaction.guild
    const member = await guild.members.fetch(interaction.user.id).catch(console.error)
    const guildAssignables = getGuildGlobals(interaction.guild).assignableRoles

    if (!guildAssignables) {
        console.error(`No assignable roles found for server ${interaction.guild.name}.`)
        interaction.reply("No assignable roles found for this server.")
        return
    }

    console.log(`Role command used by ${interaction.user.tag} in ${interaction.guild.name} with roleId ${role}.`)

    if (!member) {
        console.error(`No member matching ${interaction.user.id} was found.`)
        interaction.reply("You are not a member of this server.")
        return
    }

    if (!role) {
        console.error(`No role matching id ${role} was found.`)
        interaction.reply(`No role matching id \`${role}\` was found.`)
        return
    }

    const roleToAdd = await guild.roles.fetch(role).catch(console.error)

    if (!roleToAdd) {
        console.error(`No role matching id ${role} was found.`)
        interaction.reply(`No role matching id \`${role}\` was found.`)
        return
    }

    if (guildAssignables.filter(r => r.value === role).length === 0) {
        console.error(`The ${roleToAdd.name} role is not assignable.`)
        interaction.reply(`The \`${roleToAdd.name}\` role is not assignable.`)
        return
    }

    const hasRole = member.roles.cache.has(roleToAdd.id)
    if (hasRole) {
        await member.roles.remove(roleToAdd)
        await interaction.reply(`Removed ${roleToAdd} from ${member}`)
    } else {
        await member.roles.add(roleToAdd)
        await interaction.reply(`Added ${roleToAdd} to ${member}`)
    }
}

module.exports = {
    data,
    autocomplete,
    execute
}
