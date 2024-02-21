const EventEmitter = require("node:events");
const CONST = require("../util/constants");
const { Log, formatDateTime } = require("../util/utilities");
const { default: axios } = require("axios");

class BaseAdapter extends EventEmitter {
  socket;
  port;
  replies = [];
  payloads = [];

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

      if (this.payloads.length >= 5) {
        const data = [];
        let i = 0;
        while (i++ < 5) {
          data.push(this.payloads.pop());
        }

        this.sendToListener(data);
      } else {
        this.payloads.push({
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
        });
      }
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

  log(data) {
    if (data instanceof String) data = JSON.stringify(data);

    Log(this.name, data);
  }

  sendToListener(data) {
    Log("listener", JSON.stringify(data));

    axios
      .post("https://speedotrack.in/server/http/listener.php", data)
      .then((resp) => {
        console.log("resp :>> ", resp.status);
      })
      .catch((err) => {
        if (err.response) {
          console.log(err.response.data);
          console.log(err.response.status);
          console.log(err.response.headers);
        } else if (err.request) {
          console.log(err.request);
        } else {
          console.log("Error", err.message);
        }
        console.log(err.config);
      });
  }
}

module.exports = BaseAdapter;
