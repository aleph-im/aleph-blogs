const secp256k1 = require('secp256k1')
const shajs = require('sha.js')
import {write_varint, write_with_length} from 'nulsworldjs/src/model/data.js'


function get_verification_buffer(message) {
  // Returns a serialized string to verify the message integrity
  return Buffer.from(`${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`)
}

function nuls_magic_hash(message, messagePrefix) {
  messagePrefix = messagePrefix || '\u0018NULS Signed Message:\n'
  if (!Buffer.isBuffer(messagePrefix)) messagePrefix = Buffer.from(messagePrefix)

  //var messageVISize = varuint.encodingLength(message.length)
  var buffer = Buffer.allocUnsafe(messagePrefix.length + 6 + message.length)
  var cursor = messagePrefix.copy(buffer, 0)
  cursor += write_varint(message.length, buffer, cursor)
  cursor += Buffer.from(message).copy(buffer, cursor)
  buffer = buffer.slice(0, cursor)
  console.log(buffer.toString('utf8'))
  return new shajs.sha256().update(buffer).digest()
}

export function nuls_sign(prv_key, message) {
  let digest = nuls_magic_hash(get_verification_buffer(message))

  let pub_key = secp256k1.publicKeyCreate(prv_key)

  let sigObj = secp256k1.sign(digest, prv_key)
  let signed = secp256k1.signatureExport(sigObj.signature)

  let buf = Buffer.alloc(3 + pub_key.length + signed.length)
  let cursor = write_with_length(pub_key, buf, 0)
  cursor += 1 // we let a zero there for alg ECC type
  cursor += write_with_length(signed, buf, cursor)

  message.signature = buf.toString('hex')
  return message
}
