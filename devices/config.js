const GPS_DEVICES = [
  {
    name: "transyncais140",
    port: 9250,
    adapter: require("./TranSync/AIS140"),
  },
  {
    name: "teltonikacodec8",
    port: 9251,
    adapter: require("./Teltonika/Codec8"),
  },
  // {
  //   name: "ConcoxEG",
  //   port: 9252,
  //   adapter: require("./ConcoxEG/EGXX"),
  // },
];

module.exports = GPS_DEVICES;
