import { log } from "util";
import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
const { User, Linkuser, System, LogSystem, UserPackage } = initModels(sequelize);

// ฟังก์ชันแรนด้อมพอร์ตในช่วง 2000-3000
function getRandomPort(min = 2000, max = 3000) {
    const ran_port = Math.floor(Math.random() * (max - min + 1)) + min;
    return ran_port.toString()
}

// ฟังก์ชันตรวจสอบว่าพอร์ตว่างหรือไม่
async function checkPortAvailable(port) {
    try {  
        const find_port = await Linkuser.findOne({
            where : {
                ssh_port : port
            }
        })

        if(!find_port) {
            return true
        }

        return false
    } catch(error) {
        console.log(error.message);
    }
}

// ฟังก์ชันหาและคืนค่าพอร์ตที่ว่าง
async function findAvailablePort() {
    let port;
    let isAvailable = false;

    while (!isAvailable) {
        port = getRandomPort();

        // ตรวจสอบว่าพอร์ตนี้ไม่ได้ถูกใช้งาน และพอร์ตนั้นว่าง
        if (await checkPortAvailable(port)) {
            isAvailable = true;
        }
    }

    return port;
}

module.exports = {
    findAvailablePort
}