import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { createServer, Server } from 'http';
import { InversifyExpressServer } from 'inversify-express-utils';

if (!process.env.IS_PRODUCTION) {
    dotenv.config({
        path: '.env.dev',
    });
}

import { App } from './app';
import { AppModule } from './app.module';
import { AuthProvider } from './api/auth/providers/auth.provider';
import { WebSocketController } from './api/chat/controllers/websocket.controller';

const app: App = AppModule.get(App);
const websocket: WebSocketController = AppModule.get(WebSocketController);

const inversifyExpressServer: InversifyExpressServer = new InversifyExpressServer(
    AppModule,
    null,
    { rootPath: '/api/v1' },
    app.app,
    AuthProvider
);

const express: Express.Application = inversifyExpressServer.build();
const httpServer: Server = createServer(express);

websocket.listenSocket(httpServer);
httpServer.listen(app.port);
console.log(`Server started on port: ${app.port}`);
