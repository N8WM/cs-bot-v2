const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js")

/**
 * @typedef {import("discord.js").ChatInputCommandInteraction} CommandInteraction
 */

const data = new SlashCommandBuilder()
  .setName("verification")
  .setDescription("Set up the verification channel")
  .addChannelOption((option) =>
    option.setName("channel")
      .setDescription("Channel for verification button, otherwise uses this one")
      .addChannelTypes(ChannelType.GuildText)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setDMPermission(false)

/**
 * @async
 * @function execute
 * @param {CommandInteraction} interaction - The interaction that was created.
 * @returns {Promise<void>}
 */
const execute = async (interaction) => {
  const channel = interaction.options.getChannel("channel") || interaction.channel

  if (channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: "The channel must be a text channel.", ephemeral: true })
    return
  }

  const embed = new EmbedBuilder()
    .setColor("#20BF55")
    .setTitle("Cal Poly Verification")
    .setThumbnail("https://github.com/N8WM/cs-bot-v2/blob/main/assets/verified.png?raw=true")
    .setDescription(`
Press the button below and enter your Cal Poly email address.
The address will receive a six-digit verification code.
Finally, enter the code here.
`.trim())
    .setFooter({ text: "The email is only used for verification and will not be saved" })

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
      .setCustomId("verifyButton")
      .setLabel("Start Email Verification")
      .setEmoji("📧")
      .setStyle(ButtonStyle.Primary)
    )

  // @ts-ignore
  await channel.send({ embeds: [embed], components: [row] }).catch(console.error)

  await interaction.reply({ content: `Verification successfully set up in ${channel}`, ephemeral: true }).catch(console.error)
}

module.exports = {
  data,
  execute,
}
