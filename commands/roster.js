const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js")
const { getGuildGlobals, updateGuildAssignableRoleCache } = require("../utils/globals")
const { generateRoleColor, getInteractionCourseItems, searchSort } = require("../utils/helpers")

/**
 * @typedef {import("discord.js").ChatInputCommandInteraction} CommandInteraction
 * @typedef {import("discord.js").AutocompleteInteraction} AutocompleteInteraction
 * @typedef {import("discord.js").Role} Role
 */

const data = new SlashCommandBuilder()
  .setName("roster")
  .setDescription("Add or manage a course on the server roster")
  .addSubcommand(subcommand =>
    subcommand.setName("add")
      .setDescription("Add a course to the server roster")
      .addNumberOption(option =>
        option.setName("number")
          .setDescription("Course number (i.e. \"101\", \"357\", etc.)")
          .setMinValue(100)
          .setMaxValue(999)
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName("instructor")
          .setDescription("Instructor's last name (i.e. \"Smith\")")
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("remove")
      .setDescription("Remove a course from the server roster")
      .addStringOption(option =>
        option.setName("alias")
          .setDescription("Course alias (i.e. \"101 Smith\")")
          .setAutocomplete(true)
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("removeall")
      .setDescription("Remove all courses from the server roster")
  )
  .addSubcommand(subcommand =>
    subcommand.setName("clear")
      .setDescription("Clear a course's message history")
      .addStringOption(option =>
        option.setName("alias")
          .setDescription("Course alias (i.e. \"101 Smith\")")
          .setAutocomplete(true)
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand.setName("clearall")
      .setDescription("Clear all courses' message history")
  )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageRoles
  )
  .setDMPermission(false)

/**
 * Add a course role to server
 * @async
 * @function addRole
 * @param {CommandInteraction} interaction
 * @param {string} alias
 * @returns {Promise<Role>}
 */
const addRole = async (interaction, alias) => {
  const guildGlobals = getGuildGlobals(interaction.guild)
  const alreadyExists = guildGlobals.assignableRoles?.some(
    role => role.name.toLowerCase() === alias.toLowerCase()
  )

  if (alreadyExists) {
    await interaction
      .editReply(`Course ${alias} already exists.`)
      .catch(console.error)
    console.log(`Course ${alias} already exists.`)
    return
  }

  const role = await interaction.guild.roles.create({
    name: alias,
    color: await generateRoleColor(interaction.guild),
    mentionable: true,
    hoist: true,
    position: parseInt(getGuildGlobals(interaction.guild).config.baseRolePos)
  }).catch(console.error)

  if (!role) {
    await interaction
      .editReply(`Failed to create role ${alias}.`)
      .catch(console.error)
    console.log(`Failed to create role ${alias}.`)
    return
  }

  guildGlobals.assignableRoles.push({ name: alias, value: role.id, type: "course" })
  return role
}

/**
 * Add a course category and channels to server
 * @async
 * @function addChannels
 * @param {CommandInteraction} interaction
 * @param {string} alias
 * @param {Role} role
 * @returns {Promise<void>}
 */
const addChannels = async (interaction, alias, role) => {
  // Gather roles allowed to view new channels
  const allRoles = await interaction.guild.roles.fetch().catch(console.error)
  if (!allRoles) {
    await interaction
      .editReply("There appear to be no roles on this server, cancelling operation.")
      .catch(console.error)
    await role.delete().catch(console.error)
    return
  }

  const allowedRoles = allRoles.filter(r =>
    (r.permissions.bitfield & PermissionFlagsBits.ManageChannels)
    || (r.id === role.id)
  )

  if (allowedRoles.size === 0) {
    await interaction
      .editReply("No roles would be permitted to access this course's category, cancelling operation.")
      .catch(console.error)
    console.log(`No roles would be permitted to access this course's category, cancelling operation. ${role.id}`)
    await role.delete().catch(console.error)
    return
  }

  // Create new category
  const newCategory = await interaction.guild.channels.create({
    name: alias,
    type: ChannelType.GuildCategory
  }).catch(console.error)

  if (!newCategory) {
    await interaction
      .editReply(`Failed to create category ${alias}, cancelling operation.`)
      .catch(console.error)
    console.log(`Failed to create category ${alias}, cancelling operation.`)
    await role.delete().catch(console.error)
    return
  }

  // Set permissions for new category
  let newPerm = await newCategory.permissionOverwrites.create(
    interaction.guild.roles.everyone, {
    ViewChannel: false
  }
  ).catch(console.error)

  if (!newPerm) {
    await interaction
      .editReply(`Failed to set permissions for category ${alias}, cancelling operation.`)
      .catch(console.error)
    console.log(`Failed to set permissions for category ${alias}, cancelling operation.`)
    await role.delete().catch(console.error)
    await newCategory.delete().catch(console.error)
    return
  }

  allowedRoles.forEach(async r => {
    newPerm = await newCategory.permissionOverwrites.create(
      r, {
      ViewChannel: true
    }
    ).catch(console.error)

    if (!newPerm) {
      await interaction
        .editReply(`Failed to set permissions for category ${alias}, cancelling operation.`)
        .catch(console.error)
      console.log(`Failed to set permissions for category ${alias}, cancelling operation.`)
      await role.delete().catch(console.error)
      await newCategory.delete().catch(console.error)
      return
    }
  })

  // Create new text and voice channels
  const newTextChannel = await interaction.guild.channels.create({
    name: `general-${parseInt(alias)}`,
    type: ChannelType.GuildText,
    parent: newCategory,
    topic: `General discussion for ${alias}`
  }).catch(console.error)

  if (!newTextChannel) {
    await interaction
      .editReply(`Failed to create text channel ${alias}-general, cancelling operation.`)
      .catch(console.error)
    console.log(`Failed to create text channel ${alias}-general, cancelling operation.`)
    await role.delete().catch(console.error)
    await newCategory.delete().catch(console.error)
    return
  }

  const newVoiceChannel = await interaction.guild.channels.create({
    name: `voice-${parseInt(alias)}`,
    type: ChannelType.GuildVoice,
    parent: newCategory
  }).catch(console.error)

  if (!newVoiceChannel) {
    await interaction
      .editReply(`Failed to create voice channel ${alias}-voice, cancelling operation.`)
      .catch(console.error)
    console.log(`Failed to create voice channel ${alias}-voice, cancelling operation.`)
    await role.delete().catch(console.error)
    await newTextChannel.delete().catch(console.error)
    await newCategory.delete().catch(console.error)
    return
  }
}

/**
 * Add a course to server roster
 * @async
 * @function addCourse
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const addCourse = async (interaction) => {
  const deferred = await interaction.deferReply({
    ephemeral: true
  }).catch(console.error)
  if (!deferred) return

  const number = interaction.options.get("number").value.toString()
  const instructor = interaction.options.get("instructor").value.toString()
  const alias = `${number} ${instructor}`

  const role = await addRole(interaction, alias)
  if (!role) return
  await addChannels(interaction, alias, role)

  await interaction
    .editReply(`Success!`)
    .catch(console.error)

  await interaction.channel
    .send(`Course ${role} added by ${interaction.user}.`)
    .catch(console.error)

  console.log(`Roster add command used by ${interaction.user.tag} in ${interaction.guild.name} with roleId ${role.id}.`)
}

/**
 * Remove a course from server roster
 * @async
 * @function removeCourseWithRoleId
 * @param {CommandInteraction} interaction
 * @param {string} roleId
 * @returns {Promise<boolean>} - Whether the course was successfully removed
 */
const removeCourseWithRoleId = async (interaction, roleId) => {
  const guildGlobals = getGuildGlobals(interaction.guild)

  const { role, category, courseChannels } = await getInteractionCourseItems(interaction, roleId)
  if (!role || !category || !courseChannels) return false

  // Delete role, category, and channels
  /** @type {string[]} */
  const failures = []
  const deletedRole = await role.delete().catch(console.error)
  if (!deletedRole) failures.push(`**ERROR** Failed to delete role ${role}. Please try again later or delete it manually.`)
  const deletedCategory = await category.delete().catch(console.error)
  if (!deletedCategory) failures.push(`**ERROR** Failed to delete category ${category.name}. Please delete it manually.`)
  courseChannels.forEach(async c => {
    const deletedChannel = await c.delete().catch(console.error)
    if (!deletedChannel) failures.push(`**ERROR** Failed to delete channel ${c.name}. Please delete it manually.`)
  })

  // Remove role from assignableRoles
  const index = guildGlobals.assignableRoles.findIndex(
    r => r.name.toLowerCase() === role.name.toLowerCase()
  )
  if (index < 0) {
    console.error(`Failed to remove role ${role.name} from assignableRoles. Reloading assignableRoles...`)
    await updateGuildAssignableRoleCache(interaction.guild)
  }
  guildGlobals.assignableRoles.splice(index, 1)

  if (failures.length > 0) {
    const failureMessage = failures.join("\n")
    await interaction
      .editReply(`Removal of ${role.name} incomplete!`)
      .catch(console.error)
    console.log(`Removal of ${role.name} incomplete!`)
    await interaction.channel
      .send(failureMessage)
      .catch(console.error)
    console.log(failureMessage)
    return false
  }

  await interaction
    .editReply(`Success!`)
    .catch(console.error)

  await interaction.channel
    .send(`Course \`${role.name}\` removed by ${interaction.user}.`)
    .catch(console.error)

  console.log(`Roster remove command used by ${interaction.user.tag} in ${interaction.guild.name} with roleId ${role.id}.`)
  return true
}

/**
 * Remove a course from server roster
 * @async
 * @function removeCourse
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const removeCourse = async (interaction) => {
  const deferred = await interaction.deferReply({
    ephemeral: true
  }).catch(console.error)
  if (!deferred) return

  const roleId = interaction.options.get("alias").value.toString()
  await removeCourseWithRoleId(interaction, roleId)
}

/**
 * Remove all courses from server roster
 * @async
 * @function removeAllCourses
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const removeAllCourses = async (interaction) => {
  const deferred = await interaction.deferReply({
    ephemeral: true
  }).catch(console.error)
  if (!deferred) return

  const guildGlobals = getGuildGlobals(interaction.guild)
  const assignableRoles = guildGlobals.assignableRoles

  const courseRoles = [...assignableRoles].filter(r => r.type === "course")

  let complete = true
  courseRoles.forEach(async r => {
    const resp = await removeCourseWithRoleId(interaction, r.value).catch(console.error)
    complete = resp && complete
  })

  if (!complete) {
    await interaction
      .editReply(`Removal of all courses incomplete!`)
      .catch(console.error)
    console.log(`Removal of all courses incomplete!`)
    return
  }

  await interaction
    .editReply(`Success!`)
    .catch(console.error)

  console.log(`Roster removeall command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
}

/**
 * Clear a course's message history
 * @async
 * @function clearCourseWithRoleId
 * @param {CommandInteraction} interaction
 * @param {string} roleId
 * @returns {Promise<boolean>} - Whether the course was successfully cleared
 */
const clearCourseWithRoleId = async (interaction, roleId) => {
  const { role, category, courseChannels } = await getInteractionCourseItems(interaction, roleId)
  if (!role || !category || !courseChannels) return

  // Cache members
  await interaction.guild.members.fetch().catch(console.error)
  // Get members with role (excluding bots)
  const membersWithRole = role.members.filter(m => !m.user.bot)

  // Clear text channel (replace with new channel)
  const oldTextChannel = courseChannels.find(c => c.type === ChannelType.GuildText)
  if (!oldTextChannel || oldTextChannel.type !== ChannelType.GuildText) {
    await interaction
      .editReply(`Failed to find text channel for ${role}.`)
      .catch(console.error)
    console.log(`Failed to find text channel for role with id ${role.id}.`)
    return false
  }

  const newTextChannel = await interaction.guild.channels.create({
    name: oldTextChannel.name,
    type: ChannelType.GuildText,
    parent: category,
    topic: oldTextChannel.topic,
    position: oldTextChannel.position
  }).catch(console.error)

  if (!newTextChannel) {
    await interaction
      .editReply(`Failed to create new text channel for ${role}.`)
      .catch(console.error)
    console.log(`Failed to create new text channel for role with id ${role.id}.`)
    return false
  }

  // Clear voice channel (replace with new channel)
  const oldVoiceChannel = courseChannels.find(c => c.type === ChannelType.GuildVoice)
  if (!oldVoiceChannel || oldVoiceChannel.type !== ChannelType.GuildVoice) {
    await interaction
      .editReply(`Failed to find voice channel for ${role}.`)
      .catch(console.error)
    console.log(`Failed to find voice channel for role with id ${role.id}.`)
    return false
  }

  const newVoiceChannel = await interaction.guild.channels.create({
    name: oldVoiceChannel.name,
    type: ChannelType.GuildVoice,
    parent: category,
    position: oldVoiceChannel.position
  }).catch(console.error)

  if (!newVoiceChannel) {
    await interaction
      .editReply(`Failed to create new voice channel for ${role}.`)
      .catch(console.error)
    console.log(`Failed to create new voice channel for role with id ${role.id}.`)
    return false
  }

  // Delete old channels
  /** @type {string[]} */
  const failures = []

  const deletedTextChannel = await oldTextChannel.delete().catch(console.error)
  if (!deletedTextChannel) failures.push(`**ERROR** Failed to delete old text channel for ${role}. Please delete it manually.`)
  const deletedVoiceChannel = await oldVoiceChannel.delete().catch(console.error)
  if (!deletedVoiceChannel) failures.push(`**ERROR** Failed to delete old voice channel for ${role}. Please delete it manually.`)
  membersWithRole.forEach(async m => {
    const removedMember = await m.roles.remove(role).catch(console.error)
    if (!removedMember) failures.push(`**ERROR** Failed to remove ${m} from ${role}. Please remove them manually.`)
  })

  if (failures.length > 0) {
    const failureMessage = failures.join("\n")
    await interaction
      .editReply(`Clearing of ${role.name} incomplete!`)
      .catch(console.error)
    console.log(`Clearing of ${role.name} incomplete!`)
    await interaction.channel
      .send(failureMessage)
      .catch(console.error)
    console.log(failureMessage)
    return false
  }

  await interaction
    .editReply(`Success!`)
    .catch(console.error)

  await interaction.channel
    .send(`Course ${role} cleared by ${interaction.user}.`)
    .catch(console.error)

  console.log(`Roster clear command used by ${interaction.user.tag} in ${interaction.guild.name} with roleId ${role.id}.`)
  return true
}

/**
 * Clear a course's message history
 * @async
 * @function clearCourse
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const clearCourse = async (interaction) => {
  const deferred = await interaction.deferReply({
    ephemeral: true
  }).catch(console.error)
  if (!deferred) return

  const roleId = interaction.options.get("alias").value.toString()
  await clearCourseWithRoleId(interaction, roleId)
}

/**
 * Clear all courses' message history
 * @async
 * @function clearAllCourses
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const clearAllCourses = async (interaction) => {
  const deferred = await interaction.deferReply({
    ephemeral: true
  }).catch(console.error)
  if (!deferred) return

  const guildGlobals = getGuildGlobals(interaction.guild)
  const assignableRoles = guildGlobals.assignableRoles

  const courseRoles = [...assignableRoles].filter(r => r.type === "course")

  let complete = true
  courseRoles.forEach(async r => {
    const resp = await clearCourseWithRoleId(interaction, r.value).catch(console.error)
    complete = resp && complete
  })

  if (!complete) {
    await interaction
      .editReply(`Clearing of all courses incomplete!`)
      .catch(console.error)
    console.log(`Clearing of all courses incomplete!`)
    return
  }

  await interaction
    .editReply(`Success!`)
    .catch(console.error)

  console.log(`Roster clearall command used by ${interaction.user.tag} in ${interaction.guild.name}.`)
}

/**
 * Make changes to the server roster
 * @async
 * @function execute
 * @param {CommandInteraction} interaction
 * @returns {Promise<void>}
 */
const execute = async (interaction) => {
  const subcommand = interaction.options.getSubcommand()

  switch (subcommand) {
    case "add":
      await addCourse(interaction)
      break
    case "remove":
      await removeCourse(interaction)
      break
    case "removeall":
      await removeAllCourses(interaction)
      break
    case "clear":
      await clearCourse(interaction)
      break
    case "clearall":
      await clearAllCourses(interaction)
      break
    default:
      await interaction.reply({
        content: "Invalid subcommand.",
        ephemeral: true
      }).catch(console.error)
  }
}

/**
 * The function to autocomplete the alias option for the add subcommand.
 * @async
 * @function autocomplete
 * @param {AutocompleteInteraction} interaction - Represents a command interaction.
 * @returns {Promise<void>}
 */
const autocomplete = async (interaction) => {
  const focusedValue = interaction.options.getFocused()
  const guildAssignables = getGuildGlobals(interaction.guild).assignableRoles

  if (!guildAssignables) {
    console.error(`No assignable roles found for ${interaction.guildId}.`)
    interaction.respond([]).catch(console.error)
    return
  }

  const filtered = guildAssignables.filter(
    role => (
      role.type === "course"
      && role.name.toLowerCase().includes(focusedValue.toLowerCase())
    )
  )

  const order = searchSort(focusedValue, filtered.map(role => role.name))
  const sorted = order.map(item => filtered[item]).slice(0, 25)

  await interaction.respond(sorted).catch(console.error)
}

module.exports = {
  data,
  autocomplete,
  execute
}
