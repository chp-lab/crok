import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
const { User, System } = initModels(sequelize);

async function updateInfo(body) {
    var addSys
    try {
        const findSys = await System.findOne({
          where : {
            UserId : body.user_id
          }
        });

        if (!findSys) {
            addSys = await System.create({
                UserId : body.user_id,
                tunnels : body.tunnels,
                mem: body.mem,
                cpu: body.cpu,
                cpu_num_core: body.cpu_num_core,
                memory: body.memory,
                swap: body.swap,
                disk: body.disk,
            })
        } else {
            addSys = await System.update({
                mem: body.mem,
                tunnels : body.tunnels,
                cpu: body.cpu,
                cpu_num_core: body.cpu_num_core,
                memory: body.memory,
                swap: body.swap,
                disk: body.disk,
            },{
                where : {
                    UserId : body.user_id,
                }
            })
        }

        return addSys;
      } catch (error) {
        console.log(error.message);
      }
}

async function getInfo(user_id) {
  try {
    const findSys = await System.findOne({
      where : {
        UserId : user_id
      }
    });

    if (!findSys) {
      return
    }

    console.log(findSys.toJSON());

    return findSys.toJSON()
  } catch (error) {
    console.log(error.message);
  }
}

async function delInfo(user_id) {
  try {
    const findSys = await System.findOne({
      where : {
        UserId : user_id
      }
    });

    if (!findSys) {
      return
    }

    await System.destroy({
      where : {
        UserId : user_id
      }
    });

    return "Delete system info success."
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = { updateInfo, getInfo, delInfo }