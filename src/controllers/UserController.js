import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
import { randomAsciiString } from "../../generalFunction.js";
import { user } from "pg/lib/defaults.js";
const { User, Linkuser, System, LogSystem } = initModels(sequelize);

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
    const user = await User.findAll();
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

    // const linkusercheck = await Linkuser.findOne({
    //   where: {
    //     subdomain: args.id,
    //   },
    // });
    // console.log(">>>> ", linkusercheck);

    // if (linkusercheck !== null) {
    //   await Linkuser.update(
    //     {
    //       subdomain: args.id,
    //       tcp_port: args.port,
    //       url: args.url,
    //       UserId: usercheck.id,
    //     },
    //     {
    //       where: { id: linkusercheck.id },
    //     }
    //   );
    // } else {
    //   const linkuser = await Linkuser.create({
    //     subdomain: args.id,
    //     tcp_port: args.port,
    //     url: args.url,
    //     UserId: usercheck.id,
    //   });
    //   if (!linkuser) {
    //     console.log("create Linkuser fail");
    //   }
    // }
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
    // const linkuser = await Linkuser.create({
    //   subdomain: args.id,
    //   tcp_port: args.port,
    //   url: args.url,
    //   UserId: user.id,
    // });
    // if (!linkuser) {
    //   console.log("create Linkuser fail");
    // }
  }
}

async function addUserLink(args, user_id) {
  try {
    const linkuser = await Linkuser.create({
      subdomain: args.id,
      tcp_port: args.port,
      url: args.url,
      UserId: user_id,
    });
    if (!linkuser) {
      console.log("create Linkuser fail");
    }
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
          }
        ],
        where: {
          userKey: args.userKey,
        },
      });

      // console.log(userkeycheck.toJSON());
      // console.log(userkeycheck.toJSON().link_available, "<", userkeycheck.toJSON().link_users.length);

      let link_available = userkeycheck.toJSON().link_available
      let num_link = userkeycheck.toJSON().link_users.length

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
    await User.update({
      link_available : numb
    },{
      where : {
        userKey : user_key
      }
    });

    return
  } catch (error) {
    console.log("editAvailableLink : ",error.message);
    
  }
}

module.exports = {
  getUserLink,
  createUser,
  getAllUser,
  checkKey,
  addUserLink,
  editAvailableLink
};
