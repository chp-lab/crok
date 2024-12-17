import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
const { User, Linkuser, PortConfig, UserPackage } = initModels(sequelize);

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

        const find_port_config = await PortConfig.findOne({
            where : {
                ssh_port : port
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
    var isAvailable = false;
    var port;

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
        }],
        include : [{
            model : PortConfig,
            require : false,
        }],
        order: [[{ model: PortConfig }, 'id', 'DESC']],
    })

    if(!find_port_config) {
        return null
    }

    // แนบ ssh_port
    if(ssh_port && ssh_port !== "undefined") {
        // ssh_port สามาร5ใช้ได้
        if(!await checkPortAvailable(ssh_port)) {
            await PortConfig.create({
                ssh_port : ssh_port,
                UserPackageId : find_port_config.id
            })
        } else {
            // ssh_port ไม่สามารถใช้ได้
            if(find_port_config.port_configs.length == 0) {
                await PortConfig.create({
                    ssh_port : ssh_port,
                    UserPackageId : find_port_config.id
                })
            } else {
                ssh_port = (parseInt(find_port_config.port_configs[0].ssh_port) + 1).toString()
                await PortConfig.create({
                    ssh_port : ssh_port,
                    UserPackageId : find_port_config.id
                })
            }
        }
    } else {
        // ไม่แนบ ssh_port
        if(find_port_config.port_configs.length == 0) {
            while (!isAvailable) {
                port = getRandomPort();
                // ตรวจสอบว่าพอร์ตนี้ไม่ได้ถูกใช้งาน และพอร์ตนั้นว่าง
                if (await checkPortAvailable(port)) {
                    await PortConfig.create({
                        ssh_port : port,
                        UserPackageId : find_port_config.id
                    })
                    ssh_port = port
                    isAvailable = true;
                } 
            }

        } else {
            ssh_port = (parseInt(find_port_config.port_configs[0].ssh_port) + 1).toString()
            await PortConfig.create({
                ssh_port : ssh_port,
                UserPackageId : find_port_config.id
            })
        }
    }

    return ssh_port
}

module.exports = {
    findAvailablePort
}