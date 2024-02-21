const { bufferToASCII } = require("../../util/utilities");
const BaseAdapter = require("../BaseAdapter");

class Adapter extends BaseAdapter {
  constructor(name, port, socket) {
    super(name, port, socket);
  }

  login(buffer) {
    const imei = bufferToASCII(buffer.subarray(2, 17));
    this.emit(`${this.name}.reply`, Buffer.from([0x01]));
    this.log(`${this.name}.parse().imei = ${imei}`);

    return { imei };
  }

  parse(buffer) {
    if (buffer.length == 17 && buffer[0] == 0x00 && buffer[1] == 0x0f) {
    }
  }

  handleAVLPacket(buffer) {
    const dfLen = buffer.subarray(4, 8);
    const cID = buffer[8];
    const numData1 = buffer[9];
    const tstamp = buffer.subarray(10, 18);
    const priority = buffer[18];

    console.log("dfLen :>> ", dfLen);
    console.log("cID :>> ", cID);
    console.log("numData1 :>> ", numData1);
    console.log("tstamp :>> ", tstamp);
    console.log("priority :>> ", priority);

    // GPS Element
    const gpsElement = {
      lon: buffer.subarray(19, 23),
      lat: buffer.subarray(23, 26),
      altitude: buffer.subarray(26, 28),
      angle: buffer.subarray(28, 32),
      satellites: buffer[32],
      speed: buffer.subarray(33, 35),
    };
    // GPS Element

    console.log("gpsElement :>> ", gpsElement);

    // IO Element
    const eventID = buffer.subarray(35, 37);
    const totalIO = buffer.subarray(37, 39);
    // IO Element

    console.log("object :>> ", object);
  }
}

module.exports = Adapter;
