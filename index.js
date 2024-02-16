const net = require("net");
const GPS_DEVICES = require("./devices/config");
const { writeLog } = require("./util/utilities");

const host = "0.0.0.0";

GPS_DEVICES.forEach((DEVICE) => {
  const port = DEVICE.port;

  const server = net.createServer((socket) => {
    const adapter = new DEVICE.adapter(port, socket);

    socket.on("data", function (data) {
      writeLog("packets", data.toString("hex"));
      console.log("data :>> ", data);

      if (data[2] === 17) adapter.login(data);
      else writeLog("PacketReply", data.toString("ascii"));
    });
  });

  server.listen(port, host, function () {
    console.log(`Server started on port ${port} at ${host}`);
  });
});
