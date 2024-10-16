import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
import { randomAsciiString } from "../../generalFunction.js";
import { user } from "pg/lib/defaults.js";
const { User, Linkuser, System, LogSystem, UserPackage } = initModels(sequelize);

async function getUserLink() {
  try {
    const user = await User.findAll({
      include: [
        {
          model: Linkuser,
          required: true,
        },
      ],
    });
    return user;
  } catch (error) {
    console.log(error.message);
  }
}

async function getAllUser() {
  try {
    const user = await User.findAll({
      include : [
        {
          model : UserPackage
        },
      ]
    });
    
    // console.log(user[0].user_package.link_available);
    
    return user;
  } catch (error) {
    console.log(error.message);
  }
}

async function createUser(args) {
  // console.log("args");
  // console.log(args);
  const usercheck = await User.findOne({
    where: {
      email: args.email,
    },
  });
  if (usercheck !== null) {
    console.log("user เดิม");
    return { success: false, msg: "already" };
  } else {
    console.log("user ใหม่");
    const user = await User.create({
      email: args.email,
      name: args.name,
      userKey: randomAsciiString(),
    });
    if (!user) {
      console.log("create User fail");
    }
    console.log(user.userKey);
    return { success: true, msg: user.userKey };
  }
}

async function addUserLink(args, user_id) {
  try {
    const linkuser = await Linkuser.create({
      subdomain: args.id,
      tcp_port: args.port,
      url: args.url,
      UserId: user_id,
      ssh_port:args.ssh_port
    });

    if (!linkuser) {
      console.log("create Linkuser fail");
    }

    // await UserPackage.update({
    //   package : "default",
    //   limit_mem : 1024*1024*1024,
    //   usage_mem : 0
    // },{
    //   where : {
    //     UserId: user_id,
    //   }
    // })

  } catch (error) {}
}

async function checkKey(args, mode) {
  try {
    if (mode == "check_key") {
      const userkeycheck = await User.findOne({
        where: {
          userKey: args.userKey,
        },
      });
      return userkeycheck;
    }

    if (mode == "get_key") {
      const userkeycheck = await User.findOne({
        where: {
          email: args.email,
        },
      });
      return userkeycheck;
    }

    if (mode == "check_url") {
      const userkeycheck = await User.findOne({
        include : [
          {
            model : Linkuser,
            required : true,
          },{
            model : UserPackage,
            required : true,
          }
        ],
        where: {
          userKey: args.userKey,
        },
      });

      // console.log(userkeycheck.toJSON());
      // console.log(userkeycheck.toJSON().link_available, "<", userkeycheck.toJSON().link_users.length);

      let link_available = userkeycheck.toJSON().user_package.link_available
      let num_link = userkeycheck.toJSON().link_users.length
      
      // console.log("link_available ",link_available);
      // console.log(link_available < num_link);

      if(num_link < link_available) {
        return null
      }
      return userkeycheck;
    }
  } catch (error) {}
}

export async function deleteLinkUser(args) {
  // console.log(">>> ",args)
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
      subdomain : args
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

  await LogSystem.destroy({
    where : {
      LinkId : findlink.system.LinkId
    }
  });

  const deleteData = await Linkuser.destroy({
    where: {
      subdomain: args,
    },
  });
  // console.log(deleteData);

  // if (!deleteData) {
  //     console.log('delete Linkuser failed');
  // }
}

export function emptyTable() {
  console.log("Empty Table Linkuser success");

  Linkuser.destroy({
    where: {}, // เงื่อนไข where ว่างเปล่า หมายถึงเลือกข้อมูลทั้งหมด
    force: true, // ถ้าคุณเปิดใช้ soft delete (paranoid), force จะทำการลบจริง ๆ
  });
}

async function editAvailableLink(user_key, numb) {
  try {
    const findId = await User.findOne({
      where : {
        userKey : user_key
      }
    })

    if(!findId) {
      return
    }

    await UserPackage.update({
      link_available : numb
    },{
      where : {
        UserId : findId.id
      }
    });

    return findId
  } catch (error) {
    console.log("editAvailableLink : ",error.message);
    
  }
}

async function findMemUser(user_key) {
  try {
    const find_mem = await User.findOne({
      include : [
        {
          model : UserPackage,
          required : true,
          attributes : ['UserId','limit_mem','usage_mem',]
        }
      ],
      where : {
        userKey : user_key
      }
    });

    // console.log(find_mem.toJSON());
    // console.log(find_mem.toJSON().user_package);
    
    if(!find_mem) {
      return 
    }

    return find_mem.toJSON().user_package
  } catch (error) {
    console.log("findMemUser : ",error.message);
  }
}

async function updateMemUser(user_key, usage_mem) {
  try {
    const find_mem = await User.findOne({
      where : {
        userKey : user_key
      }
    });
    
    if(!find_mem) {
      return 
    }

    await UserPackage.update({ usage_mem : usage_mem },{
      where : {
        UserId : find_mem.id
      }
    })

    return find_mem.toJSON()
  } catch (error) {
    console.log("updateMemUser : ",error.message);
  }
}

module.exports = {
  getUserLink,
  createUser,
  getAllUser,
  checkKey,
  addUserLink,
  editAvailableLink,
  findMemUser,updateMemUser
};
