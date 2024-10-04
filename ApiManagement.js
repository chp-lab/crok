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
} from "./src/controllers/UserController";

import os from "os";

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
        this.debug(args);
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
          "Username, password, confirm_password, email or fullname are required",
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

        if (!signup) {
          new ResponseManager(ctx).error(
            "email or username is dubplicate.",
            400
          );
          return;
        }

        new ResponseManager(ctx).success(null, "Signup new admin success.");
      } catch (error) {
        console.error("Signup fail", error.message);
        new ResponseManager(ctx).error("Signup fail", 500);
      }
    });

    // api admin
    this.router.post(this.api_v1 + "/signin", async (ctx, next) => {
      const args = ctx.request.body || {};
      this.debug(args);
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
        this.debug(args);
        new ResponseManager(ctx).success(data);
      }
    );
  }

  // api default
  api_default() {
    this.router.get("/api/status", authMiddlewareAdmin, async (ctx, next) => {
      const stats = this.manager.stats;
      var swap = {};
      fs.readFile("/proc/meminfo", "utf8", (err, data) => {
        if (err) {
          // console.error("Error reading /proc/meminfo:", err);
          // return;
        } else {
          // แยกบรรทัดต่าง ๆ
          const lines = data.split("\n");

          // ค้นหาบรรทัดที่มีข้อมูล Swap
          const swapTotalLine = lines.find((line) =>
            line.startsWith("SwapTotal")
          );
          const swapFreeLine = lines.find((line) =>
            line.startsWith("SwapFree")
          );

          if (swapTotalLine && swapFreeLine) {
            // แปลงค่าที่ได้จากบรรทัดเป็นตัวเลขหน่วย KB
            const swapTotal = parseInt(
              swapTotalLine.split(":")[1].trim().split(" ")[0],
              10
            );
            const swapFree = parseInt(
              swapFreeLine.split(":")[1].trim().split(" ")[0],
              10
            );

            // คำนวณ Swap ที่ใช้งานอยู่
            const swapUsed = swapTotal - swapFree;
            swap = {
              total_swap: (swapTotal / (1024 * 1024)).toFixed(2),
              free_swap: (swapFree / (1024 * 1024)).toFixed(2),
              use_swap: (swapUsed / (1024 * 1024)).toFixed(2),
            };
          } else {
            console.error("Swap information not found in /proc/meminfo");
          }
        }
      });

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
      const cpus = os.cpus();
      const mamTotal = parseFloat(
        (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)
      );
      const mamFree = parseFloat(
        (os.freemem() / (1024 * 1024 * 1024)).toFixed(2)
      );
      const data = {
        tunnels: stats.tunnels,
        mem: memoryInMB,
        cpu: cpus,
        cpu_num_core: cpus.length,
        memory: {
          memtotal: mamTotal,
          mamfree: mamFree,
          mamuse: parseFloat((mamTotal - mamFree).toFixed(2)),
        },
        swap: swap,
      };
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
        debug('making new client with id "%s"', reqId);
        const info = await this.manager.newClient(reqId);

        const url = schema + "://" + info.id + "." + ctx.request.host;
        info.url = url;
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
