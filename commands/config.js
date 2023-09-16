const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js")
const { getGuildGlobals, setGuildGlobal, generateConfigEmbed } = require("../utils")
const dotenv = require("dotenv")

dotenv.config()

/**
 * @typedef {import("discord.js").ChatInputCommandInteraction} CommandInteraction
 * @typedef {import("discord.js").Guild} Guild
 * @typedef {import("discord.js").GuildMember} GuildMember
 */

const unconfigured = "unconfigured"

const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure the bot for the server")
  .addSubcommand(subcommand =>
    subcommand.setName("welcome-channel")
      .setDescription("Set the welcome channel for the server")
      .addChannelOption(option =>
        option.setName("channel")
          .setDescription("The channel to set as the welcome channel")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("welcome-message")
      .setDescription("Set the welcome message for the server")
      .addStringOption(option =>
        option.setName("message")
          .setDescription("The message to set as the welcome message")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("goodbye-message")
      .setDescription("Set the goodbye message for the server")
      .addStringOption(option =>
        option.setName("message")
          .setDescription("The message to set as the goodbye message")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("more-assignables")
      .setDescription("Set the regex string matching additional assignable roles on the server (not including course roles)")
      .addStringOption(option =>
        option.setName("regex")
          .setDescription("The regex string for the additional assignable roles")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("base-role-pos")
      .setDescription("Set the base position of newly created assignable roles")
      .addIntegerOption(option =>
        option.setName("position")
          .setDescription("The value of the base position for newly created assignable roles")
          .setMinValue(1)
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("show")
      .setDescription("Show the current server configuration")
  )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageRoles
  )
  .setDMPermission(false)

/**
 * Set the welcome channel for the server
 * @async
 * @function setWelcomeChannel
 * @param {CommandInteraction} interaction 
 * @returns {Promise<void>}
 */
const setWelcomeChannel = async (interaction) => {
  await interaction.reply({
    content: "This command is not yet implemented.",
    ephemeral: true
  }).catch(console.error)
}

/**
 * Set the welcome message for the server
 * @async
 * @function setWelcomeMessage
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const setWelcomeMessage = async (interaction) => {
  await interaction.reply({
    content: "This command is not yet implemented.",
    ephemeral: true
  }).catch(console.error)
}

/**
 * Set the goodbye message for the server
 * @async
 * @function setGoodbyeMessage
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const setGoodbyeMessage = async (interaction) => {
  await interaction.reply({
    content: "This command is not yet implemented.",
    ephemeral: true
  }).catch(console.error)
}

/**
 * Set the regex string matching additional assignable roles
 * on the server (not including course roles)
 * @async
 * @function setMoreAssignables
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const setMoreAssignables = async (interaction) => {
  await interaction.reply({
    content: "This command is not yet implemented.",
    ephemeral: true
  }).catch(console.error)
}

/**
 * Set the base position of newly created assignable roles
 * @async
 * @function setBaseRolePos
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const setBaseRolePos = async (interaction) => {
  await interaction.reply({
    content: "This command is not yet implemented.",
    ephemeral: true
  }).catch(console.error)
}

/**
 * Show the current server configuration
 * @async
 * @function showEmbed
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const showEmbed = async (interaction) => {
  const embed = generateConfigEmbed(interaction.guild)
  await interaction.reply({
    embeds: [embed]
  }).catch(console.error)
}

/**
 * Make changes to the guild config
 * @async
 * @function execute
 * @param {CommandInteraction} interaction 
 * @returns {Promise<void>}
 */
const execute = async (interaction) => {
  const subcommand = interaction.options.getSubcommand()

  switch (subcommand) {
    case "welcome-channel":
      await setWelcomeChannel(interaction)
      break
    case "welcome-message":
      await setWelcomeMessage(interaction)
      break
    case "goodbye-message":
      await setGoodbyeMessage(interaction)
      break
    case "more-assignables":
      await setMoreAssignables(interaction)
      break
    case "base-role-pos":
      await setBaseRolePos(interaction)
      break
    case "show":
      await showEmbed(interaction)
    default:
      await interaction.reply({
        content: "Invalid subcommand.",
        ephemeral: true
      }).catch(console.error)
    }
}

module.exports = {
  data,
  execute
}