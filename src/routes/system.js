import ResponseManager from "../service/response.js";
const manageSys = require("../controllers/InfoSystemController.js");

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
                    throw new Error();
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

        this.router.get(this.api_v1 + "/system/info/:UserId", async (ctx, next) => {
            // console.log(ctx.params);
            const user_id = ctx.params.UserId
            try {
                const result = await manageSys.getInfo(user_id);

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

        this.router.delete(this.api_v1 + "/system/info/:UserId", async (ctx, next) => {
            // console.log(ctx.params);
            const user_id = ctx.params.UserId
            try {
                const result = await manageSys.delInfo(user_id);

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
    }
}  

module.exports = System;