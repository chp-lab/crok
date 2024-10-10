export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("log_system",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        cpu: {
            type: DataTypes.JSON,
        },
        cpu_num_core: {
            type: DataTypes.INTEGER,
        },
        memory: {
            type: DataTypes.JSON,
        },
        disk: {
            type: DataTypes.JSON,
        },
      },
      {
        timestamps: true,
      }
    );
    return Project
  }