import * as express from 'express';
import * as cors from 'cors';
import { injectable } from 'inversify';

@injectable()
export class App {
    public get app(): express.Express {
        return this._app;
    }

    public get port(): number {
        return this._port;
    }

    private readonly _app: express.Express;
    private readonly _port = Number.parseInt(process.env.PORT);

    constructor() {
        this._app = express();
        this._app.use(express.urlencoded({ extended: true }));
        this._app.use(express.json());
        this._app.use(cors());
    }
}
