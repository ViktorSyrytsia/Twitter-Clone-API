import { Request, Response } from 'express';
import {
    controller,
    httpGet,
    principal,
    queryParam,
    request,
    response,
    httpDelete,
    httpPut,
    requestParam,
} from 'inversify-express-utils';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import {
    ApiPath,
    ApiOperationGet,
    SwaggerDefinitionConstant,
    ApiOperationDelete,
    ApiOperationPut,
} from 'swagger-express-typescript';

import { ControllerBase } from '../../base/controller.base';
import { Principal } from '../../auth/models/principal.model';
import { UsersService } from '../services/users.service';
import { DocumentUser } from '../models/user.model';
import { HttpError } from '../../../shared/models/http.error';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';

@ApiPath({
    path: '/api/v1/users/',
    name: 'Users',
    security: { apiKeyHeader: [] },
})
@controller('/users')
export class UsersController extends ControllerBase {
    constructor(private _userService: UsersService) {
        super();
    }

    @ApiOperationGet({
        description:
            'Search for user object or list of users objects by search query',
        summary: 'Users search',
        parameters: {
            query: {
                search: {
                    type: 'text',
                    required: false,
                    allowEmptyValue: true,
                    name: 'search',
                    description:
                        'Searching by username/email/firstname/lastname',
                },
            },
        },
        responses: {
            200: {
                description: 'Success /  returns dto with user',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'User',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'User',
            },
            404: {
                description: 'Fail / user not found',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'User',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/')
    public async searchUsers(
        @queryParam('search') search: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const users: DocumentUser[] = await this._userService.findUsersBySearchOrAll(
                search
            );
            return this._success<{ users: DocumentUser[] }>(res, 200, {
                users,
            });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        path: '/current',
        description: 'Get current logged user',
        summary: 'Get current user',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns dto with current user',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            404: {
                description: 'Fail / user not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/current', AuthMiddleware)
    public async getCurrentUser(
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const user: DocumentUser = await this._userService.findUserById(
                principal.details._id.toHexString()
            );
            return this._success<{ user: DocumentUser }>(res, 200, {
                user,
            });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        path: '/:id',
        description: 'Get one user by id',
        summary: 'Get one user',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns user dto',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            404: {
                description: 'Fail / user not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/:id', AuthMiddleware)
    public async getUserById(
        @requestParam() id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const user: DocumentUser = await this._userService.findUserById(id);
            return this._success<{ user: DocumentUser }>(res, 200, {
                user,
            });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Update current logged user',
        summary: 'Update current user',
        parameters: {
            body: {
                model: 'User',
            },
        },
        responses: {
            200: {
                description: 'Success / return updated user',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            404: {
                description: 'Fail / user not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/', AuthMiddleware)
    public async updateCurrentUser(
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const updatedUser: DocumentUser = await this._userService.updateUserById(
                principal.details._id.toHexString(),
                req.body
            );
            return this._success<{ updatedUser: DocumentUser }>(res, 200, {
                updatedUser,
            });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationDelete({
        description: 'Delete current logged user',
        summary: 'delete current user',
        parameters: {},
        responses: {
            200: {
                description: 'Success / return null',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            404: {
                description: 'Fail / user not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpDelete('/', AuthMiddleware)
    public async deleteCurrentUser(
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const user: DocumentUser = await this._userService.deleteUserById(
                principal.details._id.toHexString()
            );
            return this._success<{ user: DocumentUser }>(res, 200, {
                user,
            });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }
}
