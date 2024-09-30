import sequelize from "../db/database.js"
import initModels from "../model/MapModel.js"

const { User, Linkuser } = initModels(sequelize)

async function getUserLink() {
    try {
        const user = await User.findAll({
            include: [
                {
                    model: Linkuser,
                    required: true
                }
            ],
        });
        return user
    } catch (error) {
        console.log(error.message)
    }
}


async function createUser(args) {
    console.log("args");
    console.log(args);
    const usercheck = await User.findOne({
        where: {
            email: args.user.email
        }
    })
    if (usercheck !== null) {
        console.log('user เดิม');

        const linkusercheck = await Linkuser.findOne({
            where: {
                subdomain: args.id
            }
        })
        // console.log(">>>> ", linkusercheck);

        if (linkusercheck !== null) {
            await Linkuser.update(
                {
                    subdomain: args.id,
                    tcp_port: args.port,
                    url: args.url,
                    UserId: usercheck.id
                },
                {
                    where: { id: linkusercheck.id },
                }
            )
        } else {
            const linkuser = await Linkuser.create({
                subdomain: args.id,
                tcp_port: args.port,
                url: args.url,
                UserId: usercheck.id
            })
            if (!linkuser) {
                console.log("create Linkuser fail");
            }
        }

    } else {
        console.log('user ใหม่');
        const user = await User.create({
            email: args.user.email,
            name: args.user.name,
            userKey: args.user.userKey
        })
        if (!user) {
            console.log("create User fail");
        }
        console.log(user.id);
        const linkuser = await Linkuser.create({
            subdomain: args.id,
            tcp_port: args.port,
            url: args.url,
            UserId: user.id
        })
        if (!linkuser) {
            console.log("create Linkuser fail");
        }
    }

}

export async function deleteLinkUser(args) {
    // console.log(">>> ",args)
    const deleteData = await Linkuser.destroy({
        where: {
            subdomain: args
        }
    })
    // console.log(deleteData);

    // if (!deleteData) {
    //     console.log('delete Linkuser failed');
    // }
}

export function emptyTable() {
    console.log('Empty Table Linkuser success');

    Linkuser.destroy({
        where: {},   // เงื่อนไข where ว่างเปล่า หมายถึงเลือกข้อมูลทั้งหมด
        force: true  // ถ้าคุณเปิดใช้ soft delete (paranoid), force จะทำการลบจริง ๆ
    });

}
module.exports = { getUserLink, createUser }