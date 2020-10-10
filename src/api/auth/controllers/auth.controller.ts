import {
    controller,
    httpPost,
    request,
    requestBody,
    response,
    requestParam,
    principal,
    requestHeaders,
    httpGet,
} from 'inversify-express-utils';
import { Request, Response } from 'express';
import {
    ApiPath,
    ApiOperationPost,
    ApiOperationGet,
} from 'swagger-express-typescript';

import { ControllerBase } from '../../base/controller.base';
import { AuthService } from '../services/auth.service';
import { UserWithToken } from '../models/user.with.token.model';
import { SignInCredentials } from '../models/sign.in.credentials.model';
import { SignUpCredentials } from '../models/sign.up.credentials.model';
import { Principal } from '../models/principal.model';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { UploadedFile } from 'express-fileupload';

@ApiPath({
    path: '/api/v1/auth',
    name: 'Auth',
})
@controller('/auth')
export class AuthController extends ControllerBase {
    constructor(private _authService: AuthService) {
        super();
    }

    @ApiOperationPost({
        summary: 'Sign Up',
        path: '/sign-up',
        parameters: {
            formData: {
                firstName: {
                    type: 'string',
                    required: true,
                    allowEmptyValue: false,
                },
                lastName: {
                    type: 'string',
                    required: true,
                    allowEmptyValue: false,
                },
                username: {
                    type: 'string',
                    required: true,
                    allowEmptyValue: false,
                },
                email: {
                    type: 'string',
                    required: true,
                    allowEmptyValue: false,
                },
                password: {
                    type: 'string',
                    required: true,
                    allowEmptyValue: false,
                    description: 'Valid passwords are at least 6 characters long, contain numbers, uppercase and lowercase letters',
                },
                file: {
                    type: 'file',
                    description: 'Profile picture (optional)',
                    allowEmptyValue: false,
                    required: false,
                },
            },
        },
        responses: {
            200: {
                description: 'Sends verification link to specified email',
            },
            409: {
                model: 'HttpError',
                description:
                    'This email already exists | This username already exists',
            },
            422: {
                model: 'HttpError',
                description:
                    '{fieldName} should not be empty | Wrong email format | Password must be at least 6 characters long, contain numbers, uppercase and lowercase letters',
            },
        },
    })
    @httpPost('/sign-up')
    public async signUp(
        @requestBody() credentials: SignUpCredentials,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            await this._authService.signUp({
                ...credentials,
                ...((req.files) && {file: req.files.file as UploadedFile})
            });
            return this._success(res, 200);
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        summary: 'Sign In',
        path: '/sign-in',
        parameters: {
            formData: {
                emailOrUsername: {
                    type: 'string',
                    required: true,
                    allowEmptyValue: false,
                },
                password: {
                    type: 'string',
                    required: true,
                    allowEmptyValue: false,
                },
            }
        },
        responses: {
            200: {
                model: 'UserWithToken',
                description: 'Returns user with jwt tokens',
            },
            417: {
                model: 'HttpError',
                description: 'User doesn\'t exist or password doesn\'t match',
            },
            422: {
                model: 'HttpError',
                description: 'emailOrUsername should not be empty | Password must be at least 6 characters long, contain numbers, uppercase and lowercase letters',
            },
        },
    })
    @httpPost('/sign-in')
    public async signIn(
        @requestBody() credentials: SignInCredentials,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const userWithToken: UserWithToken = await this._authService.signIn(
                credentials
            );
            return this._success<UserWithToken>(res, 200, userWithToken);
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        summary: 'Email verification',
        path: '/confirm-email/{token}',
        parameters: {
            path: {
                token: {
                    name: 'token',
                    description: 'Email confirmation token',
                    required: true,
                },
            },
        },
        responses: {
            200: {
                model: 'UserWithToken',
                description: 'Returns user with jwt tokens',
            },
            417: {
                model: 'HttpError',
                description: 'Token is broken or expired',
            },
        },
    })
    @httpPost('/confirm-email/:token')
    public async confirmEmail(
        @requestParam('token') token: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const userWithToken: UserWithToken = await this._authService.confirmEmail(
                token
            );
            return this._success<UserWithToken>(res, 200, userWithToken);
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        security: {
            apiKeyHeader: [],
        },
        parameters: {},
        summary: 'Resend verification link',
        path: '/resend-confirm-email',
        description: 'In case if original link expires (5m lifetime). x-auth-token header required.',
        responses: {
            200: {
                description: 'Sends new verification link to user\'s email',
            },
            401: {
                model: 'HttpError',
                description: 'Unauthorized',
            },
            404: {
                model: 'HttpError',
                description: 'User not found',
            },
            409: {
                model: 'HttpError',
                description: 'User already activated',
            },
        },
    })
    @httpPost('/resend-confirm-email', AuthMiddleware)
    public async resendConfirmEmail(
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            await this._authService.resendConfirmEmail(principal);
            return this._success(res, 200);
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationGet({
        security: {
            apiRefreshKeyHeader: [],
        },
        summary: 'Refresh access token',
        path: '/refresh-access-token',
        description: 'x-refresh-token header is required',
        responses: {
            200: {
                model: 'UserWithToken',
                description: 'Returns user with jwt tokens',
            },
            403: {
                model: 'HttpError',
                description: 'Refresh token is broken or expired',
            },
        },
    })
    @httpGet('/refresh-access-token')
    public async refreshAccessToken(
        @request() req: Request,
        @response() res: Response,
        @requestHeaders('x-refresh-token') refreshToken: string
    ): Promise<Response> {
        try {
            const userWithToken: UserWithToken = await this._authService.refreshAccessToken(
                refreshToken
            );
            return this._success(res, 200, userWithToken);
        } catch (error) {
            return this._fail(res, error);
        }
    }
}
