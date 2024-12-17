import { Sequelize, DataTypes, Op } from "sequelize";
import _admin from "./AdminModel.js";
import _user from "./UserModel.js";
import _linkuser from "./LinkUserModel.js"
import _system from "./SystemModel.js"
import _role from "./RoleAdmin.js"
import _logsystem from "./LogSystem.js"
import _userpackage from "./UserPackage.js"
import _portconfig from "./PortConfig.js"

function initModels(sequelize) {
    var Admin = _admin(sequelize, Sequelize, DataTypes);
    var User = _user(sequelize, Sequelize, DataTypes);
    var Linkuser = _linkuser(sequelize, Sequelize, DataTypes);
    var System = _system(sequelize, Sequelize, DataTypes);
    var Role = _role(sequelize, Sequelize, DataTypes);
    var LogSystem = _logsystem(sequelize, Sequelize, DataTypes);
    var UserPackage = _userpackage(sequelize, Sequelize, DataTypes);
    var PortConfig = _portconfig(sequelize, Sequelize, DataTypes)

    User.hasMany(Linkuser, {foreignKey: "UserId", sourceKey: "id",})
    Linkuser.belongsTo(User, {foreignKey: "UserId",targetId: "id",});

    Linkuser.hasOne(System, {foreignKey: "LinkId", sourceKey: "id",})
    System.belongsTo(Linkuser, {foreignKey: "LinkId",targetId: "id",});

    Linkuser.hasOne(LogSystem, {foreignKey: "LinkId", sourceKey: "id",})
    LogSystem.belongsTo(Linkuser, {foreignKey: "LinkId",targetId: "id",});

    Role.hasMany(Admin, {foreignKey: "RoleId", sourceKey: "id",})
    Admin.belongsTo(Role, {foreignKey: "RoleId",targetId: "id",});

    Role.hasMany(User, {foreignKey: "RoleId", sourceKey: "id",})
    User.belongsTo(Role, {foreignKey: "RoleId",targetId: "id",});

    User.hasOne(UserPackage, {foreignKey: "UserId", sourceKey: "id",})
    UserPackage.belongsTo(User, {foreignKey: "UserId",targetId: "id",});

    UserPackage.hasMany(PortConfig, {foreignKey: "UserPackageId", sourceKey: "id",})
    PortConfig.belongsTo(UserPackage, {foreignKey: "UserPackageId",targetId: "id",});

    return {
        Admin,
        User,
        Linkuser,
        Op,
        System,
        LogSystem,
        Role,
        UserPackage,
        PortConfig
    }
}

export default initModels