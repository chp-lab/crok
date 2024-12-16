const ssh_con = require('../controllers/SshController')
import ResponseManager from "../service/response.js";

class Ssh {
    constructor(router, manager) {
        this.router = router;
        this.manager = manager;
        this.api_v1 = "/api/v1";
    }

    sshInfo() {
        this.router.get(this.api_v1 + "/ssh-port", async (ctx, next) => {
            const user_key = ctx.query.userKey
            const ssh_port = ctx.query.ssh_port
            
            try {
                const result = await ssh_con.findAvailablePort(user_key,ssh_port);

                if (!result) {
                    new ResponseManager(ctx).error("System info not found.", 404);
                    return
                }

                let data = {
                    sshPort : result
                }

                new ResponseManager(ctx).success(data);
            } catch (error) {
                console.error("Internal server error.", error.message);
                new ResponseManager(ctx).error(
                    "Internal server error.",
                    500
                );
            }
        });
    }
}

module.exports = Ssh;