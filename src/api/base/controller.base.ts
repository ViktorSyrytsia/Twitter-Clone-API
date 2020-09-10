import { injectable } from 'inversify';
import { Response } from 'express';
import { BaseHttpController } from 'inversify-express-utils';

import { HttpError } from '../../shared/models/http.error';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';

@injectable()
export abstract class ControllerBase extends BaseHttpController {
    protected _success<T extends Object>(res: Response, code: number, json: T) {
        return res.status(code).json({
            status: 'ok',
            ...json
        });
    }

    protected _fail(res: Response, httpError: HttpError) {
        return res.status(httpError.code).json({
            status: 'failed',
            code: httpError.code,
            message: httpError.message
        });
    }
}
