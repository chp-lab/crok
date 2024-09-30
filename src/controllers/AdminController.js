import sequelize from "../db/database.js"
import initModels from "../model/MapModel.js"

const { User,Admin } = initModels(sequelize)

async function checkAdmin(username, password) {
    try {
        const user = await Admin.findOne({
            where: {
                username: username,
                password: password
            },
        });
        return user
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {checkAdmin}