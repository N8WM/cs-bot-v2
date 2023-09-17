const { COURSE_ASGN_ROLES_REGEXP } = require("./constants")
const fs = require("node:fs")

/**
 * @typedef {import("discord.js").Role} Role
 */

/**
 * Checks if a given role is a course role.
 * @function isCourseRole
 * @param {Role|string} role - The role to check.
 * @returns {boolean} - True if the role is a course role, false otherwise.
 */
const isCourseRole = (role) => {
  const courseRoleRegex = new RegExp(COURSE_ASGN_ROLES_REGEXP)
  return courseRoleRegex.test((typeof role === "string") ? role : role.name)
}

/**
 * Checks if a given role is a misc role.
 * @function isMiscRole
 * @param {Role} role - The role to check.
 * @returns {boolean} - True if the role is a misc role, false otherwise.
 */
const isMiscRole = (role) => {
  const miscRoleRegex = new RegExp(global.guildsGlobals.get(role.guild.id).config.moreAssignables ?? "a^")
  return miscRoleRegex.test((typeof role === "string") ? role : role.name)
}

/**
 * Checks if a given item is a directory.
 * @function isDir
 * @param {string} item - The item to check.
 * @returns {boolean} - True if the item is a directory, false otherwise.
 */
const isDir = (item) => fs.lstatSync(item).isDirectory()

/**
 * Checks if a given item is a JavaScript file.
 * @function isJsFile
 * @param {string} item - The item to check.
 * @returns {boolean} - True if the item is a JavaScript file, false otherwise.
 */
const isJsFile = (item) => item.endsWith(".js")

module.exports = {
  isCourseRole,
  isMiscRole,
  isDir,
  isJsFile
}
