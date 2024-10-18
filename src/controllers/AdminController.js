import sequelize from "../db/database.js"
import initModels from "../model/MapModel.js"
import bcrypt from "bcryptjs"
import {generateSecret} from "../../system/secret.js"
const { User,Admin, Op, Role} = initModels(sequelize)

async function checkAdmin(email) {    
    try {
        const admin = await Admin.findOne({
            where: {
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
    const secret = generateSecret()
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
                RoleId : role.id,
                auth_2fa: secret
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