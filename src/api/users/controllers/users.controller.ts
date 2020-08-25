import { Request, Response } from 'express';
import { controller, httpGet, principal, queryParam, request, response, } from 'inversify-express-utils';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';

import { ControllerBase } from '../../base/controller.base';
import { Principal } from '../../auth/models/principal.model';
import { UsersService } from '../services/users.service';
import { DocumentUser } from '../models/user.model';
import { HttpError } from '../../../shared/models/http.error';

@controller('/users')
export class UsersController extends ControllerBase {

    constructor(
        private _userService: UsersService
    ) {
        super();
    }

    @httpGet('/')
    public async findUsers(
        @principal() user: Principal,
        @queryParam('search') search: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const users: DocumentUser[] = await this._userService.findUsersBySearchOrAll(search);
            return this._success<{ users: DocumentUser[] }>(res, 200, { users });
        } catch (error) {
            return this._fail(res, new HttpError(INTERNAL_SERVER_ERROR, error.message));
        }
    }

}
