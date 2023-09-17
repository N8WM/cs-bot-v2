const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require("discord.js")
const { defaultConfig, getGuildGlobals, setGuildGlobal } = require("./globals")
const { CONFIG_EMBED_TITLE, CONFIG_CHANNEL_NAME } = require("./constants")

/**
 * @typedef { import("discord.js").Guild } Guild
 * @typedef { import("discord.js").GuildMember } GuildMember
 * @typedef { import("discord.js").TextChannel } TextChannel
 * @typedef { import("discord.js").Message } Message
 * @typedef { import("./globals.js").Config } Config
 */

/**
 * Generates an embed with the current server configuration
 * @function generateConfigEmbed
 * @param {Guild} guild
 * @param {GuildMember?} user
 * @returns {EmbedBuilder}
 */
const generateConfigEmbed = (guild, user = null) => {
  const guildConfig = getGuildGlobals(guild).config
  const embed = new EmbedBuilder()
    .setTitle(CONFIG_EMBED_TITLE)
    .setDescription(`Configuration for ${guild.name}`)
    .setThumbnail(guild.members.me.displayAvatarURL())
    .setColor("#0099FF")
    .addFields(
      ...Object.keys(guildConfig)
        .filter(key => !!guildConfig[key])
        .map(key => ({
          name: key,
          value: guildConfig[key] ? `\`${guildConfig[key]}\`` : null
        }))
    )

  if (user) embed
    .setFooter({ text: `${user.displayName}`, iconURL: user.displayAvatarURL() })
    .setTimestamp()

  return embed
}

/**
 * Finds the guild config channel and returns it.
 * @async
 * @function getConfigChannel
 * @param {Guild} guild - The guild to get the config channel for.
 * @returns {Promise<TextChannel|null>} - The config channel, or null if it does not exist.
 */
const getConfigChannel = async (guild) => {
  const channels = await guild.channels.fetch().catch(console.error)
  if (!channels) {
    console.error("Failed to load channels.")
    return null
  }

  const configChannel = channels.find(c =>
    (c.type === ChannelType.GuildText)
    && (c.name.toLowerCase() === CONFIG_CHANNEL_NAME)
  )

  if (!configChannel || configChannel.type !== ChannelType.GuildText) {
    console.error(`Failed to find config channel ${CONFIG_CHANNEL_NAME} in guild ${guild.name}.`)
    return null
  }

  return configChannel
}

/**
 * Finds the guild config embed message and returns it.
 * @async
 * @function getConfigMessage
 * @param {Guild} guild - The guild to get the config embed for.
 * @returns {Promise<Message|null>} - The config embed message, or null if it does not exist.
 */
const getConfigMessage = async (guild) => {
  const configChannel = await getConfigChannel(guild)
  if (!configChannel) return null

  const messages = await configChannel.messages.fetch().catch(console.error)
  if (!messages) {
    console.error("Failed to load messages.")
    return null
  }

  const configMessage = messages.find(m =>
    m.author.id === guild.client.user.id
    && m.embeds.length > 0
    && m.embeds[0].title === CONFIG_EMBED_TITLE
  )

  if (!configMessage) {
    console.error(`Failed to find config message in guild ${guild.name}.`)
    return null
  }

  return configMessage
}

/**
 * Parses the guild config and sets the global config variables for the guild.
 * @async
 * @function parseGuildConfig
 * @param {Guild} guild - The guild to parse the config for.
 * @returns {Promise<void>}
 */
const parseGuildConfig = async (guild) => {
  const configMessage = await getConfigMessage(guild)
  if (!configMessage) return

  const configEmbed = configMessage.embeds[0]
  const defaultConfigCopy = { ...defaultConfig }
  try {
    configEmbed.fields.forEach(field => {
      defaultConfigCopy[field.name] = field.value ? field.value.substring(1, field.value.length - 1) : null
    })
    setGuildGlobal(guild, "config", defaultConfigCopy)
  } catch (error) {
    console.error(`Failed to parse config message in guild ${guild.name}: ${error.message}`)
  }
}

/**
 * Updates the guild config embed.
 * @async
 * @function updateConfigEmbed
 * @param {Guild} guild - The guild to update the config embed for.
 * @param {GuildMember?} user - The user who updated the config.
 * @returns {Promise<Message>}
 */
const updateConfigEmbed = async (guild, user = null) => {
  const configMessage = await getConfigMessage(guild)
  if (!configMessage) return

  const newEmbed = generateConfigEmbed(guild, user)
  const edit = await configMessage.edit({ embeds: [newEmbed] }).catch(console.error)
  if (!edit) {
    console.error(`Failed to edit config message in guild ${guild.name}.`)
    return
  }

  return edit
}

/**
 * Creates the config channel for a guild and sends the config embed.
 * @async
 * @function setUpConfigChannel
 * @param {Guild} guild - The guild to set up the config channel for.
 * @returns {Promise<boolean>} - True if the config was just set up, false if it already existed.
 */
const setUpConfigChannel = async (guild) => {
  let alreadySetUp = false
  /** @type {TextChannel|void} */
  let configChannel = await getConfigChannel(guild)
  if (!configChannel) {
    configChannel = await guild.channels.create({
      name: CONFIG_CHANNEL_NAME,
      type: ChannelType.GuildText,
      topic: "This channel is used to configure the bot.",
    }).catch(console.error)
  }
  if (!configChannel) {
    console.error(`Failed to create config channel for ${guild.name}`)
    return
  }

  const configChannelEveryonePerm = await configChannel.permissionOverwrites.create(
    guild.roles.everyone,
    { ViewChannel: false }
  ).catch(console.error)

  if (!configChannelEveryonePerm) {
    console.error(`Failed to set config channel permissions for ${guild.name}`)
    return
  }

  const roles = await guild.roles.fetch().catch(console.error)
  if (!roles) {
    console.error(`Failed to load roles for ${guild.name}`)
    return
  }

  const allowedRoles = roles.filter(r =>
    ((r.permissions.bitfield & PermissionFlagsBits.ManageChannels)
      && (r.permissions.bitfield & PermissionFlagsBits.ManageRoles))
    || (r.permissions.bitfield & PermissionFlagsBits.ManageGuild)
  )

  allowedRoles.forEach(async role => {
    const configChannelRolePerm = configChannel ? await configChannel.permissionOverwrites.create(
      role,
      { ViewChannel: true }
    ).catch(console.error) : null

    if (!configChannelRolePerm) {
      console.error(`Failed to set config channel permissions for role ${role.name} in ${guild.name}`)
      return
    }
  })

  /** @type {Message|void} */
  let configMessage = await getConfigMessage(guild)
  if (!configMessage) {
    const embed = generateConfigEmbed(guild)
    if (!embed) {
      console.error(`Failed to generate config embed for ${guild.name}`)
      return
    }
    configMessage = await configChannel.send({ embeds: [embed] }).catch(console.error)
    alreadySetUp = false
  } else {
    alreadySetUp = true
  }

  if (!configMessage) {
    console.error(`Failed to send config message for ${guild.name}`)
    return
  }

  return !alreadySetUp
}

module.exports = {
  generateConfigEmbed,
  getConfigChannel,
  getConfigMessage,
  parseGuildConfig,
  updateConfigEmbed,
  setUpConfigChannel
}
