import { controller, httpPost, request, requestBody, response, } from 'inversify-express-utils';
import { Request, Response } from 'express';

import { ControllerBase } from '../../base/controller.base';
import { AuthService } from '../services/auth.service';
import { Credentials } from '../interfaces/credentials.interface';
import { UserWithTokenResponse } from '../interfaces/user-with-token-response.interface';

@controller('/auth')
export class AuthController extends ControllerBase {

    constructor(
        private _authService: AuthService
    ) {
        super();
    }

    @httpPost('/')
    public async signUp(
        @requestBody() credentials: Credentials,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const userWithToken: UserWithTokenResponse = await this._authService.signUp(credentials);
            return this._success<{ userWithToken: UserWithTokenResponse }>(res, 200, { userWithToken });
        } catch (error) {
            return this._fail(res, error);
        }
    }

}
