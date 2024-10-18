export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("admin",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        fullname: {
          type: DataTypes.STRING,
        },
        email: {
          type: DataTypes.STRING,
        },
        username: {
          type: DataTypes.STRING,
        },
        password: {
          type: DataTypes.STRING,
        },
        auth_2fa:{
          type: DataTypes.STRING,
        }
      },
      {
        timestamps: true,
      }
    );
    return Project
  }