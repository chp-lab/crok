export default (sequelize, Sequelize, DataTypes) => {
    const Project = sequelize.define("user_package",
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        package : {
            type: DataTypes.STRING,
            defaultValue: null,
        },
        link_available: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        limit_mem: {
          type: DataTypes.FLOAT,
          defaultValue: 1024*1024*1024,
        },
        usage_mem: {
          type: DataTypes.FLOAT,
          defaultValue: 0,
        },
      },
      {
        timestamps: true,
      }
    );
    return Project
  }