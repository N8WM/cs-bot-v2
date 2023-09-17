const { REST, Routes } = require("discord.js")
const { itemHandler } = require("./utils/helpers")
const dotenv = require("dotenv")

dotenv.config()

// Load all the commands
const commands = []
itemHandler("commands", (filePath) => {
  const command = require(filePath)
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON())
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    )
  }
})

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.BOT_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    )

    // Refresh all commands globally
    /** @type { any } */
    const data = await rest.put(
      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),
      { body: commands }
    )

    console.log(
      `Successfully reloaded ${data.length} application (/) commands globally.`
    )
  } catch (error) {
    console.error(error)
  }
})()
