const bufferToASCIIString = function (buffer) {
  var str = "";
  for (var i = 0; i < buffer.length; i++) {
    if (buffer[i] < 16) {
      str += "0";
    }
    str += buffer[i].toString(16);
  }
  return hex_to_ascii(str);
};

const hex2bin = function hex2bin(hex) {
  return parseInt(hex, 16).toString(2).padStart(4, "0");
};

const hex_to_ascii = (str1) => {
  var hex = str1.toString();
  var str = "";
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
};

const bufferToHexString = function (buffer) {
  var str = "";
  for (var i = 0; i < buffer.length; i++) {
    if (buffer[i] < 16) {
      str += "0";
    }
    str += buffer[i].toString(16);
  }
  return str;
};

const hex_to_degrees = function (dex) {
  return parseInt(dex, 16) / 1800000;
};

const asciiToHex = (ascii) => {
  return Buffer.from(ascii, "ascii").toString("hex");
};

const hex_to_int = function (hex_char) {
  return parseInt(hex_char, 16);
};

module.exports = {
  bufferToASCIIString,
  hex2bin,
  hex_to_ascii,
  bufferToHexString,
  hex_to_degrees,
  asciiToHex,
  hex_to_int,
};
