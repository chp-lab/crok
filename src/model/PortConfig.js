export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("port_configs",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        ssh_port : {
          type: DataTypes.STRING,
        },
      },
      {
        timestamps: true,
      }
    );
    return Project
  }