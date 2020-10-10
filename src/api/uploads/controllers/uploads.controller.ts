import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { BAD_REQUEST, NOT_FOUND, OK } from 'http-status-codes';
import { controller, httpDelete, httpGet, httpPost, principal, queryParam, request, requestParam, response } from 'inversify-express-utils';
import { Types } from 'mongoose';
import { ApiOperationDelete, ApiOperationGet, ApiOperationPost, ApiPath, SwaggerDefinitionConstant } from 'swagger-express-typescript';

import { HttpError } from '../../../shared/models/http.error';
import { ActivatedUserMiddleware } from '../../auth/middlewares/activated.user.middleware';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';
import { Principal } from '../../auth/models/principal.model';
import { ControllerBase } from '../../base/controller.base';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { DocumentFile } from '../models/file.model';
import { UploadsService } from '../services/uploads.service';


@ApiPath({
    path: '/api/v1/files',
    name: 'Files',
    security: { apiKeyHeader: [] },
})
@controller('/files')
export class UploadsController extends ControllerBase {
    constructor(
        private _uploadsService: UploadsService,
        private _userService: UsersService) {
        super();
    }

    @ApiOperationGet({
        description: 'Find own files',
        summary: 'Find current logged user files',
        parameters: {
            query: {
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
                type: {
                    type: 'string',
                    required: false,
                    allowEmptyValue: true,
                    name: 'type',
                    description: 'Filter files by type',
                },
            },
        },
        responses: {
            200: {
                description: 'Returns files dto',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'File',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'User not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/')
    public async findOwnFiles(
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @queryParam('type') type: string,
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const files: DocumentFile[] = await this._uploadsService.findFilesByAuthor(
                principal.details._id,
                Number.parseInt(skip),
                Number.parseInt(limit),
                type
            );
            return this._success<{ files: DocumentFile[] }>(res, OK, { files });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        description: 'Add file',
        summary: 'Post file',
        path: '/',
        parameters: {
            formData: {
                file: {
                    type: 'file',
                    description: 'File to post',
                    allowEmptyValue: false,
                    required: true,
                },
            },
        },
        responses: {
            200: {
                description: 'Returns dto with file',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'File',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'User not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
    })
    @httpPost('/', AuthMiddleware, ActivatedUserMiddleware)
    public async createFile(
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal
    ): Promise<Response> {
        if (!req.files.file) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'File is missing')
            );
        }

        try {
            const newFile: DocumentFile = await this._uploadsService.createFile(
                principal.details._id,
                req.files.file as UploadedFile
            );
            return this._success<{ file: DocumentFile }>(res, OK, {
                file: newFile,
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationDelete({
        description: 'Delete file',
        summary: 'Delete file',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of file to delete',
                    required: true,
                },
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'File',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Avatar not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpDelete('/:id', AuthMiddleware, ActivatedUserMiddleware)
    public async fileDelete(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'File id is missing')
            );
        }

        try {
            const fileToRemove: DocumentFile = await this._uploadsService.findFileById(
                new Types.ObjectId(id)
            );
            if (!fileToRemove) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'File not found!')
                );
            }

            const file: DocumentFile = await this._uploadsService.deleteFile(
                fileToRemove
            );
            return this._success<{ file: DocumentFile }>(res, OK, {
                file,
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationGet({
        description: 'Find files by user id',
        summary: 'Find files by user id',
        path: '/author/{id}',
        parameters: {
            query: {
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
                type: {
                    type: 'string',
                    required: false,
                    allowEmptyValue: true,
                    name: 'type',
                    description: 'Filter files by type',
                },
            },
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of user',
                    required: true,
                },
            },
        },
        responses: {
            200: {
                description: 'Returns file dto',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'File',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'User not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/author/:id')
    public async findFilesByAuthorId(
        @queryParam('type') type: string,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'User id is missing')
            );
        }

        try {
            const author: DocumentUser = await this._userService.findById(new Types.ObjectId(id));
            if (!author) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'User with this id does not exist')
                );
            }

            const files: DocumentFile[] = await this._uploadsService.findFilesByAuthor(
                new Types.ObjectId(id),
                Number.parseInt(skip),
                Number.parseInt(limit),
                type
            );
            return this._success<{ files: DocumentFile[] }>(res, OK, { files });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationGet({
        description: 'Find file by id',
        summary: 'Find file by id',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of file to find',
                    required: true,
                },
            },
        },
        responses: {
            200: {
                description: 'Returns file dto',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'File',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'User not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/:id')
    public async fileFindById(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'File id is missing')
            );
        }

        try {
            const file: DocumentFile = await this._uploadsService.findFileById(
                new Types.ObjectId(id)
            );
            return this._success<{ file: DocumentFile }>(res, OK, {
                file,
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }
}
