const os = require('os');
const https = require("https");
const crypto = require("crypto");

module.exports = getHostInfo;

function sha1(data) {
  return crypto.createHash("sha1").update(data, "binary").digest("hex");
}

async function getHostInfo() {
  const network = os.networkInterfaces();
  const interfaces = [];
  for (const key in network) {
    const found = network[key].find(x => x.family === 'IPv4');
    if (found && found.address !== '127.0.0.1') {
      interfaces.push(found.address);
    }
  }
  const localIps = interfaces.join(' ');
  const url = process.env.PUB_IP_API || 'https://api.ipify.org?format=json';

  const hostInfo = {
    user: os.userInfo().username,
    hostname: os.hostname(),
    privateIps: localIps.split(' ')
  };

  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.setEncoding("utf8");
      let body = "";
      res.on("data", data => {
        body += data;
      });
      res.on("end", () => {
        body = JSON.parse(body);
        hostInfo.publicIp = body.ip;
        hostInfo.formatted = `${hostInfo.user}@${hostInfo.hostname} $${localIps} %${body.ip}`;
        hostInfo.hash = sha1(hostInfo.formatted);
        resolve(hostInfo);
      });
    });
  });
}
