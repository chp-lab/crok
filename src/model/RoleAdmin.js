export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("role",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        role: {
            type: DataTypes.STRING,
        },
        secret_key: {
            type: DataTypes.STRING,
        },
      },
      {
        timestamps: true,
      }
    );
    return Project
  }