import sequelize from "../db/database.js"
import initModels from "../model/MapModel.js"
import bcrypt from "bcryptjs"
const { User,Admin, Op, Role} = initModels(sequelize)

async function checkAdmin(username, email) {
    try {
        const admin = await Admin.findOne({
            where: {
                username: username,
                email: email
            },
        });
        return admin
    } catch (error) {
        console.log(error.message)
    }
}

async function signupAdmin(body) {
    const {username, password, email, fullname, secret_key} = body
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const role = await Role.findOne({
            where : {
                secret_key : secret_key
            }
        })

        if(!role) {
            return "Secret key has Invalid."
        }

        const admin = await Admin.findOne({
            where : {
                [Op.or] : [{ email },{ username }]
            }
        })

        if(!admin) {
            var newUser = await Admin.create({
                username,
                password: hashedPassword,
                fullname,
                email,
                RoleId : role.id
            });
        } else {
            return "This username or email has already exist."
        }
    
        return newUser
      } catch (error) {
        console.log(error.message)
      }
}

module.exports = { checkAdmin, signupAdmin }