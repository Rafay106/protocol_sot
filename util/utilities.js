const fs = require("node:fs");
const path = require("node:path");

const getAppRootDir = (currentDir) => {
  while (!fs.existsSync(path.join(currentDir, "package.json"))) {
    currentDir = path.join(currentDir, "..");
  }
  return currentDir;
};

const writeLog = async (log, logData) => {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0"); // months from 1-12
  const year = now.getUTCFullYear();

  const logDir = path.join(getAppRootDir(__dirname), "logs", log);

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logFile = path.join(logDir, `${log}_${year}_${month}.log`);

  let str = `[${new Date().toISOString().replace("T", " ").split(".")[0]}] `;

  str += "=> " + logData + "\n\n";

  fs.appendFileSync(logFile, str);
};

module.exports = {
  getAppRootDir,
  writeLog,
};
