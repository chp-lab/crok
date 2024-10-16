import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
const { User, System, Linkuser, LogSystem, Op } = initModels(sequelize);

async function updateInfo(body) {
  var addSys;

  // Helper function to calculate total CPU in use and available percentages across all cores
  function calculateTotalCpuUsage(cpu) {
      let totalUser = 0, totalNice = 0, totalSys = 0, totalIdle = 0, totalIrq = 0;

      // Summing up the times from all CPU cores
      cpu.forEach(core => {
          totalUser += core.times.user;
          totalNice += core.times.nice;
          totalSys += core.times.sys;
          totalIdle += core.times.idle;
          totalIrq += core.times.irq;
      });

      const totalTime = totalUser + totalNice + totalSys + totalIdle + totalIrq;

      const inuse = ((totalUser + totalNice + totalSys) / totalTime) * 100;
      const available = (totalIdle / totalTime) * 100;

      return {
          inuse: inuse.toFixed(2),  // Round to 2 decimal places
          available: available.toFixed(2)
      };
  }

  try {
      const findlink = await Linkuser.findOne({
          include: [
              {
                  model: System,
                  required: false,
                  duplicating: false
              }
          ],
          where: {
              subdomain: body.subdomain
          }
      });

      if (!findlink) {
          return;
      }

      // Calculate total CPU usage
      const totalCpuUsage = calculateTotalCpuUsage(body.cpu);

      if (!findlink.system) {
          await Linkuser.update({
              local_port: body.port
          }, {
              where: {
                  id: findlink.id
              }
          });

          addSys = await System.create({
              LinkId: findlink.id,
              cpu: body.cpu,
              cpu_num_core: body.cpu_num_core,
              memory: body.memory,
              disk: body.disk,
              cpu_inuse: totalCpuUsage.inuse,  // Store total CPU in use percentage
              cpu_available: totalCpuUsage.available  // Store total CPU available percentage
          });

          await LogSystem.create({
              LinkId: findlink.id,
              cpu: body.cpu,
              cpu_num_core: body.cpu_num_core,
              memory: body.memory,
              disk: body.disk,
              cpu_inuse: totalCpuUsage.inuse,  // Log total CPU in use percentage
              cpu_available: totalCpuUsage.available  // Log total CPU available percentage
          });
      } else {
          await Linkuser.update({
              local_port: body.port
          }, {
              where: {
                  id: findlink.id
              }
          });

          addSys = await System.update({
              cpu: body.cpu,
              cpu_num_core: body.cpu_num_core,
              memory: body.memory,
              disk: body.disk,
              cpu_inuse: totalCpuUsage.inuse,  // Update total CPU in use percentage
              cpu_available: totalCpuUsage.available  // Update total CPU available percentage
          }, {
              where: {
                  LinkId: findlink.id
              }
          });

          await LogSystem.create({
              LinkId: findlink.id,
              cpu: body.cpu,
              cpu_num_core: body.cpu_num_core,
              memory: body.memory,
              disk: body.disk,
              cpu_inuse: totalCpuUsage.inuse,  // Log total CPU in use percentage
              cpu_available: totalCpuUsage.available  // Log total CPU available percentage
          });
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
        subdomain : body.subdomain
      }
    });

    if (!findlink) {
      return
    }

    await System.destroy({
      where : {
        LinkId : findlink.system.LinkId
      }
    });

    await Linkuser.destroy({
      where : {
        subdomain : body.subdomain
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