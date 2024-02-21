const net = require("net");
const GPS_DEVICES = require("./Devices/config");
const Device = require("./Devices/Device");

const host = "0.0.0.0";

try {
  GPS_DEVICES.forEach((DEVICE) => {
    const name = DEVICE.name;
    const port = DEVICE.port;

    const server = net.createServer((socket) => {
      const adapter = new DEVICE.adapter(name, port, socket);
      socket.devices = {};
      socket.adapter = adapter;

      socket.on("data", function (buffer) {
        adapter.log("buffer", buffer);

        console.log(`${name} :>> `, buffer);
        console.log("length :>> ", buffer.length);

        const packet = adapter.handlePacket(buffer);

        // console.log("socket.devices :>> ", socket.devices);
      });

      socket.on("error", (err) => {
        console.log(err);
      });
    });

    server.listen(port, host, function () {
      console.log(`Device (${name}) listening on port ${port} at ${host}`);
    });
  });
} catch (err) {
  console.log(err);
}
