const otpGenerator = require("otp-generator")
const nodemailer = require("nodemailer")

/**
 * Generates an HTML email body for sending a verification code.
 * @param {string} username - The username of the recipient.
 * @param {string} code - The verification code to include in the email.
 * @return {string} - The generated HTML email body.
**/
const email_body = (username, code) => `
<p>Hi <b style="color: SteelBlue">@${username}</b>,</p>

<p>Thanks for requesting to verify your email on the Cal Poly CS Discord server!<br/>
To complete the process, please enter the code below into the bot's prompt.</p>

<p>Your verification code is<br/><br/>
<span style="font-size: 3rem; font-family: monospace;">${code}</span></p>

<p>This code will expire in 10 minutes.<br/>
If you didn't request this, you can safely ignore this message.</p>

<p>Sincerely,<br/>
CS Bot<br/><br/><br/>
<small>Questions? Contact the server staff or email the server owner at <a href="mailto:${process.env.CONTACT_EMAIL}">${process.env.CONTACT_EMAIL}</a></small></p>
`.trim()

/**
 * Generates a 6-digit OTP code.
 * @returns {string} - The generated OTP code.
*/
const generate_code = () => {
  return otpGenerator.generate(6, { specialChars: false })
}

/**
 * Validates the given email address.
 * @param {string} addr - The email address to validate.
 * @return {boolean} - Returns true if the email address is valid, false otherwise.
*/
const validate_email = (addr) => {
  let suffix = process.env.DOMAIN_SUFFIX_VLD
  if (!suffix || suffix.trim() === "") suffix = ".edu"
  return addr.endsWith(suffix);
}

/**
 * Sends a verification email to the given address with a generated code.
 * @param {string} addr - The email address to send the verification code to.
 * @param {string} username - The username of the recipient.
 * @param {string} code - The verification code to send.
 * @param {(error: Error) => void} error_cb - Callback function to handle errors.
*/
const send_verification_email = (addr, username, code, error_cb) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ADDRESS,
      pass: process.env.APP_PASSWORD
    }
  })

  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: addr,
    subject: "Cal Poly CS Discord Verification Code",
    html: email_body(
      username,
      code
    )
  }

  setImmediate(() => transporter.sendMail(mailOptions, (error, info) => {
    if (error) error_cb(error)
    else console.log(`Email sent: ${info.response}`)
  }))
}

module.exports = {
  generate_code,
  validate_email,
  send_verification_email
}
