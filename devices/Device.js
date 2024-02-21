const EventEmitter = require("events").EventEmitter;
const fs = require("fs");

class Device extends EventEmitter {
  constructor(
    op,
    imei,
    dt_tracker,
    lat,
    lng,
    altitude,
    speed,
    angle,
    protocol,
    net_protocol,
    params,
    loc_valid,
    event,
    ip,
    port
  ) {
    super();

    this.op = op;
    this.imei = imei;
    this.dt_tracker = dt_tracker;
    this.lat = lat;
    this.lng = lng;
    this.altitude = altitude;
    this.speed = speed;
    this.angle = angle;
    this.protocol = protocol;
    this.net_protocol = net_protocol;
    this.params = params;
    this.loc_valid = loc_valid;
    this.event = event;
    this.ip = ip;
    this.port = port;
  }

  setLocationData(packet) {
    this.dt_tracker = packet.dt;
    this.lat = packet.lat;
    this.lng = packet.lon;
    this.altitude = packet.altitude;
    this.speed = packet.speed;
    this.angle = packet.course;
    this.params = packet.params;
    this.loc_valid = packet.loc_valid;
    this.event = packet.event;
  }

  getData() {
    return {
      op: this.op,
      imei: this.imei,
      dt_tracker: this.dt_tracker,
      lat: this.lat,
      lng: this.lng,
      altitude: this.altitude,
      speed: this.speed,
      angle: this.angle,
      protocol: this.protocol,
      net_protocol: this.net_protocol,
      params: this.params,
      loc_valid: this.loc_valid,
      event: this.event,
      ip: this.ip,
      port: this.port,
    };
  }

  getImei() {
    return this.imei;
  }
}

module.exports = Device;
