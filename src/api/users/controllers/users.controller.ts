import {Request, Response} from 'express';
import {
    controller,
    httpDelete,
    httpGet,
    httpPut,
    principal,
    queryParam,
    request,
    requestBody,
    requestParam,
    response,
} from 'inversify-express-utils';
import {BAD_REQUEST, INTERNAL_SERVER_ERROR, OK} from 'http-status-codes';
import {
    ApiOperationDelete,
    ApiOperationGet,
    ApiOperationPut,
    ApiPath,
    SwaggerDefinitionConstant,
} from 'swagger-express-typescript';
import {Types} from 'mongoose';


import {ControllerBase} from '../../base/controller.base';
import {Principal} from '../../auth/models/principal.model';
import {UsersService} from '../services/users.service';
import {DocumentUser, User} from '../models/user.model';
import {HttpError} from '../../../shared/models/http.error';
import {AuthMiddleware} from '../../auth/middlewares/auth.middleware';

@ApiPath({
    path: '/api/v1/users',
    name: 'Users',
    security: {apiKeyHeader: []},
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
        path: '/',
        parameters: {
            query: {
                search: {
                    type: 'string',
                    required: false,
                    allowEmptyValue: true,
                    name: 'search',
                    description: 'Searching by username/email/firstname/lastname',
                },
                skip: {
                    type: 'number',
                    required: false,
                    allowEmptyValue: true,
                    name: 'skip',
                    description: 'Skip count',
                },
                limit: {
                    type: 'number',
                    required: false,
                    allowEmptyValue: true,
                    name: 'limit',
                    description: 'Limit count',
                },
            }
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
    public async findUsers(
        @queryParam('search') search: string,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const users: DocumentUser[] = await this._userService.findUsersBySearchOrAll(
                search,
                Number.parseInt(skip),
                Number.parseInt(limit)
            );
            return this._success<{ users: DocumentUser[] }>(res, OK, {
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
    public async findCurrentUser(
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const user: DocumentUser = await this._userService.findById(
                principal.details._id
            );
            return this._success<{ user: DocumentUser }>(res, OK, {
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
        parameters: {
            path: {
                id: {
                    type: 'string',
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of user to get',
                    required: true
                }
            },
        },
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
    public async findUserById(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'User id is missing')
                );
            }
            const user: DocumentUser = await this._userService.findById(
                new Types.ObjectId(id)
            );
            return this._success<{ user: DocumentUser }>(res, OK, {
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
        path: '/',
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
        @requestBody() user: User,
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const updatedUser: DocumentUser = await this._userService.updateUserById(
                principal.details._id,
                user
            );
            return this._success<{ updatedUser: DocumentUser }>(res, OK, {
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
        path: '/',
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
                principal.details._id
            );
            return this._success<{ user: DocumentUser }>(res, OK, {
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
        description: 'Follow user object',
        summary: 'Follow user',
        path: '/follow/:id',
        parameters: {
            path: {
                id: {
                    type: 'string',
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of user to follow',
                    required: true
                }
            },
            body: {
                description: 'Follow user',
                required: true,
                model: 'User',
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            400: {
                description: 'Fail/ Parameters fail',
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
    @httpPut('/follow/:id', AuthMiddleware)
    public async followUser(
        @requestParam('id') id: string,
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'User id is missing')
                );
            }
            const user: DocumentUser = await this._userService.followUser(
                principal.details._id,
                new Types.ObjectId(id)
            );
            return this._success<{ user: DocumentUser }>(res, OK, {user});
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Unfollow user object',
        summary: 'Unfollow user',
        path: '/unfollow/:id',
        parameters: {
            path: {
                id: {
                    type: 'string',
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of user to unfollow',
                    required: true
                }
            },
            body: {
                description: 'Unfollow user',
                required: true,
                model: 'User',
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            400: {
                description: 'Fail/ Parameters fail',
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
    @httpPut('/unfollow/:id', AuthMiddleware)
    public async unfollowUser(
        @requestParam('id') id: string,
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'User id is missing')
                );
            }
            const user: DocumentUser = await this._userService.unfollowUser(
                principal.details._id,
                new Types.ObjectId(id)
            );
            return this._success<{ user: DocumentUser }>(res, OK, {user});
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }
}
