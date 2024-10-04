import sequelize from "../db/database.js"
import initModels from "../model/MapModel.js"
import bcrypt from "bcryptjs"

const { User,Admin } = initModels(sequelize)

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
    const {username, password, email, fullname} = body
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Save the user to the database
        const newUser = await Admin.create({
          username,
          password: hashedPassword,
          fullname,
          email
        });
    
        return newUser
      } catch (error) {
        console.log(error.message)
      }
}

module.exports = { checkAdmin, signupAdmin }