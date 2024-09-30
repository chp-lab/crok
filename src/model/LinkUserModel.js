export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("link_user",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        subdomain: {
          type: DataTypes.STRING,
        },
        tcp_port: {
          type: DataTypes.STRING,
        },
        url: {
          type: DataTypes.STRING,
        },
      },
      {
        timestamps: true,
      }
    );
    return Project
  }