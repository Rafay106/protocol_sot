const net = require("net");
const GPS_DEVICES = require("./config");
const cron = require("node-cron");
const { Log } = require("./util/utilities");

const host = "0.0.0.0";

GPS_DEVICES.forEach((DEVICE) => {
  const name = DEVICE.name;
  const port = DEVICE.port;

  const server = net.createServer((socket) => {
    const adapter = new DEVICE.adapter(name, port, socket);
    socket.adapter = adapter;
    socket.devices = {};

    socket.on("data", function (buffer) {
      adapter.log(buffer.toString("hex"));

      console.log(`${name}: ${buffer.length} :>> `, buffer.toString("hex"));

      adapter.handlePacket(buffer);
    });

    socket.on("error", (err) => {
      console.log(err);
    });

    cron.schedule("* * * * * *", async () => {
      if (adapter.payloads.length == 0) return;

      const payloads = [];
      for (let i = 0; i < 10; i++) {
        const payload = adapter.payloads.shift();
        if (!payload) break;

        payloads.push(payload);
      }

      if (payloads.length === 0) return;

      let res = await adapter.sendToListener(payloads);

      while (res !== 200) {
        res = await adapter.sendToListener(payloads);
        console.log(res);
      }

      console.log("res :>> ", res);

      Log(
        "listener",
        `Response status: ${res} | Data: ${JSON.stringify(payloads)}`
      );
    });
  });

  server.listen(port, host, function () {
    console.log(`Device (${name}) listening on port ${port} at ${host}`);
  });
});
