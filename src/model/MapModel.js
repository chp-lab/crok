import { Sequelize, DataTypes } from "sequelize";
import _admin from "./AdminModel.js";
import _user from "./UserModel.js";
import _linkuser from "./LinkUserModel.js"

function initModels(sequelize) {
    var Admin = _admin(sequelize, Sequelize, DataTypes);
    var User = _user(sequelize, Sequelize, DataTypes);
    var Linkuser = _linkuser(sequelize, Sequelize, DataTypes);

    User.hasMany(Linkuser, {foreignKey: "UserId", sourceKey: "id",})
    Linkuser.belongsTo(User, {foreignKey: "UserId",targetId: "id",});


    return {
        Admin,
        User,
        Linkuser
    }
}

export default initModels