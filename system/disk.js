const { exec } = require("child_process");

function getDisk() {
  return new Promise((resolve, reject) => {
    exec("df -h", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(error); // Reject Promise หากเกิดข้อผิดพลาด
      }

      // แยกบรรทัด
      const lines = stdout.trim().split("\n");
      console.log(">> ",lines)
      // สร้าง array of objects
      const diskInfo = lines.slice(1).map((line) => {
        const columns = line.split(/\s+/);
        console.log("line ",line);
        console.log("columns ",columns);
        
        return {
          filesystem: columns[0],
          size: columns[1],
          used: columns[2],
          available: columns[3],
          usePercent: columns[4],
          mountedOn: columns[5],
        };
      });

      resolve(diskInfo); // Resolve Promise กับข้อมูลดิสก์
    });
  });
}

module.exports = { getDisk };
