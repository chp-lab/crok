import fs from "fs";
const util = require("util");
const readFile = util.promisify(fs.readFile);

async function getSwap(){
    // ใช้ async/await ในการอ่านข้อมูลจาก /proc/meminfo
    let swap = {};
    try {
      const data = await readFile("/proc/meminfo", "utf8");

      // แยกบรรทัดต่าง ๆ
      const lines = data.split("\n");

      // ค้นหาบรรทัดที่มีข้อมูล Swap
      const swapTotalLine = lines.find((line) =>
        line.startsWith("SwapTotal")
      );
      const swapFreeLine = lines.find((line) => line.startsWith("SwapFree"));

      if (swapTotalLine && swapFreeLine) {
        // แปลงค่าที่ได้จากบรรทัดเป็นตัวเลขหน่วย KB
        const swapTotal = parseInt(
          swapTotalLine.split(":")[1].trim().split(" ")[0],
          10
        );
        const swapFree = parseInt(
          swapFreeLine.split(":")[1].trim().split(" ")[0],
          10
        );

        // คำนวณ Swap ที่ใช้งานอยู่
        const swapUsed = swapTotal - swapFree;

        swap = {
          total_swap: parseFloat((swapTotal / (1024 * 1024)).toFixed(1)),
          free_swap: parseFloat((swapFree / (1024 * 1024)).toFixed(1)),
          use_swap: parseFloat((swapUsed / (1024 * 1024)).toFixed(1)),
        };
      } else {
        console.error("Swap information not found in /proc/meminfo");
      }
    } catch (err) {
      // console.error("Error reading /proc/meminfo:", err);
    }

    return swap
}

module.exports = {getSwap}