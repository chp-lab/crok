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
            try {
                const result = await ssh_con.findAvailablePort();

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