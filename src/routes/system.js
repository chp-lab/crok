import ResponseManager from "../service/response.js";
const manageSys = require("../controllers/InfoSystemController.js");
import {
    getToken,
    jwtRefreshTokenValidate,
    authMiddleware,
    getTokenAdmin,
    jwtRefreshTokenValidateAdmin,
    authMiddlewareAdmin,
    getNewTokenAdmin,
  } from "../service/authen.js";

class System {
    constructor(router, manager) {
        this.router = router;
        this.manager = manager;
        this.api_v1 = "/api/v1";
        // this.debug = Debug("localtunnel:DebugApi");
    }

    systemInfo() {
        this.router.post(this.api_v1 + "/system/info", async (ctx, next) => {
            const body = ctx.request.body
            try {
                const result = await manageSys.updateInfo(body);

                if (!result) {
                    new ResponseManager(ctx).error(
                        "User link not connect.",
                        404
                    );
                }

                new ResponseManager(ctx).success("Update system info success.");
            } catch (error) {
                console.error("Authentication error:", error.message);
                new ResponseManager(ctx).error(
                    "Internal server error.",
                    500
                );
            }
        });

        this.router.get(this.api_v1 + "/system/info/:LinkId", authMiddleware, async (ctx, next) => {
            console.log(ctx.params.LinkId);
            const link_id = ctx.params.LinkId
            try {
                const result = await manageSys.getInfo(link_id);

                if (!result) {
                    new ResponseManager(ctx).error("System info not found.", 404);
                    return
                }

                let data = {
                    tunnels: result.tunnels,
                    mem: result.mem,
                    cpu: result.cpu,
                    cpu_num_core: result.cpu_num_core,
                    memory: result.memory,
                    swap: result.swap,
                    disk: result.disk,
                }

                new ResponseManager(ctx).success(data);
            } catch (error) {
                console.error("Authentication error:", error.message);
                new ResponseManager(ctx).error(
                    "Internal server error.",
                    500
                );
            }
        });

        this.router.delete(this.api_v1 + "/system/info", async (ctx, next) => {
            // console.log(ctx.params);
            const body = ctx.request.body
            try {
                const result = await manageSys.delInfo(body);

                if (!result) {
                    new ResponseManager(ctx).error("System info not found.", 404);
                    return
                }

                new ResponseManager(ctx).success(null, result);
            } catch (error) {
                console.error("Authentication error:", error.message);
                new ResponseManager(ctx).error(
                    "Internal server error.",
                    500
                );
            }
        });

        this.router.get(this.api_v1 + "/user/link", authMiddleware, async (ctx, next) => {
            // console.log(ctx.params);
            const user_key = ctx.query.userKey
            try {
                const result = await manageSys.pvUserLink(user_key);

                if (!result) {
                    new ResponseManager(ctx).error("URL info not found.", 404);
                    return
                }

                const all = [];
                result.forEach((element) => {
                    element.link_users.forEach((e) => {
                        all.push({
                            link_id : e.id,
                            name: element.name,
                            userKey: element.userKey,
                            subdomain: e.subdomain,
                            tcp_port: e.tcp_port,
                            url: e.url,
                            email: element.email,
                            createdAt: e.createdAt,
                        });
                    });
                });

                new ResponseManager(ctx).success(all);
            } catch (error) {
                console.error("Authentication error:", error.message);
                new ResponseManager(ctx).error(
                    "Internal server error.",
                    500
                );
            }
        });
    }
}  

module.exports = System;