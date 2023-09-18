const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js")
const { generateConfigEmbed, setUpConfigChannel, updateConfigEmbed } = require("../utils/configuration")
const { getGuildGlobals, updateGuildAssignableRoleCache } = require("../utils/globals")

/**
 * @typedef {import("discord.js").ChatInputCommandInteraction} CommandInteraction
 * @typedef {import("discord.js").Guild} Guild
 * @typedef {import("discord.js").GuildMember} GuildMember
 */

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
          .setDescription("The welcome message; can use the \"{user}\" macro")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("goodbye-message")
      .setDescription("Set the goodbye message for the server")
      .addStringOption(option =>
        option.setName("message")
          .setDescription("The goodbye message; can use the \"{user}\" macro")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("more-assignables")
      .setDescription("Set the regex string matching additional assignable roles")
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
          .setDescription("Value of the base position")
          .setMinValue(1)
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("cache-roles")
      .setDescription("Only use after manually adding/removing assignable roles")
  )
  .addSubcommand(subcommand =>
    subcommand.setName("show")
      .setDescription("Show the current server configuration")
  )
  .addSubcommand(subcommand =>
    subcommand.setName("init")
      .setDescription("Initialize the server configuration")
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
  const channel = interaction.options.getChannel("channel")
  if (channel.type !== ChannelType.GuildText) {
    await interaction.reply({
      content: "Invalid channel type.",
      ephemeral: true
    }).catch(console.error)
    return
  }

  const guildConfig = getGuildGlobals(interaction.guild).config
  guildConfig.welcomeChannelId = channel.id
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(console.error)
  const updated = await updateConfigEmbed(interaction.guild, member ? member : null)
  if (!updated) {
    await interaction.reply({
      content: "Failed to update config embed.",
      ephemeral: true
    }).catch(console.error)
    return
  }

  await interaction.reply({
    content: `Welcome channel set to ${channel}.`,
    ephemeral: true
  }).catch(console.error)

  console.log(`Config welcome-channel command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
}

/**
 * Set the welcome message for the server
 * @async
 * @function setWelcomeMessage
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const setWelcomeMessage = async (interaction) => {
  const message = interaction.options.getString("message")
  const guildConfig = getGuildGlobals(interaction.guild).config
  guildConfig.welcomeMessage = message
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(console.error)
  const updated = await updateConfigEmbed(interaction.guild, member ? member : null)
  if (!updated) {
    await interaction.reply({
      content: "Failed to update config embed.",
      ephemeral: true
    }).catch(console.error)
    return
  }

  await interaction.reply({
    content: `Welcome message set: \`\`\`${message}\`\`\``,
    ephemeral: true
  }).catch(console.error)

  console.log(`Config welcome-message command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
}

/**
 * Set the goodbye message for the server
 * @async
 * @function setGoodbyeMessage
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const setGoodbyeMessage = async (interaction) => {
  const message = interaction.options.getString("message")
  const guildConfig = getGuildGlobals(interaction.guild).config
  guildConfig.goodbyeMessage = message
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(console.error)
  const updated = await updateConfigEmbed(interaction.guild, member ? member : null)
  if (!updated) {
    await interaction.reply({
      content: "Failed to update config embed.",
      ephemeral: true
    }).catch(console.error)
    return
  }

  await interaction.reply({
    content: `Goodbye message set: \`\`\`${message}\`\`\``,
    ephemeral: true
  }).catch(console.error)

  console.log(`Config goodbye-message command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
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
  const regex = interaction.options.getString("regex")
  const guildConfig = getGuildGlobals(interaction.guild).config
  guildConfig.moreAssignables = regex
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(console.error)
  const updated = await updateConfigEmbed(interaction.guild, member ? member : null)
  if (!updated) {
    await interaction.reply({
      content: "Failed to update config embed.",
      ephemeral: true
    }).catch(console.error)
    return
  }

  try {
    new RegExp(regex)
  } catch (error) {
    await interaction.reply({
      content: "Invalid regex.",
      ephemeral: true
    }).catch(console.error)
    return
  }

  await interaction.reply({
    content: `More assignables regex set to \`${regex}\`.`,
    ephemeral: true
  }).catch(console.error)

  await updateGuildAssignableRoleCache(interaction.guild)

  console.log(`Config more-assignables command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
}

/**
 * Set the base position of newly created assignable roles
 * @async
 * @function setBaseRolePos
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const setBaseRolePos = async (interaction) => {
  const position = interaction.options.getInteger("position")
  const guildConfig = getGuildGlobals(interaction.guild).config
  guildConfig.baseRolePos = position.toString()
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(console.error)
  const updated = await updateConfigEmbed(interaction.guild, member ? member : null)
  if (!updated) {
    await interaction.reply({
      content: "Failed to update config embed.",
      ephemeral: true
    }).catch(console.error)
    return
  }

  await interaction.reply({
    content: `Base role position set to ${position}.`,
    ephemeral: true
  }).catch(console.error)

  console.log(`Config base-role-pos command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
}

/**
 * Update the assignable roles cache
 * @async
 * @function cacheRoles
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const cacheRoles = async (interaction) => {
  const deferred = await interaction.deferReply({
    ephemeral: true
  }).catch(console.error)
  if (!deferred) return

  await updateGuildAssignableRoleCache(interaction.guild)

  await interaction.editReply("Assignable roles cache updated.")
    .catch(console.error)

  console.log(`Config cache-roles command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
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
 * Initialize the server configuration
 * @async
 * @function init
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const init = async (interaction) => {
  const deferred = await interaction.deferReply({
    ephemeral: true
  }).catch(console.error)
  if (!deferred) return

  const initialized = await setUpConfigChannel(interaction.guild)
  if (initialized === true) {
    await interaction
      .editReply("Server configuration initialized.")
      .catch(console.error)
  } else if (initialized === false) {
    await interaction
      .editReply("Server configuration already initialized.")
      .catch(console.error)
  } else {
    await interaction
      .editReply("Failed to initialize server configuration.")
      .catch(console.error)
  }

  console.log(`Config init command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
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
    case "cache-roles":
      await cacheRoles(interaction)
      break
    case "show":
      await showEmbed(interaction)
      break
    case "init":
      await init(interaction)
      break
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