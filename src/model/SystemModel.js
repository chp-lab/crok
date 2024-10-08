export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("system",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tunnels : {
          type: DataTypes.INTEGER,
        },
        mem: {
            type: DataTypes.JSON,
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
        swap: {
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