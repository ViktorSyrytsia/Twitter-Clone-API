import { controller, httpPost, request, requestBody, response, requestParam } from 'inversify-express-utils';
import { Request, Response } from 'express';

import { ControllerBase } from '../../base/controller.base';
import { AuthService } from '../services/auth.service';
import { FullCredentials, Credentials } from '../models/requests.models';
import { ApiPath, ApiOperationPost } from 'swagger-express-typescript';
import { UserWithToken } from '../models/userWithToken.model';


@ApiPath({
    path: '/api/v1/auth',
    name: 'Auth',
    security: {
        apiKeyHeader: []
    },
})
@controller('/auth')
export class AuthController extends ControllerBase {

    constructor(
        private _authService: AuthService
    ) {
        super();
    }

    @ApiOperationPost({
        summary: 'Sign Up',
        path: '/sign-up',
        parameters: {
            body: {
                required: true,
                allowEmptyValue: false,
                model: 'FullCredentials',
                description: 'Valid passwords are at least 6 characters long, contain numbers, uppercase and lowercase letters.'
            }
        },
        responses: {
            200: {
                description: '{"status": "ok"}',
            },
            406: {
                model: 'HttpError',
                description: 'This username is already taken.'
            },
            409: {
                model: 'HttpError',
                description: 'This email already exists.'
            },
            422: {
                model: 'HttpError',
                description: 'Wrong json. | Wrong email format. | Password must be at least 6 characters long, contain numbers, uppercase and lowercase letters.'
            }
        },
        security: {
            apiKeyHeader: [],
        }
    })
    @httpPost('/sign-up')
    public async signUp(
        @requestBody() fullCredentials: FullCredentials,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            await this._authService.signUp(fullCredentials);
            return this._success(res, 200, response);
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        summary: 'Email verification page',
        path: '/email/confirm/{token}',
        parameters: {
            query: {
                token: {
                    name: 'token',
                    description: 'Email confirmation token',
                    required: true
                }
            },
        },
        responses: {
            200: {
                model: 'UserWithToken',
                description: 'Returns user with jwt token.'
            },
            417: {
                model: 'HttpError',
                description: 'Token is broken or expired.'
            }
        }
    })
    @httpPost('/email/confirm/:token')
    public async confirmEmail(
        @requestParam('token') token: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const response: UserWithToken = await this._authService.confirmEmail(token);
            return this._success<UserWithToken> (res, 200, response);
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        summary: 'Sign In',
        path: '/sign-in',
        parameters: {
            body: {
                required: true,
                model: 'Credentials',
            }
        },
        responses: {
            200: {
                model: 'UserWithToken',
                description: 'Returns user with jwt token.'
            },
            417: {
                model: 'HttpError',
                description: 'User doesn\'t exist or password doesn\'t match.'
            },
            422: {
                model: 'HttpError',
                description: 'Wrong json.'
            },
            412: {
                model: 'HttpError',
                description: 'User was not activated.'
            }
        }
    })
    @httpPost('/sign-in')
    public async signIn(
        @requestBody() credentials: Credentials,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const response: UserWithToken = await this._authService.signIn(credentials);
            return this._success<UserWithToken> (res, 200, response);
        } catch (error) {
            return this._fail(res, error);
        }
    }
}
