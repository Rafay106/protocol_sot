const crc16 = require("node-crc-itu");
const { writeLog } = require("../../util/utilities");

class Adapter {
  constructor(port, socket) {
    this.socket = socket;
    this.port = port;
  }

  handleData(chunk) {}

  login(chunk) {
    if (chunk.length !== 22) {
      throw new Error("InvalidChunkSize: concox.login().InvalidChunkSize");
    }

    // Check errors
    const ret = crc16(chunk.subarray(2, 18)); // Fron packet length to Information Serial Number
    const errVal = chunk.subarray(18, 20).toString("hex");

    if (errVal !== ret) {
      throw new Error("ErrorInChunk: concox.login().ErrorInChunk");
    }

    let replyData = Buffer.concat([
      Buffer.from([chunk[0], chunk[1]]), // Start Bit: Default
      Buffer.from([0x05]), // Packet Length: Fixed
      Buffer.from([chunk[3]]), // Protocol Number: From login packet
      Buffer.from([chunk[16], chunk[17]]), // Information Serial Number: From login packet
    ]);

    // Create Error Check
    const replyErrCheck = crc16(replyData.subarray(2, 6));

    replyData = Buffer.concat([
      replyData,
      Buffer.from(replyErrCheck, "hex"),
      Buffer.from([0x0d, 0x0a]),
    ]);

    // const protocolNumber = chunk[3];
    // const terminalID = chunk.subarray(4, 12); // 8 bytes
    // const modelCode = chunk.subarray(12, 14); // 2 bytes
    // const timeZoneLanguageBytes = chunk.readUInt16BE(14); // 2 bytes (big endian)
    // const timeZoneValueExtended = (timeZoneLanguageBytes >> 4) & 0xfff; // Mask to extract bits 15 to 4
    // const lowerHalf = timeZoneLanguageBytes & 0x0f; // Mask to extract bits 4 to 0
    // const isGMT = (lowerHalf & 0x08) === 0; // Check if bit 3 is 0 (GMT) or 1 (Western Time)
    // const lang = lowerHalf & 0x03; // Mask to extract bits 1 and 0
    // const timeZoneValue = timeZoneValueExtended / 100;
    // const timeZoneSign = isGMT ? "+" : "-";
    // const informationSerialNumber = chunk.readUInt16BE(16);
    // const errorCheck = chunk.readUInt16BE(18); // 2 bytes (big endian)

    writeLog("PacketReply", replyData.toString("hex"));
    console.log("replyData :>> ", replyData);

    // Send the reply back to the client
    this.socket.write(replyData);
  }
}

module.exports = Adapter;
