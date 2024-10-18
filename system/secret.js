const crypto = require('crypto')
const base32 = require('hi-base32')

function generateSecret(length = 20) {
  const randomBuffer = crypto.randomBytes(length)
  const secret = base32.encode(randomBuffer).replace(/=/g, '')
//   console.log(secret)
  return secret
}
// generateSecret()
module.exports = {generateSecret}