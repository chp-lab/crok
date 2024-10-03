import sequelize from "../db/database.js";
import initModels from "../model/MapModel.js";
import { randomAsciiString } from "../../generalFunction.js";
const { User, Linkuser, Op } = initModels(sequelize);
const jwt = require("jsonwebtoken")
const util = require("util");

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const verifyToken = util.promisify(jwt.verify);

async function getToken (body) {
    try {
        const user = await User.findOne({
            where : {
                email : body.email
            //   [Op.and] : [ { email : body.email }, {name : body.name}]
            }
        });

        if(!user) {
            throw new Error("User not found.");
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

        // If there's no token, respond with a 401 error
        if (!refresh_token) {
            ctx.status = 401;
            ctx.body = { message: "Refresh token required" };
            return;
        }

        // Verify the refresh token
        const decoded = await verifyToken(refresh_token, JWT_REFRESH_SECRET);

        // Token is valid, attach decoded user info to the context
        ctx.state.user = decoded;
        await next(); // Proceed to the next middleware or function
    } catch (err) {
        // If the token is invalid or expired, respond with a 401 error
        ctx.status = 401;
        ctx.body = { message: "Invalid or expired refresh token" };
    }
}

async function authMiddleware (ctx, next) {
    try {
        // Get the token from the Authorization header
        const authHeader = ctx.headers.authorization;
    
        // If no token is found, respond with a 401 error
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          ctx.status = 401;
          ctx.body = { message: "Authorization token required" };
          return;
        }
    
        // Extract the token part from the 'Bearer <token>' string
        const token = authHeader.split(" ")[1];
    
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
    
        // Token is valid, attach the decoded user info to the context
        ctx.state.user = decoded;
    
        // Proceed to the next middleware or route handler
        await next();
      } catch (err) {
        // If the token is invalid or expired, respond with a 401 error
        console.error("Token validation error:", err);
        ctx.status = 401;
        ctx.body = { message: "Invalid or expired access token" };
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