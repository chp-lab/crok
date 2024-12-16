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

        const find_port_config = await UserPackage.findOne({
            where : {
                ssh_port_config : port
            }
        })
        
        if(!find_port_config) {
            return true
        }

        return false
    } catch(error) {
        console.log(error.message);
    }
}

// ฟังก์ชันหาและคืนค่าพอร์ตที่ว่าง
async function findAvailablePort(userKey,ssh_port) {
    let port;
    let isAvailable = false;
    
    if(userKey == "" || userKey == null || userKey == undefined) {
        return null
    }

    const find_port_config = await UserPackage.findOne({
        include : [{
            model : User,
            require : true,
            where : {
                userKey : userKey
            }
        }]
    })

    if(ssh_port && ssh_port !== "undefined") {
        await UserPackage.update({
            ssh_port_config : ssh_port
        },
        {
            where : { UserId : find_port_config.UserId}
        })

        return ssh_port
    }   

    if(!find_port_config.ssh_port_config) {
        while (!isAvailable) {
            port = getRandomPort();
            // ตรวจสอบว่าพอร์ตนี้ไม่ได้ถูกใช้งาน และพอร์ตนั้นว่าง
            if (await checkPortAvailable(port)) {
                if(find_port_config.UserId) {
                    await UserPackage.update({
                        ssh_port_config : port
                    },
                    {
                        where : { UserId : find_port_config.UserId}
                    })
                }
                isAvailable = true;
            } 
        }
    
        return port;
    } else {
        return find_port_config.ssh_port_config
    }
}

module.exports = {
    findAvailablePort
}