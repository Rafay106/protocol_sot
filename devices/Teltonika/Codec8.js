const { bufferToASCII } = require("../../util/utilities");
const BaseAdapter = require("../BaseAdapter");
const Device = require("../Device");

class Adapter extends BaseAdapter {
  constructor(name, port, socket) {
    super(name, port, socket);
  }

  handlePacket(buffer) {
    if (buffer.length == 17 && buffer[0] == 0x00 && buffer[1] == 0x0f) {
      try {
        const { imei } = this.login(buffer);
        let device = this.findDevice(imei);

        if (!device) {
          device = new Device(
            "loc",
            imei,
            this.name,
            "tcp",
            this.socket.remoteAddress
          );

          this.addDevice(device.getDeviceData());
        }
      } catch (err) {
        console.log(err);
      }
    } else if (
      buffer[0] == 0x00 &&
      buffer[1] == 0x00 &&
      buffer[2] == 0x00 &&
      buffer[3] == 0x00
    ) {
      const dataLength = buffer.readInt32BE(4);

      console.log("dataLength :>> ", dataLength);

      // TODO: Check for errors

      this.payloads.push(this.parse(buffer));
    } else {
      this.log(`Unkown Packet (${buffer.length}): ${buffer.toString(hex)}`);
    }
  }

  login(buffer) {
    const imei = bufferToASCII(buffer.subarray(2, 17));
    this.emit(`${this.name}.reply`, Buffer.from([0x01]));
    this.log(`${this.name}.parse().imei = ${imei}`);

    return { imei };
  }

  parse(buffer) {
    const packet = {
      codecId: buffer.subarray(8, 9).toString("hex"),
      numOfData1: buffer[9],
      timestamp: new Date(buffer.readBigInt64BE(10)),
      priority: buffer[18],
      lon: buffer.readInt32BE(19) / 1000000,
      lat: buffer.readInt32BE(23) / 1000000,
      altitude: buffer.readInt16BE(27),
      course: buffer.readInt16BE(29),
      speed: buffer.readInt16BE(32),
    };

    const io = this.parseIOElement(buffer);

    packet.params = { ...io, gpslev: buffer[31] };

    this.log(`Parsed AVL Packet: ${JSON.stringify(packet)}`);

    return packet;
  }

  parseIOElement(buffer) {
    const ioId = buffer.readInt16BE(34);

    const result = { ioId };

    const numOfIO = buffer.readInt16BE(36);

    let pointer = 38;
    let nByteLen = 1;
    for (let i = 0; i < numOfIO; i++) {
      const nByte = buffer.readInt16BE(pointer);
      pointer += 2;
      for (let j = 0; j < nByte; j++) {
        const nIOid = buffer.readInt16BE(pointer);
        pointer += 2;
        const nIOVal = buffer.subarray(pointer, nByteLen);
        result[`io${nIOid}`] = nIOVal.toString("ascii");
        pointer += nByteLen;
      }
      nByteLen *= 2;
    }

    return result;
  }
}

module.exports = Adapter;
