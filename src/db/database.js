import { Sequelize, Op, QueryTypes }  from 'sequelize';

var dbConfig = {
    DB: `${process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'postgres'}`,
    USER: `${process.env.DATABASE_USER ? process.env.DATABASE_USER : 'postgres'}`,
    PASSWORD: `${process.env.DATABASE_PASS ? process.env.DATABASE_PASS : 'root'}`,
    HOST: `${process.env.DATABASE_HOST ? process.env.DATABASE_HOST : 'localhost'}`,
    PORT: `${process.env.DATABASE_PORT ? process.env.DATABASE_PORT : 5432}`,
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    // directory: './models', // where to write files
    // singularize: true, // convert plural table names to singular model names
    // additional: {
    //     timestamps: false
    // }
}


console.log(dbConfig)

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    },
    logging: false,
    // logging: (msg) => console.log(msg),
    singularize: true, // convert plural table names to singular model names
    timezone: '+07:00',
});

// module.exports = { sequelize, Op };
export default sequelize