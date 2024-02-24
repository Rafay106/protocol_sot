const {
  getDateFrom6ByteHex,
  convertToPercentage,
  bufferToString,
  hex2bin,
  formatParams,
  formatDateTime,
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
    // NRM Packet
    if (buffer.length == 70 && buffer[0] == 0x3a && buffer[1] == 0x3a) {
      try {
        const packet = this.parse(buffer);
        this.log(`Parsed: ${JSON.stringify(packet)}`);

        let device = this.findDevice(packet.imei);

        if (!device) {
          device = new Device(
            "loc",
            packet.imei,
            this.name,
            "tcp",
            this.socket.remoteAddress
          );

          this.addDevice(device.getDeviceData());
        }

        const devices = Object.keys(this.devices);

        if (devices.length > 0) {
          const cmd = "VLTSETTT;PASS#0000;IP#65.21.235.246;PORT#9250;";
          const imei = devices[0];
          const protNum = packet.protNum;

          this.sendCommand(cmd, imei, 1, protNum);
        }

        const payload = this.getDefaultPayload(packet, device);

        this.payloads.push(payload);
      } catch (err) {
        console.log(err);
      }
    } else {
      const res = this.handleCommandResponse(buffer);
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

    packet.params = formatParams(packet.params);

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
        params["bats"] = 1 - bit;
      } else if (i === 5) {
        params["ac"] = bit;
      } else if (i === 6) {
        params["dout1"] = bit;
      } else if (i === 7) {
        params["dout2"] = bit;
      } else if (i === 29) {
        params["nralert"] = bit;
      } else if (i === 31) {
        params["livepos"] = 1 - bit; // flipping bit to make livpos true when bit = 1
      }
    }

    const byte2 = chunk[2];
    const alerts = this.getAlerts(chunk[2]);

    return { ...params, ...alerts };
  }

  getAlerts(byte2) {
    const alerts = {};

    if (byte2 == 10) alerts["em-alert"] = 1;
    else alerts["em-alert"] = 0;

    if (byte2 == 16) alerts["em-btn-wirecut"] = 1;
    else alerts["em-btn-wirecut"] = 0;

    if (byte2 == 3) alerts["batt-rm"] = 1;
    else alerts["batt-rm"] = 0;

    if (byte2 == 22) alerts["tilt"] = 1;
    else alerts["tilt"] = 0;

    if (byte2 == 9) alerts["gps-box-open"] = 1;
    else alerts["gps-box-open"] = 0;

    if (byte2 == 17) alerts["ospeed"] = 1;
    else alerts["ospeed"] = 0;

    if (byte2 == 13) alerts["hbrake"] = 1;
    else alerts["hbrake"] = 0;

    if (byte2 == 14) alerts["haccel"] = 1;
    else alerts["haccel"] = 0;

    if (byte2 == 15) alerts["rturn"] = 1;
    else alerts["rturn"] = 0;

    if (byte2 == 23) alerts["impact"] = 1;
    else alerts["impact"] = 0;

    if (byte2 == 12) alerts["ota-param-chng"] = 1;
    else alerts["ota-param-chng"] = 0;

    if (byte2 == 6) alerts["batt-rconn"] = 1;
    else alerts["batt-rconn"] = 0;

    if (byte2 == 4) alerts["ibatt-low"] = 1;
    else alerts["ibatt-low"] = 0;

    if (byte2 == 5) alerts["ibatt-rm"] = 1;
    else alerts["ibatt-rm"] = 0;

    return alerts;
  }

  getDefaultPayload(packet, device) {
    return {
      op: device.op,
      imei: device.imei,
      dt_tracker: formatDateTime(packet.dt),
      lat: packet.lat,
      lng: packet.lon,
      altitude: packet.altitude,
      speed: packet.speed,
      angle: packet.course,
      protocol: device.name,
      net_protocol: device.net_protocol,
      params: JSON.stringify(packet.params),
      loc_valid: packet.loc_valid,
      event: packet.event,
      ip: device.ip,
      port: this.port,
    };
  }

  sendCommand(command, imei, uid, protNum) {
    const cmdHex = Buffer.from(command, "utf8");
    const pktLen = cmdHex.length + 15;
    const cmdReq = Buffer.concat([
      Buffer.from([0x2a, 0x2a]),
      Buffer.from([pktLen]),
      Buffer.from([0x00, 0x00]),
      Buffer.from(imei.padStart(16, "0"), "hex"),
      // Buffer.from(uid.toString(16).padStart(4, "0"), "hex"),
      Buffer.from([0x03, 0x00]),
      Buffer.from([protNum]),
      Buffer.from([cmdHex.length]),
      cmdHex,
      Buffer.from([0x23, 0x23]),
    ]);

    this.log(`CMD REQ: ${cmdReq.toString("hex")} | CMD: ${command}`);

    this.socket.write(cmdReq);
  }

  handleCommandResponse(buffer) {
    console.log("Command response received");
    this.log(`CMD RES: ${buffer.toString("ascii")}`);
  }
}

module.exports = Adapter;
