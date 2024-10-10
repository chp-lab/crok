import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
const { User, System, Linkuser, LogSystem, Op } = initModels(sequelize);

async function updateInfo(body) {
    // console.log(body);
    
    var addSys
    try {
        const findlink = await Linkuser.findOne({
          include : [
            {
              model : System,
              required : false,
              duplicating : false
            }
          ],
          where : {
            // [Op.and] : [{subdomain : body.subdomain},{tcp_port : body.port}]
            subdomain : body.subdomain
          }
        });

        if(!findlink) {
          return
        }
        
        if (!findlink.system) {
            await Linkuser.update({
              local_port : body.port
            },{
              where : {
                id : findlink.id
              }
            })

            addSys = await System.create({
                LinkId : findlink.id,
                cpu: body.cpu,
                cpu_num_core: body.cpu_num_core,
                memory: body.memory,
                disk: body.disk,
            })

            await LogSystem.create({
              LinkId : findlink.id,
                cpu: body.cpu,
                cpu_num_core: body.cpu_num_core,
                memory: body.memory,
                disk: body.disk,
            })
        } else {
            await Linkuser.update({
              local_port : body.port
            },{
              where : {
                id : findlink.id
              }
            })

            addSys = await System.update({
                cpu: body.cpu,
                cpu_num_core: body.cpu_num_core,
                memory: body.memory,
                disk: body.disk,
            },{
                where : {
                    LinkId : findlink.id
                }
            })

            await LogSystem.create({
              LinkId : findlink.id,
                cpu: body.cpu,
                cpu_num_core: body.cpu_num_core,
                memory: body.memory,
                disk: body.disk,
            })
        }

        return addSys;
      } catch (error) {
        console.log(error.message);
      }
}

async function getInfo(link_id) {
  try {
    const findSys = await System.findOne({
      where : {
        LinkId : link_id
      }
    });

    if (!findSys) {
      console.log("getInfo : not found.");
      return
    }

    // console.log(findSys.toJSON());

    return findSys.toJSON()
  } catch (error) {
    console.log(error.message);
  }
}

async function getLogInfo(link_id) {
  try {
    const findSys = await LogSystem.findAll({
      attributes : ['cpu','cpu_num_core','memory','disk'],
      where : {
        LinkId : link_id
      }
    });

    if (!findSys) {
      console.log("getInfo : not found.");
      return
    }

    // console.log(findSys.toJSON());

    return findSys
  } catch (error) {
    console.log(error.message);
  }
}

async function delInfo(body) {
  try {
    const findlink = await Linkuser.findOne({
      include : [
        {
          model : System,
          required : true,
          duplicating : false
        }
      ],
      where : {
        // [Op.and] : [{subdomain : body.subdomain},{tcp_port : body.port}]
        subdomain : body.subdomain
      }
    });

    if (!findlink) {
      return
    }

    // console.log(findlink.toJSON());
    

    await System.destroy({
      where : {
        LinkId : findlink.system.LinkId
      }
    });

    return "Delete system info success."
  } catch (error) {
    console.log(error.message);
  }
}

async function pvUserLink(user_key) {
  try {
    const user = await User.findAll({
      include: [
        {
          model: Linkuser,
          required: true,
        },
      ],
      where : {
        userKey : user_key
      }
    });
    return user;
  } catch (error) {
    console.log(error.message);
  }
}

module.exports = { updateInfo, getInfo, delInfo, pvUserLink, getLogInfo }