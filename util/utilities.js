const crc16 = require("node-crc-itu");
const fs = require("node:fs");
const path = require("node:path");

const getAppRootDir = (currentDir) => {
  while (!fs.existsSync(path.join(currentDir, "package.json"))) {
    currentDir = path.join(currentDir, "..");
  }
  return currentDir;
};

const Log = async (log, logData) => {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0"); // months from 1-12
  const year = now.getUTCFullYear();

  let logDir = path.join(getAppRootDir(__dirname), "logs", log);

  const logFile = path.join(logDir, `${log}_${year}_${month}.log`);

  let str = `[${new Date().toISOString().replace("T", " ").split(".")[0]}] `;

  str += "=> " + logData + "\n";

  fs.appendFile(logFile, str, "utf-8", (err) => {
    // If err then make directory then try again
    if (err) {
      fs.mkdirSync(logDir, { recursive: true });
      fs.appendFile(logFile, str, "utf-8", (err) => {
        if (err) throw err;
      });
    }
  });
};

const getDateFrom6ByteHex = (chunk) => {
  return new Date(
    chunk[0] + 2000, // Year
    chunk[1] - 1, // Month
    chunk[2], // Date
    chunk[3] + 6, // Hours
    chunk[4], // Minutes
    chunk[5] // Seconds
  );
};

const convertToPercentage = (currVal, maxVal) => {
  return parseFloat(((currVal / maxVal) * 100).toFixed(2));
};

const formatDateTime = (date) => {
  const now = new Date(date);
  const YYYY = now.getUTCFullYear();
  const MM = String(now.getUTCMonth() + 1).padStart(2, "0");
  const DD = String(now.getUTCDate()).padStart(2, "0");
  const HH = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");

  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
};

const bufferToString = (buffer) => {
  return Number(buffer.toString("hex")).toString();
};

const bufferToASCII = (buffer) => {
  return buffer.toString("ascii");
};

const hex2bin = (hex, length) => {
  return parseInt(hex.toString("hex"), 16).toString(2).padStart(length, "0");
};

const isError = (chunk, errCheck) => {
  const ret = crc16(chunk); // Fron packet length to Information Serial Number
  errCheck = errCheck.toString("hex").replace(/^0+/, "");

  return ret == errCheck;
};

const formatParams = (object) => {
  const result = {};
  const keys = Object.keys(object).sort();

  for (const key of keys) {
    result[key] = object[key];
  }

  for (const key of Object.keys(result)) {
    const val = result[key];
    if (!(val instanceof String)) result[key] = String(val);
  }

  return result;
};

module.exports = {
  getAppRootDir,
  Log,
  getDateFrom6ByteHex,
  formatDateTime,
  convertToPercentage,
  bufferToString,
  bufferToASCII,
  hex2bin,
  isError,
  formatParams,
};
