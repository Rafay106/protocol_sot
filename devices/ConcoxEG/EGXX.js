const crc16 = require("node-crc-itu");
const {
  getDateFrom6ByteHex,
  isError,
  bufferToString,
} = require("../../util/utilities");
const BaseAdapter = require("../BaseAdapter");

class Adapter extends BaseAdapter {
  constructor(name, port, socket) {
    super(name, port, socket);
  }

  handlePacket(buffer) {
    
  }

  login(buffer) {
    if (buffer.length !== 22) {
      throw new Error("InvalidChunkSize: concox.login().InvalidChunkSize");
    }

    // Check errors
    if (isError(buffer.subarray(2, 18), buffer.subarray(18, 20))) {
      console.log(
        `Dropping packet error found:\tret = ${ret} and ErrCheck = ${errVal}`
      );
    }

    let replyData = Buffer.concat([
      Buffer.from([buffer[0], buffer[1]]), // Start Bit: Default
      Buffer.from([0x05]), // Packet Length: Fixed
      Buffer.from([buffer[3]]), // Protocol Number: From login packet
      Buffer.from([buffer[16], buffer[17]]), // Information Serial Number: From login packet
    ]);

    // Create Error Check
    const replyErrCheck = crc16(replyData.subarray(2, 6).toString("hex"));

    replyData = Buffer.concat([
      replyData,
      Buffer.from(replyErrCheck, "hex"),
      Buffer.from([0x0d, 0x0a]),
    ]);

    // const protocolNumber = buffer[3];
    // const modelCode = buffer.subarray(12, 14); // 2 bytes
    const timeZoneLanguageBytes = buffer.readUInt16BE(14); // 2 bytes (big endian)
    const timeZoneValueExtended = (timeZoneLanguageBytes >> 4) & 0xfff; // Mask to extract bits 15 to 4
    const lowerHalf = timeZoneLanguageBytes & 0x0f; // Mask to extract bits 4 to 0
    const isGMT = (lowerHalf & 0x08) === 0; // Check if bit 3 is 0 (GMT) or 1 (Western Time)
    const lang = lowerHalf & 0x03; // Mask to extract bits 1 and 0
    const timeZoneValue = timeZoneValueExtended / 100;
    const timeZoneSign = isGMT ? "+" : "-";
    // const informationSerialNumber = buffer.readUInt16BE(16);
    // const errorCheck = buffer.readUInt16BE(18); // 2 bytes (big endian)

    // console.log("timeZoneLanguageBytes :>> ", timeZoneLanguageBytes);
    // console.log("timeZoneValueExtended :>> ", timeZoneValueExtended);
    // console.log("isGMT :>> ", isGMT);
    // console.log("lang :>> ", lang);
    // console.log("timeZoneValue :>> ", timeZoneValue);
    // console.log("timeZoneSign :>> ", timeZoneSign);

    this.log("login-reply", replyData.toString("hex"));

    // Send the reply back to the client
    this.emit(`${this.name}.reply`, replyData);

    const packet = {
      imei: bufferToString(buffer.subarray(4, 12)),
    };

    return packet;
  }

  parse(buffer) {
    if (buffer[0] !== 0x78 || buffer[1] !== 0x78) return;

    const protNum = buffer[3];
    console.log("protNum :>> ", Buffer.from([protNum]));

    // Login Info
    if (protNum == 0x01) return this.login(buffer);
    // Positioning Data (UTC)
    else if (protNum == 0x22) return this.handlePositionData(buffer);
    // Heartbeat Packer
    else if (protNum == 0x13) return this.handleHeartbeatPacket(buffer);
    // EG02\EG03 Heartbeat Packet
    else if (protNum == 0x23) return;
    // Online Command Response of Terminal
    else if (protNum == 0x21 || protNum == 0x15) return;
    // Alarm Data（UTC）
    else if (protNum == 0x26) return;
    // LBS Alarm
    else if (protNum == 0x19) return;
    // Alarm Data(UTC) apply to HVT001
    else if (protNum == 0x27) return;
    // Online Command
    else if (protNum == 0x80) return;
    // Time Check Packet
    else if (protNum == 0x8a) return this.handleTimeCheck(buffer);
    // WIFI Communication Protocol
    else if (protNum == 0x2c) return;
    // Information Transmission Packe
    else if (protNum == 0x94) return;
    // External device transfer Packet(apply X3)
    else if (protNum == 0x9b) return;
    // External module transmission Packet
    else if (protNum == 0x9c) return;
  }

  handlePositionData(buffer) {
    const packetRaw = {
      start: buffer.subarray(0, 2),
      length: buffer[2],
      protNum: buffer[3],
      infoContent: {
        dt: getDateFrom6ByteHex(buffer.subarray(4, 10)),
        qtyGPSSatellites: buffer[10],
        lat: parseFloat((buffer.readInt32BE(11) / 1800000).toFixed(6)),
        lon: parseFloat((buffer.readInt32BE(15) / 1800000).toFixed(6)),
        speed: buffer[19],
        course: buffer.readInt16BE(20),
        MCC: buffer.readInt16BE(22),
        MNC: buffer[24],
        LAC: buffer.readInt16BE(25),
        cellId: buffer.readIntBE(27, 30),
        ACC: buffer[30],
        uploadMode: buffer[31],
        realTimeReUpload: buffer[32],
        mileage: buffer.readFloatBE(33),
      },
      serialNum: buffer.readInt16BE(38),
      errCheck: buffer.subarray(40, 42).toString("hex"),
      stop: buffer.subarray(42, 44),
    };

    this.log("packet-raw", packetRaw);

    const packet = {
      imei: packetRaw.infoContent.imei,
      dt: getDateFrom6ByteHex(buffer.subarray(16, 22)),
      lat: packetRaw.infoContent.lat,
      lon: packetRaw.infoContent.lon,
      speed: packetRaw.infoContent.speed,
      course: packetRaw.infoContent.course,
      params: {},
    };

    packet.params = {
      mcc: packetRaw.infoContent.MCC,
      mnc: packetRaw.infoContent.MNC,
      lac: packetRaw.infoContent.LAC,
      cellid: packetRaw.infoContent.cellId,
      acc: packetRaw.infoContent.ACC,
    };

    return packet;
  }

  handleHeartbeatPacket(buffer) {}

  handleTimeCheck(buffer) {
    const now = new Date();

    const year = now.getUTCFullYear() - 2000;
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const second = now.getUTCSeconds();

    const packet = Buffer.from([year, month, day, hour, minute, second]);

    let response = Buffer.concat([
      Buffer.from([0x78, 0x78, 0x0b, 0x8a]),
      packet,
      Buffer.from([buffer[11], buffer[12]]),
    ]);

    const errCheck = crc16(response.subarray(2, response.length - 1));

    response = Buffer.concat([
      response,
      Buffer.from(errCheck, "hex"),
      Buffer.from([0x0d, 0x0a]),
    ]);

    this.emit(`${this.name}.reply`, response);
  }
}

module.exports = Adapter;
