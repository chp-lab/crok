import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
const { User, System, Linkuser, Op } = initModels(sequelize);

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
            [Op.and] : [{subdomain : body.subdomain},{tcp_port : body.port}]
          }
        });

        // console.log(findlink);

        if(!findlink) {
          return
        }
        
        if (!findlink.system) {
            addSys = await System.create({
                LinkId : findlink.id,
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
                    LinkId : findlink.id
                }
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
        [Op.and] : [{subdomain : body.subdomain},{tcp_port : body.port}]
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

module.exports = { updateInfo, getInfo, delInfo, pvUserLink }