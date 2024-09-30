export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("user",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING,
        },
        name: {
          type: DataTypes.STRING,
        },
        userKey: {
          type: DataTypes.STRING,
        },
      },
      {
        timestamps: true,
      }
    );
    return Project
  }