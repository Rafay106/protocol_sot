const EventEmitter = require("node:events");
const { Log, formatDateTime } = require("../util/utilities");
const { default: axios } = require("axios");

class BaseAdapter extends EventEmitter {
  socket;
  port;
  devices = {};
  payloads = [];
  replies = [];

  constructor(name, port, socket) {
    super();
    this.name = name;
    this.port = port;
    this.socket = socket;

    this.on(`${this.name}.reply`, (reply) => {
      if (!(reply instanceof Buffer)) reply = Buffer.from(reply);

      console.log("Reply Send:", reply);
      // console.log(`Reply Send Hex: ${reply.toString("hex")}`);
      this.socket.write(reply);
    });

    this.on(`${this.name}.send`, (data) => {
      return this.sendToListener([
        {
          op: "loc",
          imei: Number(data.imei).toString(),
          dt_tracker: formatDateTime(data.dt),
          lat: data.lat,
          lng: data.lon,
          altitude: null,
          speed: data.speed,
          angle: data.course,
          protocol: this.name,
          net_protocol: "tcp",
          params: JSON.stringify(data.params),
          loc_valid: data.loc_valid,
          event: null,
          ip: "",
          port: this.port,
        },
      ]);
    });
  }

  handlePacket(buffer) {
    console.log("Implement this function for each adaptor");
  }

  login(buffer) {
    console.log("Implement this function for each adaptor");
  }

  parse(buffer) {
    console.log("Implement this function for each adaptor");
  }

  getDefaultPayload(packet, device) {
    console.log("Implement this function for each adaptor");
  }

  findDevice(imei) {
    const device = this.devices[imei];
    if (!device) return false;
    else return device;
  }

  addDevice(device) {
    this.devices[device.imei] = device;
    return true;
  }

  log(data) {
    if (data instanceof Object) data = JSON.stringify(data);

    Log(this.name, data);
  }

  sendToListener(data) {
    Log("listener", JSON.stringify(data));

    const promise = new Promise((resolve, reject) => {
      axios
        .post("https://speedotrack.in/server/http/listener.php", data)
        .then((resp) => {
          resolve(resp.status);
        })
        .catch((err) => {
          if (err.response) {
            console.log(err.response.data);
            console.log(err.response.status);
            console.log(err.response.headers);
            reject(err.response.status);
          } else if (err.request) {
            console.log(err.request);
          } else {
            console.log("Error", err.message);
          }
          console.log(err.config);

          reject(500);
        });
    });

    return promise;
  }
}

module.exports = BaseAdapter;
