const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType } = require("discord.js")
const { validate_email, generate_code, send_verification_email } = require("../utils/email")

// TODO: Refactor this constant into the configuration
const verified_role_id = "1372704179113693214"

/**
 * @typedef {import("discord.js").BaseInteraction} BaseInteraction
 * @typedef {import("discord.js").ChatInputCommandInteraction} CommandInteraction
 * @typedef {import("discord.js").AutocompleteInteraction} AutocompleteInteraction
 * @typedef {import("discord.js").ButtonInteraction} ButtonInteraction
 * @typedef {import("discord.js").ModalSubmitInteraction} ModalSubmitInteraction
 */

const name = Events.InteractionCreate

/**
 * The function to handle commands.
 * @async
 * @function handleCommand
 * @param {CommandInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const handleCommand = async (interaction) => {
  const command = global.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`)
    console.error(error)
  }
}

/**
 * The function to build the email modal.
 * @function showEmailModal
 * @param {ButtonInteraction} interaction - The interaction that was created.
 */
const showEmailModal = async (interaction) => {
  const suffix = process.env.DOMAIN_SUFFIX_VLD || ".edu"

  const modal = new ModalBuilder()
    .setCustomId("emailModal")
    .setTitle("Email")

  const emailInput = new TextInputBuilder()
    .setCustomId("emailInput")
    .setLabel("Enter your Cal Poly email")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("example@calpoly.edu")
    .setMinLength(suffix.length + 1)

  const firstRow = new ActionRowBuilder().addComponents(emailInput)

  // @ts-ignore
  modal.addComponents(firstRow)

  await interaction.showModal(modal)
}

/**
 * The function to build the code modal.
 * @function showCodeModal
 * @param {ButtonInteraction} interaction - The interaction that was created.
 */
const showCodeModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId("codeModal")
    .setTitle("Verification Code")

  const codeInput = new TextInputBuilder()
    .setCustomId("codeInput")
    .setLabel("Enter the 6-digit code sent to your email")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("XXXXXX")
    .setMinLength(6)
    .setMaxLength(6)

  const firstRow = new ActionRowBuilder().addComponents(codeInput)

  // @ts-ignore
  modal.addComponents(firstRow)

  await interaction.showModal(modal)
}

/**
* The function to handle verification button interactions.
* @async
* @function handleVerificationButton
* @param {ButtonInteraction} interaction - The interaction that was created.
* @returns {Promise<void>}
*/
const handleVerificationButton = async (interaction) => {
  const member = interaction.member
  let has_role = false

  if (Array.isArray(member.roles)) has_role = member.roles.some((id) => id === verified_role_id)
  else has_role = member.roles.cache.has(verified_role_id)

  if (has_role) {
    const unverifyButton = new ButtonBuilder()
      .setCustomId("unverifyButton")
      .setLabel("Remove Verification")
      .setEmoji("🗑️")
      .setStyle(ButtonStyle.Danger)
    const cancelButton = new ButtonBuilder()
      .setCustomId("cancelButton")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary)
    const unverifyRow = new ActionRowBuilder()
      .addComponents(unverifyButton, cancelButton)

    const response = await interaction.reply({
      content: "You are already verified. Remove verification status?",
      // @ts-ignore
      components: [unverifyRow],
      ephemeral: true,
      withResponse: true
    })

    if (!response) return

    const confirmation = await response.resource.message.awaitMessageComponent({ time: 60_000 }).catch(
      async () => await interaction.editReply({ content: "Confirmation not received within 1 minute, cancelling", components: [] })
    )

    if (!confirmation || confirmation.type !== InteractionType.MessageComponent) return
    const id = confirmation.customId

    if (id === "unverifyButton") {
      await confirmation.deferUpdate()
      const role = interaction.guild.roles.cache.get(verified_role_id)
      if (role) {
        await confirmation.guild.members.fetch(member.user.id).then(async (m) => await m.roles.remove(role))
        await confirmation.editReply({ content: "You have been unverified", components: [] })
      } else {
        await confirmation.editReply({ content: "Error: Role not found", components: [] })
        console.error("Error: Role not found when removing verification")
      }
    } else if (id === "cancelButton") {
      await confirmation.update({ content: "Cancelled", components: [] })
    }
  }

  else {
    await showEmailModal(interaction)
  }
}
    
/**
 * The function to handle email modal interactions.
 * @async
 * @function handleEmailModal
 * @param {ModalSubmitInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const handleEmailModal = async (interaction) => {
  const email = interaction.fields.getTextInputValue("emailInput")
  const suffix = process.env.DOMAIN_SUFFIX_VLD || ".edu"
  
  if (!validate_email(email)) await interaction.reply({ content: `Invalid email address: Email must end in **${suffix}**`, ephemeral: true })
  else {
    await interaction.deferReply({ ephemeral: true })

    const code = generate_code()
    let emailFailed = false
    send_verification_email(email, interaction.member.user.username, code, (e) => {
      emailFailed = true
      console.log(e)
      interaction.editReply({ content: `Error sending verification code to **${email}**\nTry again later` })
    })

    // TODO: save {user: code} somewhere, make embed & "resend code"/"enter code"/"cancel" buttons on the reply instead of simple message:

    if (emailFailed) return
    await interaction.editReply({ content: `A verification code email has been sent to **${email}**. Press "Enter Code" and copy the code from the email into the popup.\nIf you do not see the email in your inbox, make sure to check your Junk/Spam folder.\n\n[ Enter Code ]  [ Resend Code ] [ Cancel ]`})
  }
}

const handleCodeModal = async (interaction) => {
  // TODO
}

/**
 * The function to handle button interactions.
 * @async
 * @function handleButton
 * @param {ButtonInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const handleButton = async (interaction) => {
  if (interaction.customId === "verifyButton") await handleVerificationButton(interaction).catch(console.error)
}

/**
 * The function to handle modal interactions.
 * @async
 * @function handleModal
 * @param {ModalSubmitInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const handleModal = async (interaction) => {
  if (interaction.customId === "emailModal") await handleEmailModal(interaction).catch(console.error)
  else if (interaction.customId === "codeModal") await handleCodeModal(interaction).catch(console.error)
}

/**
 * The function to handle autocomplete interactions.
 * @async
 * @function handleAutocomplete
 * @param {AutocompleteInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const handleAutocomplete = async (interaction) => {
  const command = global.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.autocomplete(interaction)
  } catch (error) {
    console.error(error)
  }
}

/**
 * The function to execute when the 'InteractionCreate' event is emitted.
 * @async
 * @function execute
 * @param {BaseInteraction} interaction - The interaction that was created.
 */
const execute = async (interaction) => {
  if (interaction.isChatInputCommand()) await handleCommand(interaction).catch(console.error)
  else if (interaction.isAutocomplete()) await handleAutocomplete(interaction).catch(console.error)
  else if (interaction.isButton()) await handleButton(interaction).catch(console.error)
  else if (interaction.isModalSubmit()) await handleModal(interaction).catch(console.error)
}

module.exports = {
  name,
  execute
}
