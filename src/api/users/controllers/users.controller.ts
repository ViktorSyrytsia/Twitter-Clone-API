import { Request, Response, text } from 'express';
import {
    controller,
    httpGet,
    principal,
    queryParam,
    request,
    response,
} from 'inversify-express-utils';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import {
    ApiPath,
    ApiOperationGet,
    SwaggerDefinitionConstant,
} from 'swagger-express-typescript';

import { ControllerBase } from '../../base/controller.base';
import { Principal } from '../../auth/models/principal.model';
import { UsersService } from '../services/users.service';
import { DocumentUser } from '../models/user.model';
import { HttpError } from '../../../shared/models/http.error';

@ApiPath({
    path: '/api/v1/users',
    name: 'Users',
    security: { apiKeyHeader: [] },
})
@controller('/users')
export class UsersController extends ControllerBase {
    constructor(private _userService: UsersService) {
        super();
    }

    @ApiOperationGet({
        description: 'Get users objects list',
        summary: 'Get users list',
        parameters: {
            query: {
                search: {
                    type: 'text',
                    required: false,
                    allowEmptyValue: true,
                    name: 'search',
                    description: 'Searching by firstName and lastName',
                },
            },
        },
        responses: {
            200: {
                description: 'Success',
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
        @principal() user: Principal,
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
}
