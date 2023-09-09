const { Client, Collection, GatewayIntentBits } = require("discord.js")
const { itemHandler } = require("./utils")
const dotenv = require("dotenv")

dotenv.config()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
    // GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.GuildMessageReactions,
    // GatewayIntentBits.GuildMessageTyping,
    // GatewayIntentBits.GuildPresences,
    // GatewayIntentBits.GuildEmojisAndStickers
  ]
})


global.commands = new Collection()

// Load all commands
itemHandler("commands", (filePath) => {
  const command = require(filePath)
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    global.commands.set(command.data.name, command)
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    )
  }
})

// Load all events
itemHandler("events", (filePath) => {
  const event = require(filePath)
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args))
  } else {
    client.on(event.name, (...args) => event.execute(...args))
  }
})

client.login(process.env.BOT_TOKEN)
