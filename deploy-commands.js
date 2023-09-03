const { REST, Routes } = require("discord.js")
const fs = require("node:fs")
const path = require("node:path")
const dotenv = require("dotenv")

dotenv.config()

const commands = []
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"))
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON())
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    )
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.BOT_TOKEN)

// Deploy commands
;(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    )

    // Refresh all commands in the guild with the current set
    const isGlobalDeploy =
      process.argv.length > 2 && ["--global", "-g"].includes(process.argv[2])
    let data = null
    if (isGlobalDeploy) {
      data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands
      })
    } else {
      data = await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      )
    }

    console.log(
      `Successfully reloaded ${data.length} application (/) commands${
        isGlobalDeploy ? " globally" : ""
      }.`
    )
  } catch (error) {
    console.error(error)
  }
})()
