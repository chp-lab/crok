import log from 'book';
import Koa from 'koa';
import tldjs from 'tldjs';
// import Debug from 'debug';
import http, { request } from 'http';
// import { hri } from 'human-readable-ids';
import Router from 'koa-router';
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
import serve from 'koa-static';
import ClientManager from './lib/ClientManager';
import fs from 'fs';
import path from 'path';
// const dotenv = require('dotenv').config();
// const debug = Debug('localtunnel:server');
const ApiManagement = require('./ApiManagement');
const System = require("./src/routes/system")

import sequelize from "./src/db/database"
import initModels from './src/model/MapModel';
import { emptyTable } from "./src/controllers/UserController"

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

    const api = new ApiManagement(router, manager);
    api.dashboard()
    api.newApi()
    api.authentication()
    api.api_default()
    api.client_connect(schema)

    const apiSys = new System(router, manager);
    apiSys.systemInfo()

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

    try {
        initModels(sequelize)
        // sequelize.sync({ force: false });
        sequelize.sync({ alter: true });
        console.log("Database Synced")
        // drop the table if it already exists
        // sequelize.sync({ force: true }).then(() => {
        //     console.log("Drop and re-sync db.");
        // });
        // emptyTable()
        
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }

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
