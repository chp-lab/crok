import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
import { randomAsciiString } from "../../generalFunction.js";
import ResponseManager from "../service/response.js"

const { User, Linkuser, Op } = initModels(sequelize);
const jwt = require("jsonwebtoken")
const util = require("util");

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const verifyToken = util.promisify(jwt.verify);

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

        const access_token = jwtGenerate(user)
        const refresh_token = jwtRefreshTokenGenerate(user)

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
        console.error("Token validation error:", err);
        new ResponseManager(ctx).error("Invalid or expired access token", 401)
      }
}

function jwtGenerate (user) {
    return jwt.sign(
        { email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
}

function jwtRefreshTokenGenerate (user) {
    return jwt.sign(
        { email: user.email },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
}

module.exports = { getToken, jwtRefreshTokenValidate, authMiddleware }