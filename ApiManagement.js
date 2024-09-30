import fs from 'fs';
import path from 'path';
import Debug from 'debug';
const debug = Debug('localtunnel:server');
import { checkAdmin } from "./src/controllers/AdminController"
import { getUserLink, createUser } from "./src/controllers/UserController"


class ApiManagement {
    constructor(router, manager) {
        this.router = router
        this.manager = manager
        this.api_v1 = '/api/v1'
    }

    dashboard() {
        this.router.get('/dashboard', async (ctx, next) => {
            try {
                const filePath = path.join(__dirname, 'views', 'dashboard.html');
                const html = await fs.promises.readFile(filePath, 'utf-8'); // อ่านไฟล์ HTML

                ctx.type = 'html'; // กำหนด type เป็น HTML
                ctx.body = html;   // ส่งไฟล์ HTML ไปยัง body
            } catch (err) {
                ctx.status = 500;
                ctx.body = 'Error loading the page';
            }
        })

        this.router.get('/dashboard/login', async (ctx, next) => {
            try {
                const filePath = path.join(__dirname, 'views', 'login.html');
                const html = await fs.promises.readFile(filePath, 'utf-8'); // อ่านไฟล์ HTML

                ctx.type = 'html'; // กำหนด type เป็น HTML
                ctx.body = html;   // ส่งไฟล์ HTML ไปยัง body
            } catch (err) {
                ctx.status = 500;
                ctx.body = 'Error loading the page';
            }
        })
    }

    newApi() {
        this.router.get(this.api_v1 + '/get_client', async (ctx, next) => {
            // const getClient = await this.manager.getClientRegis();
            const user_link = await getUserLink()
            // console.log(user_link);
            const all = []
            user_link.forEach(element => {
                element.link_users.forEach(e => {
                    all.push({
                        name:element.name,
                        userKey:element.userKey,
                        subdomain:e.subdomain,
                        tcp_port:e.tcp_port,
                        url:e.url,
                        email:element.email,
                        createdAt:e.createdAt
                    })
                })
            });

            ctx.body = {
                all_client: all
            };
        });

        this.router.delete(this.api_v1 + '/del_client/:client', async (ctx, next) => {
            const clientId = ctx.params.client
            this.manager.removeClient(clientId);
            console.log(clientId);

            ctx.body = {
                msg: 'ok',
                data: clientId
            };
        });

        this.router.post(this.api_v1 + '/login', async (ctx, next) => {
            const args = ctx.request.body || {}
            console.log(args);
            const { username, password } = args;
            const user_con = await checkAdmin(username, password)

            // console.log("user:", user_con);

            // if (username == process.env.USER_NAME && password == process.env.PASS_WORD) {
            if (user_con !== null) {
            // if(true){
                ctx.body = { success: true, user: user_con.fullname };
            } else {
                ctx.body = { success: false, user: '' };
            }
        })
    }

    api_default() {
        this.router.get('/api/status', async (ctx, next) => {
            const stats = this.manager.stats;
            ctx.body = {
                tunnels: stats.tunnels,
                mem: process.memoryUsage()
            };
        });

        this.router.get('/api/tunnels/:id/status', async (ctx, next) => {
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
        this.router.post('/connect_client', async (ctx, next) => {
            const args = ctx.request.body || {}
            console.log(args);
            if (args.sub_domain !== '?new') {
                const reqId = args.sub_domain;
                // limit requested hostnames to 63 characters
                if (! /^(?:[a-z0-9][a-z0-9\-]{4,63}[a-z0-9]|[a-z0-9]{4,63})$/.test(reqId)) {
                    const msg = 'Invalid subdomain. Subdomains must be lowercase and between 4 and 63 alphanumeric characters.';
                    ctx.status = 403;
                    ctx.body = {
                        message: msg,
                    };
                    // console.log(msg);
                    return;
                }

                console.log("-- สำหรับ client set subdomain มา --")
                debug('making new client with id "%s"', reqId);
                const info = await this.manager.newClient(reqId);
                if (info.id == 'already exist') {
                    ctx.status = 200;
                    ctx.body = {
                        message: info.id,
                        id: reqId,
                    };
                    console.log(reqId, ' ', info.id);
                    return;
                }
                const url = schema + '://' + info.id + '.' + ctx.request.host;
                info.url = url;
                info.user = args.user
                ctx.body = info;
                console.log("-- url ที่ส่งไปยัง client ใช้งาน ", url);
                // clients_url = clients_url.filter(client => client.id !== info.id);
                // clients_url.push(info);
                // console.log(info);
                await createUser(info)
                
                // this.manager.setClientRegis(info)
                return;
            }


            if (args.sub_domain === '?new') {
                const reqId = hri.random();
                console.log("-- สำหรับ server random subdomain มา --")
                debug('making new client with id "%s"', reqId);
                const info = await this.manager.newClient(reqId);

                const url = schema + '://' + info.id + '.' + ctx.request.host;
                info.url = url;
                info.user = args.user
                ctx.body = info;
                console.log(info)
                await createUser(info)
                // this.manager.setClientRegis(info)
                return;
            }
            ctx.redirect(landingPage);
        })
    }

}

module.exports = ApiManagement;
