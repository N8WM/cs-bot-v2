const fs = require("node:fs")
const path = require("node:path")

const isDir = (item) => fs.lstatSync(item).isDirectory()
const isJsFile = (item) => item.endsWith(".js")

const itemHandler = (dirName, callback) => {
  const dirPath = path.join(__dirname, dirName)
  const items = fs
    .readdirSync(dirPath)
    .filter(
      (item) =>
        isDir(path.join(dirPath, item)) || isJsFile(path.join(dirPath, item))
    )

  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    if (isDir(itemPath)) {
      itemHandler(itemPath, callback)
    } else {
      callback(itemPath)
    }
  }
}

module.exports = { itemHandler }
