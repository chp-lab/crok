import log from 'book';
import Koa from 'koa';
import tldjs from 'tldjs';
import Debug from 'debug';
import http, { request } from 'http';
import { hri } from 'human-readable-ids';
import Router from 'koa-router';
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
import serve from 'koa-static';
import ClientManager from './lib/ClientManager';
import fs from 'fs';
import path from 'path';
// const dotenv = require('dotenv').config();
const debug = Debug('localtunnel:server');

export default function (opt) {
    opt = opt || {};


    const validHosts = (opt.domain) ? [opt.domain] : undefined;
    const myTldjs = tldjs.fromUserSettings({ validHosts });
    // const landingPage = opt.landing || 'https://localtunnel.github.io/www/';
    const landingPage = opt.landing || 'https://src.n-ix.com/uploads/2023/07/19/3f30c411-699e-48e9-9939-5bf6f2d00239.svg';

    function GetClientIdFromHostname(hostname) {
        return myTldjs.getSubdomain(hostname);
    }

    const manager = new ClientManager(opt);

    const schema = opt.secure ? 'https' : 'http';

    const app = new Koa();
    const router = new Router();

    app.use(bodyParser())
    app.use(cors());
    app.use(router.routes());
    app.use(router.allowedMethods());
    app.use(serve(path.join(__dirname, 'public')));


    router.get('/api/status', async (ctx, next) => {
        const stats = manager.stats;
        ctx.body = {
            tunnels: stats.tunnels,
            mem: process.memoryUsage()
        };
    });

    // --------------------------------------------------------------------------------------------
    router.get('/api/v1/get_client', async (ctx, next) => {
        const getClient = await manager.getClientRegis();
        ctx.body = {
            client: getClient
        };
    });

    router.delete('/api/v1/del_client/:client', async (ctx, next) => {
        const clientId = ctx.params.client
        manager.removeClient(clientId);
        console.log(clientId);

        ctx.body = {
            msg: 'ok',
            data: clientId
        };
    });

    router.get('/dashboard', async (ctx, next) => {
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

    router.get('/dashboard/login', async (ctx, next) => {
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

    router.post('/login', async (ctx, next) => {
        const args = ctx.request.body || {}
        console.log(args);


        const { username, password } = args;
        if (username == process.env.USER_NAME && password == process.env.PASS_WORD) {
            ctx.body = { success: true, user: process.env.USER_NAME };
        } else {
            ctx.body = { success: false, user: '' };
        }
    })

    // --------------------------------------------------------------------------------------------
    router.get('/api/tunnels/:id/status', async (ctx, next) => {
        const clientId = ctx.params.id;
        const client = manager.getClient(clientId);
        if (!client) {
            ctx.throw(404);
            return;
        }

        const stats = client.stats();
        ctx.body = {
            connected_sockets: stats.connectedSockets,
        };
    });

    // root endpoint
    // สำหรับ server random subdomain มา
    app.use(async (ctx, next) => {
        const path = ctx.request.path;

        // skip anything not on the root path
        if (path !== '/') {
            await next();
            return;
        }

        const isNewClientRequest = ctx.query['new'] !== undefined;
        if (isNewClientRequest) {
            const reqId = hri.random();
            console.log("-- สำหรับ server random subdomain มา --")
            debug('making new client with id "%s"', reqId);
            const info = await manager.newClient(reqId);

            const url = schema + '://' + info.id + '.' + ctx.request.host;
            info.url = url;
            ctx.body = info;
            console.log(info)
            manager.setClientRegis(info)
            return;
        }

        // no new client request, send to landing page
        ctx.redirect(landingPage);
    });

    // anything after the / path is a request for a specific client name
    // This is a backwards compat feature
    // สำหรับ client set subdomain มา
    // อะไรก็ตามหลังเส้นทาง / คือ subdomain
    app.use(async (ctx, next) => {
        const parts = ctx.request.path.split('/');
        if (parts[1].includes('dashboard')) {
            await next();
            return
        }

        // any request with several layers of paths is not allowed
        // rejects /foo/bar
        // allow /foo
        if (parts.length !== 2) {
            await next();
            return;
        }
        const reqId = parts[1];

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
        const info = await manager.newClient(reqId);
        if (info.id == 'already exist') {
            ctx.status = 403;
            ctx.body = {
                message: info.id,
                id: reqId,
            };
            console.log(reqId, ' ', info.id);
            return;
        }
        const url = schema + '://' + info.id + '.' + ctx.request.host;
        info.url = url;
        ctx.body = info;
        console.log("-- url ที่ส่งไปยัง client ใช้งาน ", url);
        // clients_url = clients_url.filter(client => client.id !== info.id);
        // clients_url.push(info);
        manager.setClientRegis(info)
        return;
    });

    app.use(async (ctx, next) => {
        await next(); // เรียกใช้งาน Middleware ถัดไป
        if (ctx.status === 404) {
            try {
                const filePath = path.join(__dirname, 'views', '404.html'); // กำหนดที่อยู่ของไฟล์ 404
                const html = await fs.promises.readFile(filePath, 'utf-8'); // อ่านไฟล์ HTML
    
                ctx.type = 'html'; // กำหนด type เป็น HTML
                ctx.body = html;   // ส่งไฟล์ HTML ไปยัง body
            } catch (err) {
                ctx.status = 500;
                ctx.body = 'Error loading the 404 page';
            }
        }
    });

    const server = http.createServer();

    const appCallback = app.callback();

    server.on('request', (req, res) => {
        // without a hostname, we won't know who the request is for
        const hostname = req.headers.host;
        if (!hostname) {
            res.statusCode = 400;
            res.end('Host header is required');
            return;
        }

        const clientId = GetClientIdFromHostname(hostname);
        if (!clientId) {
            appCallback(req, res);
            return;
        }

        const client = manager.getClient(clientId);
        if (!client) {
            res.statusCode = 404;
            res.end('404');
            return;
        }

        client.handleRequest(req, res);
    });

    server.on('upgrade', (req, socket, head) => {
        const hostname = req.headers.host;
        if (!hostname) {
            socket.destroy();
            return;
        }

        const clientId = GetClientIdFromHostname(hostname);
        if (!clientId) {
            socket.destroy();
            return;
        }

        const client = manager.getClient(clientId);
        if (!client) {
            socket.destroy();
            return;
        }

        client.handleUpgrade(req, socket);
    });

    return server;
};
