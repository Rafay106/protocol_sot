const gps_server_config = [
  {
    port: 9250,
    device_adapter: require("./adapters/concox"),
  },
];

exports.gps_server_config = gps_server_config;
