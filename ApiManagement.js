import fs from "fs";
import path from "path";
import Debug from "debug";
import { checkAdmin, signupAdmin } from "./src/controllers/AdminController";
import {
  getToken,
  jwtRefreshTokenValidate,
  authMiddleware,
  getTokenAdmin,
  jwtRefreshTokenValidateAdmin,
  authMiddlewareAdmin,
  getNewTokenAdmin,
} from "./src/service/authen";
import { hri } from "human-readable-ids";
import ResponseManager from "./src/service/response";
import {
  getUserLink,
  addUserLink,
  getAllUser,
  checkKey,
  createUser,
  editAvailableLink,
  findMemUser,
  updateMemUser,
  updateLimitMem
} from "./src/controllers/UserController";

import os from "os";
import { getDisk } from "./system/disk";
import { getSwap } from "./system/swap";
import { getMemory } from "./system/memory";
import {verifyTwofactor} from "./system/verify_2fa"

class ApiManagement {
  constructor(router, manager) {
    this.router = router;
    this.manager = manager;
    this.api_v1 = "/api/v1";
    this.debug = Debug("localtunnel:DebugApi");
  }

  // api authentication
  authentication() {
    this.router.post(this.api_v1 + "/auth/login", async (ctx, next) => {

      if(typeof ctx.request.body.email !== 'string' || ctx.request.body.email == "") {
        return new ResponseManager(ctx).error(
          "email must be string.",
          400
        );
      }

      if(typeof ctx.request.body.name !== 'string' || ctx.request.body.name == "") {
        return new ResponseManager(ctx).error(
          "name must be string.",
          400
        );
      }

      try {
        const result = await getToken(ctx.request.body);
        if (!result) {
          new ResponseManager(ctx).error("Invalid email", 404);
          return;
        }

        const { user, access_token, refresh_token } = result;
        const data_body = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          access_token,
          refresh_token,
        };
        new ResponseManager(ctx).success(data_body, "Login successfully");
      } catch (error) {
        console.error("Authentication error:", error.message);
        new ResponseManager(ctx).error(
          "An error occurred during authentication.",
          500
        );
      }
    });

    this.router.post(
      this.api_v1 + "/auth/refresh",
      jwtRefreshTokenValidate,
      async (ctx, next) => {
        const body = ctx.state.user;
        try {
          const result = await getToken(body);
          if (!result) {
            new ResponseManager(ctx).error("Invalid email", 404);
            return;
          }

          const { user, access_token, refresh_token } = result;
          const data_body = {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            access_token,
            refresh_token,
          };
          new ResponseManager(ctx).success(data_body, "Refresh successfully");
        } catch (error) {
          console.error("Authentication error:", error.message);
          new ResponseManager(ctx).error(
            "An error occurred during authentication.",
            500
          );
        }
      }
    );
  }

  // api admin dashboard
  dashboard() {
    // read html dashboard
    this.router.get("/dashboard", async (ctx, next) => {
      try {
        const filePath = path.join(__dirname, "views", "dashboard.html");
        const html = await fs.promises.readFile(filePath, "utf-8"); // อ่านไฟล์ HTML

        ctx.type = "html"; // กำหนด type เป็น HTML
        ctx.body = html; // ส่งไฟล์ HTML ไปยัง body
      } catch (err) {
        ctx.status = 500;
        ctx.body = "Error loading the page";
      }
    });

    // read html auth_client
    this.router.get("/auth_client", async (ctx, next) => {
      try {
        const filePath = path.join(__dirname, "views", "auth_client.html");
        const html = await fs.promises.readFile(filePath, "utf-8"); // อ่านไฟล์ HTML

        ctx.type = "html"; // กำหนด type เป็น HTML
        ctx.body = html; // ส่งไฟล์ HTML ไปยัง body
      } catch (err) {
        ctx.status = 500;
        ctx.body = "Error loading the page";
      }
    });

    // read html login
    this.router.get("/dashboard/login", async (ctx, next) => {
      try {
        const filePath = path.join(__dirname, "views", "login.html");
        const html = await fs.promises.readFile(filePath, "utf-8"); // อ่านไฟล์ HTML

        ctx.type = "html"; // กำหนด type เป็น HTML
        ctx.body = html; // ส่งไฟล์ HTML ไปยัง body
      } catch (err) {
        ctx.status = 500;
        ctx.body = "Error loading the page";
      }
    });
    
    this.router.get("/register", async (ctx, next) => {
      try {
        const filePath = path.join(__dirname, "views", "register.html");
        const html = await fs.promises.readFile(filePath, "utf-8"); // อ่านไฟล์ HTML

        ctx.type = "html"; // กำหนด type เป็น HTML
        ctx.body = html; // ส่งไฟล์ HTML ไปยัง body
      } catch (err) {
        ctx.status = 500;
        ctx.body = "Error loading the page";
      }
    });

    this.router.get("/monitor", async (ctx, next) => {
      try {
        const filePath = path.join(__dirname, "views", "monitor.html");
        const html = await fs.promises.readFile(filePath, "utf-8"); // อ่านไฟล์ HTML

        ctx.type = "html"; // กำหนด type เป็น HTML
        ctx.body = html; // ส่งไฟล์ HTML ไปยัง body
      } catch (err) {
        ctx.status = 500;
        ctx.body = "Error loading the page";
      }
    });

    this.router.get(this.api_v1 + "/get_user_all", async (ctx, next) => {
      try {
        const clientAll = await getAllUser();
        ctx.body = clientAll;
      } catch (err) {
        ctx.status = 500;
        ctx.body = "Error getAllUser";
      }
    });

    this.router.put(this.api_v1 + "/edit/link_available", authMiddlewareAdmin, async (ctx, next) => {
      let userKey = ctx.request.body.userKey
      let numb = ctx.request.body.number

      if (numb > 3) {
        new ResponseManager(ctx).error("number must less than or equal to 3.", 400);
        return
      }

      try {
        const editAv = await editAvailableLink(userKey, numb);
        if(!editAv) {
          new ResponseManager(ctx).error("User from userKey not found.", 400);
          return
        }

        new ResponseManager(ctx).success(null, "Edit link available success.");
      } catch (err) {
        this.debug(err.message + " Update link available fail");
        new ResponseManager(ctx).error("Update link available fail", 500);
      }
    })

    this.router.get(this.api_v1 + "/get/memmory/:userKey", async (ctx, next) => {
      let userKey = ctx.params.userKey
      try {
        const find_mem = await findMemUser(userKey);

        if(!find_mem) {
          new ResponseManager(ctx).error("Invalid userkey", 404);
          return;
        }

        new ResponseManager(ctx).success(find_mem);
      } catch (err) {
        this.debug(err.message + "get usage memory fail");
        new ResponseManager(ctx).error("get usage memory fail", 500);
      }
    })

    this.router.put(this.api_v1 + "/update/max-memory", authMiddlewareAdmin, async (ctx, next) => {
      let userKey = ctx.request.body.userKey
      let limit_mem = ctx.request.body.limit_mem
      try {
        const find_mem = await updateLimitMem(userKey, limit_mem);

        if(!find_mem) {
          new ResponseManager(ctx).error("Invalid userkey", 404);
          return;
        }

        new ResponseManager(ctx).success(null,"update limit memmory success.");
      } catch (err) {
        this.debug(err.message + "update limit memory fail");
        new ResponseManager(ctx).error("update limit memory fail", 500);
      }
    })

    this.router.put(this.api_v1 + "/get/memmory", async (ctx, next) => {
      let userKey = ctx.request.body.userKey
      let usage_mem = ctx.request.body.usage_mem
      try {
        const find_mem = await updateMemUser(userKey, usage_mem);

        if(!find_mem) {
          new ResponseManager(ctx).error("Invalid userkey", 404);
          return;
        }

        new ResponseManager(ctx).success(null,"update usage memmory success.");
      } catch (err) {
        this.debug(err.message + "update usage memory fail");
        new ResponseManager(ctx).error("update usage memory fail", 500);
      }
    })
  }

  newApi() {
    // api admin
    this.router.get(
      this.api_v1 + "/get_client_tunnel",
      authMiddlewareAdmin,
      async (ctx, next) => {
        // const getClient = await this.manager.getClientRegis();
        const user_link = await getUserLink();
        // console.log(user_link);
        const all = [];
        user_link.forEach((element) => {
          element.link_users.forEach((e) => {
            all.push({
              link_id : e.id,
              name: element.name,
              userKey: element.userKey,
              subdomain: e.subdomain,
              local_port:e.local_port,
              tcp_port: e.tcp_port,
              ssh_port: e.ssh_port,
              url: e.url,
              email: element.email,
              createdAt: e.createdAt,
            });
          });
        });
        new ResponseManager(ctx).success(
          { client_all: all },
          "Get client success."
        );
        // ctx.body = {
        //   all_client: all,
        // };
      }
    );

    // api admin
    this.router.delete(
      this.api_v1 + "/del_client/:client",
      authMiddlewareAdmin,
      async (ctx, next) => {
        const clientId = ctx.params.client;
        this.manager.removeClient(clientId);
        this.debug(clientId);
        new ResponseManager(ctx).success(clientId, "Delete success.");
      }
    );

    this.router.post(
      this.api_v1 + "/refresh",
      jwtRefreshTokenValidateAdmin,
      async (ctx, next) => {
        const args = ctx.state.admin || {};
        // this.debug(args);
        const { email } = args;
        try {
          const user_con = await getNewTokenAdmin(email);

          if (!user_con) {
            new ResponseManager(ctx).error("Invalid email", 404);
            return;
          }

          const { admin, access_token, refresh_token } = user_con;
          const data_body = {
            user: {
              id: admin.id,
              email: admin.email,
              fullname: admin.fullname,
            },
            access_token,
            refresh_token,
          };

          new ResponseManager(ctx).success(data_body, "Login successfully");
        } catch (error) {
          console.error("login fail", error.message);
          new ResponseManager(ctx).error("login fail", 500);
        }
      }
    );

    // api admin
    this.router.post(this.api_v1 + "/signup", async (ctx, next) => {
      const body = ctx.request.body;

      if (
        !body.username ||
        !body.password ||
        !body.email ||
        !body.fullname ||
        !body.confirm_password
      ) {
        new ResponseManager(ctx).error(
          "username, password, confirm_password, email or fullname are required",
          400
        );
        return;
      }

      if (body.password !== body.confirm_password) {
        new ResponseManager(ctx).error(
          "password and confirm_password are not the same.",
          400
        );
        return;
      }

      try {
        const signup = await signupAdmin(body);

        if (typeof signup == "string") {
          new ResponseManager(ctx).error(
            signup,
            400
          );
          return;
        }

        new ResponseManager(ctx).success(signup.auth_2fa, "Signup new admin success.");
      } catch (error) {
        console.error("Signup fail", error.message);
        new ResponseManager(ctx).error("Signup fail", 500);
      }
    });

    // api admin
    this.router.post(this.api_v1 + "/signin", async (ctx, next) => {
      const args = ctx.request.body || {};
      // this.debug(args);
      const { username, password } = args;
      try {
        const user_con = await getTokenAdmin(username, password);

        if (!user_con) {
          new ResponseManager(ctx).error("Invalid username or password", 404);
          return;
        }

        const { admin, access_token, refresh_token } = user_con;
        const data_body = {
          user: {
            id: admin.id,
            email: admin.email,
            fullname: admin.fullname,
          },
          access_token,
          refresh_token,
        };

        new ResponseManager(ctx).success(data_body, "Login successfully");
      } catch (error) {
        console.error("login fail", error.message);
        new ResponseManager(ctx).error("login fail", 500);
      }
    });

    this.router.post(this.api_v1 + "/2fa", async (ctx, next) => {
      const args = ctx.request.body || {};
      // console.log(args);
      const check_auth_2fa = args.auth_2fa
      const secret = await checkAdmin(args.email);

      const auth_2fa = verifyTwofactor(secret.auth_2fa)

      if(auth_2fa === check_auth_2fa){
        new ResponseManager(ctx).success(args, "2fa verify successfully");
      }else{
        new ResponseManager(ctx).error("2fa verify fail", 400);
      }
    })

    // api create user (ใช้เส้น /auth/login แทน)
    this.router.post(this.api_v1 + "/create_client", async (ctx, next) => {
      const args = ctx.request.body || {};
      const data = await createUser(args);
      this.debug(args);
      if (data.success) {
        this.debug("createUser success");
        new ResponseManager(ctx).success(data);
        // ctx.body = { success: true, msg: data.msg };
      } else {
        this.debug(data.msg + " createUser fail");
        new ResponseManager(ctx).error("createUser fail", 500);
        // ctx.body = { success: false, msg: data.msg };
      }
    });

    // api user
    this.router.post(
      this.api_v1 + "/get_key",
      authMiddleware,
      async (ctx, next) => {
        const args = ctx.request.body || {};
        const data = await checkKey(args, "get_key");
        // this.debug(args);
        new ResponseManager(ctx).success(data);
      }
    );

    this.router.delete(
      this.api_v1 + "/user/del_client/:client",
      authMiddleware,
      async (ctx, next) => {
        const clientId = ctx.params.client;
        try {
          this.manager.removeClient(clientId);
          this.debug(clientId);
          new ResponseManager(ctx).success(clientId, "Delete success.");
        } catch(error) {
          console.error("delete fail", error.message);
          new ResponseManager(ctx).error("delete fail", 500);
        }
      }
    );
  }

  // api default
  api_default() {
    this.router.get("/api/status", authMiddlewareAdmin, async (ctx, next) => {
      const stats = this.manager.stats;

      const memoryUsage = process.memoryUsage();
      const memoryInMB = {
        rss: parseFloat((memoryUsage.rss / (1024 * 1024)).toFixed(2)),
        heapTotal: parseFloat(
          (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2)
        ),
        heapUsed: parseFloat((memoryUsage.heapUsed / (1024 * 1024)).toFixed(2)),
        external: parseFloat((memoryUsage.external / (1024 * 1024)).toFixed(2)),
        arrayBuffers: parseFloat(
          (memoryUsage.arrayBuffers / (1024 * 1024)).toFixed(2)
        ),
      };

      const disk = await getDisk();
      const swap = await getSwap();
      const mem = getMemory();
      const cpus = os.cpus();

      const data = {
        tunnels: stats.tunnels,
        mem: memoryInMB,
        cpu: cpus,
        cpu_num_core: cpus.length,
        memory: {
          memtotal: mem[0],
          mamfree: mem[1],
          mamuse: parseFloat((mem[0] - mem[1]).toFixed(2)),
        },
        swap: swap,
        disk: disk,
      };

      // console.log(data);

      new ResponseManager(ctx).success(data, "Get monitor success.");
    });

    this.router.get("/api/tunnels/:id/status", async (ctx, next) => {
      const clientId = ctx.params.id;
      const client = this.manager.getClient(clientId);
      if (!client) {
        ctx.throw(404);
        return;
      }

      const stats = client.stats();
      ctx.body = {
        connected_sockets: stats.connectedSockets,
      };
    });
  }

  // api default
  client_connect(schema) {
    this.router.post("/connect_client", async (ctx, next) => {
      const args = ctx.request.body || {};
      console.log("req:");
      console.log(args);
      
      const check_key = await checkKey(args.user, "check_key");
      if (check_key == null) {
        this.debug("client token key not found");
        ctx.status = 200;
        ctx.body = {
          message: "Invalid or Missing Token",
          result: false,
        };
        return;
      } 

      const check_url = await checkKey(args.user, "check_url");      
      if (check_url != null) {
        this.debug("This token over limite.");
        ctx.status = 200;
        ctx.body = {
          message: "This token over limite.",
          result: false,
        };
        return;
      } 

      if (args.sub_domain !== "?new") {
        const reqId = args.sub_domain;
        // limit requested hostnames to 63 characters
        if (
          !/^(?:[a-z0-9][a-z0-9\-]{4,63}[a-z0-9]|[a-z0-9]{4,63})$/.test(reqId)
        ) {
          const msg =
            "Invalid subdomain. Subdomains must be lowercase and between 4 and 63 alphanumeric characters.";
          ctx.status = 403;
          ctx.body = {
            message: msg,
          };
          // console.log(msg);
          return;
        }

        this.debug("-- สำหรับ client set subdomain มา --");
        this.debug('making new client with id "%s"', reqId);
        const info = await this.manager.newClient(reqId);
        if (info.id == "already exist") {
          ctx.status = 200;
          ctx.body = {
            message: info.id,
            result: false,
            id: reqId,
          };
          this.debug(reqId, " ", info.id);
          return;
        }
        const url = schema + "://" + info.id + "." + ctx.request.host;
        info.url = url;
        info.ssh_port = args.user.ssh_port
        ctx.body = info;
        this.debug("-- url ที่ส่งไปยัง client ใช้งาน ", url);
        // clients_url = clients_url.filter(client => client.id !== info.id);
        // clients_url.push(info);
        console.log("res:");
        console.log(info);
        await addUserLink(info, check_key.id);

        // this.manager.setClientRegis(info)
        return;
      }

      if (args.sub_domain === "?new") {
        const reqId = hri.random();
        this.debug("-- สำหรับ server random subdomain มา --");
        this.debug('making new client with id "%s"', reqId);
        const info = await this.manager.newClient(reqId);

        const url = schema + "://" + info.id + "." + ctx.request.host;
        info.url = url;
        info.ssh_port = args.user.ssh_port
        ctx.body = info;
        console.log("res:");
        console.log(info);
        // this.manager.setClientRegis(info)
        await addUserLink(info, check_key.id);
        return;
      }
      ctx.redirect(landingPage);
    });
  }
}

module.exports = ApiManagement;
