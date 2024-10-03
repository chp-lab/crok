import fs from "fs";
import path from "path";
import Debug from "debug";
import { checkAdmin } from "./src/controllers/AdminController";
import { hri } from "human-readable-ids";
import {
  getUserLink,
  addUserLink,
  getAllUser,
  checkKey,
  createUser,
} from "./src/controllers/UserController";

class ApiManagement {
  constructor(router, manager) {
    this.router = router;
    this.manager = manager;
    this.api_v1 = "/api/v1";
    this.debug = Debug("localtunnel:DebugApi");
  }

  dashboard() {
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
    this.router.get(this.api_v1 + "/get_client_tunnel", async (ctx, next) => {
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

      ctx.body = {
        all_client: all,
      };
    });

    this.router.delete(
      this.api_v1 + "/del_client/:client",
      async (ctx, next) => {
        const clientId = ctx.params.client;
        this.manager.removeClient(clientId);
        this.debug(clientId);

        ctx.body = {
          msg: "ok",
          data: clientId,
        };
      }
    );

    this.router.post(this.api_v1 + "/login", async (ctx, next) => {
      const args = ctx.request.body || {};
      this.debug(args);
      const { username, password } = args;
      const user_con = await checkAdmin(username, password);

      // console.log("user:", user_con);

      // if (username == process.env.USER_NAME && password == process.env.PASS_WORD) {
      if (user_con !== null) {
        // if(true){
        ctx.body = { success: true, user: user_con.fullname };
      } else {
        ctx.body = { success: false, user: "" };
      }
    });

    this.router.post(this.api_v1 + "/create_client", async (ctx, next) => {
      const args = ctx.request.body || {};
      const data = await createUser(args);
      this.debug(args);
      if (data.success) {
        this.debug("createUser success");
        ctx.body = { success: true, msg: data.msg };
      } else {
        this.debug(data.msg + " createUser fail");
        ctx.body = { success: false, msg: data.msg };
      }
    });

    this.router.post(this.api_v1 + "/get_key", async (ctx, next) => {
      const args = ctx.request.body || {};
      const data = await checkKey(args, "get_key");
      this.debug(args);
      ctx.body = { success: true, msg: data };
    });
  }

  api_default() {
    this.router.get("/api/status", async (ctx, next) => {
      const stats = this.manager.stats;
      ctx.body = {
        tunnels: stats.tunnels,
        mem: process.memoryUsage(),
      };
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
