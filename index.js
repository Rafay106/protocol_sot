const net = require("net");
// const request = require("request");

const port = 9250;
const host = "0.0.0.0";

const server = net.createServer(onClientConnection);

function onClientConnection(sock) {
  sock.on("data", function (rdata) {
    let data = String(rdata);

    console.log("rdata :>> ", rdata);
    console.log("data :>> ", data);
  });

  sock.on("close", function () {
    console.log(
      `${sock.remoteAddress}:${sock.remotePort} terminated the connection`
    );
  });

  sock.on("error", function (error) {
    console.error(
      `${sock.remoteAddress}:${sock.remotePort} connection error ${error}`
    );
  });
}

server.listen(port, host, function () {
  console.log(`Server started on port ${port} at ${host}`);
});