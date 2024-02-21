const {
  getDateFrom6ByteHex,
  convertToPercentage,
  bufferToString,
  hex2bin,
  sortObject,
} = require("../../util/utilities");
const BaseAdapter = require("../BaseAdapter");
const Device = require("../Device");

/**
 * Example Packet: 3A3A340000086573302404047755030010110419043B20020BAB2C07D48B500B0B00DD0030000000000F1728080A00000001050000026428020500000000000502000023233
 */

class Adapter extends BaseAdapter {
  constructor(name, port, socket) {
    super(name, port, socket);
  }

  handlePacket(buffer) {
    if (buffer.length < 44) {
      this.log(`Unkknow Packet: ${buffer.toString("hex")}`);

      return false;
    }

    try {
      const packet = this.parse(buffer);

      if (!packet) throw new Error(`${this.name}.parse() failed!!`);
      if (!packet.imei) throw new Error(`${this.name}.parse().imei not found!`);

      const device = this.socket.devices[packet.imei];

      if (device !== undefined) {
        device.setLocationData(packet);
      } else {
        if (packet) {
          const device = new Device(
            "loc",
            packet.imei,
            packet.dt,
            packet.lat,
            packet.lon,
            packet.altitude,
            packet.speed,
            packet.course,
            this.name,
            "tcp",
            packet.params,
            packet.loc_valid,
            packet.event,
            "",
            this.port
          );

          this.socket.devices[packet.imei] = device;

          this.emit(`${this.name}.send`, packet);
        }
      }

      this.log("parsed", JSON.stringify(packet));
    } catch (err) {
      console.log(err);
    }
  }

  login(buffer) {
    return this.parse(buffer);
  }

  parse(buffer) {
    const packet = {
      start: buffer.subarray(0, 2).toString("hex"),
      length: buffer[2],
      imei: bufferToString(buffer.subarray(5, 13)),
      ISN: buffer.readInt16BE(13),
      protNum: buffer[15],
      dt: getDateFrom6ByteHex(buffer.subarray(16, 22)),
      lat: parseFloat((buffer.readInt32BE(22) / 1800000).toFixed(6)),
      lon: parseFloat((buffer.readInt32BE(26) / 1800000).toFixed(6)),
      speed: buffer[30],
      course: buffer.readInt16BE(31),
    };

    packet.params = this.getParams(buffer.subarray(36, 40));
    packet.loc_valid = packet.params.gpsfixed;
    delete packet.params.gpsfixed;
    packet.params["lac"] = buffer.readInt16BE(3);
    packet.params["mnc"] = buffer[33];
    packet.params["cellid"] = buffer.readInt16BE(34);
    packet.params["gsmlev"] = convertToPercentage(buffer[40], 31);
    packet.params["gpslev"] = convertToPercentage(buffer[42], 12);
    packet.params["ibattv"] = convertToPercentage(buffer[41], 42);
    packet.params["hdop"] = convertToPercentage(buffer[43], 50);
    packet.params["adc"] = convertToPercentage(buffer.readInt16BE(44), 5000);

    packet.params[`odo${buffer[46]}`] = bufferToString(buffer.subarray(48, 53));
    packet.params[`rfid${buffer[53]}`] = bufferToString(
      buffer.subarray(55, 60)
    );
    packet.params[`adc${buffer[60]}`] = convertToPercentage(
      buffer.readInt16BE(62),
      5000
    );
    packet.stop = buffer.subarray(64, 66).toString("hex");

    sortObject(packet.params);

    for (const key of Object.keys(packet.params)) {
      const val = packet.params[key];
      if (!(val instanceof String)) packet.params[key] = String(val);
    }

    console.log(packet.params);

    return packet;
  }

  getParams(chunk) {
    const params = {};
    let bits = hex2bin(chunk, chunk.length * 8);

    for (let i = 0; i < 32; i++) {
      const num = 31 - i;
      const bit = bits[num];

      if (i === 0) {
        params["gpsfixed"] = bit;
      } else if (i === 3) {
        params["acc"] = bit;
      } else if (i === 4) {
        params["bats"] = bit;
      } else if (i === 5) {
        params["ac"] = bit;
      } else if (i === 6) {
        params["dout1"] = bit;
      } else if (i === 7) {
        params["dout2"] = bit;
      } else if (i === 29) {
        params["nralert"] = bit;
      } else if (i === 31) {
        params["livepos"] = String(1 - bit); // flipping bit to make livpos true when bit = 1
      }
    }

    const byte2 = chunk[2];
    const alerts = this.getAlerts(chunk[2]);

    return params;
  }

  getAlerts(byte2) {
    const alters = {};

    if (byte2 == 10) {
      alters[""];
    }
  }
}

module.exports = Adapter;
