import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
import { randomAsciiString } from "../../generalFunction.js";
import ResponseManager from "../service/response.js"
import bcrypt from "bcryptjs"

const { User, Linkuser, Op, Admin } = initModels(sequelize);
const jwt = require("jsonwebtoken")
const util = require("util");

const JWT_SECRET = process.env.JWT_SECRET || "y761WwEtZ0iDL1E9LwN6qhZdAlsiecWSv1p3y+OY4ws"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "mfe30riCyGKwfH+sTmN7DDuJZ8nSkjJc/nuZfjfDxqs"

const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || "babgpqaTdAiy+xkiGvndyuTNPXWiNx72A/rgJD0Is5E"
const JWT_REFRESH_ADMIN = process.env.JWT_REFRESH_ADMIN || "Izn4ZVIKe1ieQKnekPQQevDrAkVqZXC3Jn/PqsQQV1U"

const verifyToken = util.promisify(jwt.verify);

// --------- User ---------
async function getToken (body) {
    var user
    try {
        user = await User.findOne({
            where : {
                email : body.email
            }
        });

        if(!user) {
            user = await User.create({
                email: body.email,
                name: body.name,
                userKey: randomAsciiString(),
            })
        }

        const access_token = jwtGenerate(user, JWT_SECRET)
        const refresh_token = jwtRefreshTokenGenerate(user, JWT_REFRESH_SECRET)

        return { user, access_token, refresh_token };
    } catch (error) {
        console.log(error.message);
    }
}

async function jwtRefreshTokenValidate (ctx, next) {
    try {
        const { refresh_token } = ctx.request.body;
        if (!refresh_token) {
            new ResponseManager(ctx).error("Refresh token required", 401)
            return;
        }
        const decoded = await verifyToken(refresh_token, JWT_REFRESH_SECRET);
        ctx.state.user = decoded;
        await next();
    } catch (err) {
        console.error("Token validation error:", err);
        new ResponseManager(ctx).error("Invalid or expired refresh token", 401)
    }
}

async function authMiddleware (ctx, next) {
    try {
        const authHeader = ctx.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          new ResponseManager(ctx).error("Authorization token required", 403)
          return;
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        ctx.state.user = decoded;
        await next();
      } catch (err) {
        console.error("Token validation error:", err.message);
        new ResponseManager(ctx).error("Invalid or expired access token", 401)
      }
}

// --------- Admin ---------
async function getTokenAdmin (username, password) {
    var admin
    try {
        admin = await Admin.findOne({
            where : {
                username: username,
                // password: password
            }
        });

        if(!admin) {
            // new ResponseManager(ctx).error("Invalid username or password Admin", 401)
            return;
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            // new ResponseManager(ctx).error("Invalid credentials", 401)
            return 
        }

        const access_token = jwtGenerate(admin, JWT_SECRET_ADMIN)
        const refresh_token = jwtRefreshTokenGenerate(admin, JWT_REFRESH_ADMIN)

        return { admin, access_token, refresh_token };
    } catch (error) {
        console.log("error message : ",error.message);
        // new ResponseManager(ctx).error("Internal server error", 500)
        // return
    }
}

async function getNewTokenAdmin (email) {
    var admin
    try {
        admin = await Admin.findOne({
            where : {
                email : email
            }
        });

        if(!admin) {
            // new ResponseManager(ctx).error("Invalid username or password Admin", 401)
            return;
        }

        const access_token = jwtGenerate(admin, JWT_SECRET_ADMIN)
        const refresh_token = jwtRefreshTokenGenerate(admin, JWT_REFRESH_ADMIN)

        return { admin, access_token, refresh_token };
    } catch (error) {
        console.log(error.message);
    }
}

async function jwtRefreshTokenValidateAdmin (ctx, next) {
    try {
        const { refresh_token } = ctx.request.body;
        if (!refresh_token) {
            new ResponseManager(ctx).error("Admin Refresh token required", 401)
            return;
        }
        const decoded = await verifyToken(refresh_token, JWT_REFRESH_ADMIN);
        ctx.state.admin = decoded;
        await next();
    } catch (err) {
        console.error("Token validation error:", err);
        new ResponseManager(ctx).error("Invalid or expired refresh token", 401)
    }
}

async function authMiddlewareAdmin (ctx, next) {
    try {
        const authHeader = ctx.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          new ResponseManager(ctx).error("Authorization token required", 403)
          return;
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET_ADMIN);
        ctx.state.user = decoded;
        await next();
      } catch (err) {
        console.error("Token validation error:", err.message);
        new ResponseManager(ctx).error("Invalid or expired access token", 401)
      }
}

// --------- Function generate ---------
function jwtGenerate (user, jwt_secret) {
    return jwt.sign(
        { email: user.email, name: user.name },
        jwt_secret,
        { expiresIn: "1h" }
    );
}

function jwtRefreshTokenGenerate (user,jwt_refresh_secret) {
    return jwt.sign(
        { email: user.email },
        jwt_refresh_secret,
        { expiresIn: "7d" }
    );
}

module.exports = { getToken, jwtRefreshTokenValidate, authMiddleware, getTokenAdmin, jwtRefreshTokenValidateAdmin, authMiddlewareAdmin, getNewTokenAdmin }