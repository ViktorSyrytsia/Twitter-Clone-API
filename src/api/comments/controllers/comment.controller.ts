import {Request, Response, text} from 'express';
import {
    controller,
    httpDelete,
    httpGet,
    httpPatch,
    httpPost,
    httpPut,
    request,
    requestBody,
    requestParam,
    response,
} from 'inversify-express-utils';
import {INTERNAL_SERVER_ERROR, NOT_FOUND, OK} from 'http-status-codes';
import {
    ApiOperationDelete,
    ApiOperationGet,
    ApiOperationPatch,
    ApiOperationPost,
    ApiOperationPut,
    ApiPath,
    SwaggerDefinitionConstant,
} from 'swagger-express-typescript';

import {ControllerBase} from '../../base/controller.base';
import {CommentService} from '../services/comment.service';
import {Comment, DocumentComment} from '../models/comment.model';
import {HttpError} from '../../../shared/models/http.error';

@ApiPath({
    path: '/api/v1/comments',
    name: 'Comments',
    security: {apiKeyHeader: []},
})
@controller('/users')
export class CommentController extends ControllerBase {
    constructor(private _commentService: CommentService) {
        super();
    }

    @ApiOperationGet({
        description: 'Get comment by id',
        summary: 'Get comment',
        path: '/:id',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns dto with comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            404: {
                description: 'Fail / no comment found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            500: {
                description: 'Fail / cannot found comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
        }
    })
    @httpGet('/:id')
    public async getCommentById(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const comment: DocumentComment = await this._commentService.findById(id);
            if (!comment) {
                return this._fail(
                    res, new HttpError(NOT_FOUND, 'comment with such id not exists')
                );
            }
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        description: 'Get comment by tweet',
        summary: 'Get comment by tweet id',
        parameters: {
            query: {
                tweetId: {
                    type: 'text',
                    name: 'tweetId',
                    required: true,
                    allowEmptyValue: false,
                    description: 'id of tweet'
                }
            }
        },
        responses: {
            200: {
                description: 'Success / returns array of comments',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Comment',
            },
            500: {
                description: 'Fail / cannot found comments',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Comment',
            },
        }
    })
    @httpGet('/')
    public async getCommentsByTweet(
        @requestParam() tweetId: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const comments: Array<DocumentComment> = await this._commentService.getByTweet(tweetId);
            return this._success<{ comments: Array<DocumentComment> }>(res, OK, {
                comments
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPost({
        description: 'Create comment',
        summary: 'Create comment',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns created comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            500: {
                description: 'Fail / cannot create comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
        }
    })
    @httpPost('/')
    public async createComment(
        @requestBody() comment: Comment,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const createdComment: DocumentComment = await this._commentService.createComment(comment);
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: createdComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Update comment',
        summary: 'Update comment',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns updated comment comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            404: {
                description: 'Fail / cannot find comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            500: {
                description: 'Fail / cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
        }
    })
    @httpPut('/:id')
    public async updateComment(
        @requestParam('id') id: string,
        @requestBody() comment: Comment,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const updatedComment: DocumentComment = await this._commentService.updateById(id, comment);
            if (!updatedComment) {
                return this._fail(
                    res, new HttpError(NOT_FOUND, 'comment with such id not exists')
                );
            }
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: updatedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPatch({
        description: 'Like comment',
        summary: 'Like comment',
        path: '/:id',
        parameters: {},
        responses: {
            200: {
                description: 'Success / returns liked comment comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            404: {
                description: 'Fail / cannot find comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            500: {
                description: 'Fail / cannot like comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
        }
    })
    @httpPatch('/:id')
    public async likeComment(
        @requestParam('id') id: string,
        @requestBody() comment: Comment,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const likedComment: DocumentComment = await this._commentService.likeComment(id);
            if (!likedComment) {
                return this._fail(
                    res, new HttpError(NOT_FOUND, 'comment with such id not exists')
                );
            }
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: likedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPatch({
        description: 'Unlike comment',
        summary: 'Unlike comment by id',
        path: '/:id',
        parameters: {},
        responses: {
            200: {
                description: 'Success / returns unliked comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            404: {
                description: 'Fail / cannot find comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            500: {
                description: 'Fail / cannot unlike comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
        }
    })
    @httpPatch('/:id')
    public async unlikeComment(
        @requestParam('id') id: string,
        @requestParam('likeId') likeId: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const unlikedComment: DocumentComment = await this._commentService.unlikeComment(id, likeId);
            if (!unlikedComment) {
                return this._fail(
                    res, new HttpError(NOT_FOUND, 'comment with such id not exists')
                );
            }
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: unlikedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationDelete({
        description: 'remove comment',
        summary: 'remove comment by id',
        path: '/:id',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns removed comment ',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            404: {
                description: 'Fail / cannot find comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            500: {
                description: 'Fail / cannot remove comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
        }
    })
    @httpDelete('/:id')
    public async removeComment(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const unlikedComment: DocumentComment = await this._commentService.removeComment(id);
            if (!unlikedComment) {
                return this._fail(
                    res, new HttpError(NOT_FOUND, 'comme ' +
                        '   nt with such id not exists')
                );
            }
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: unlikedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }
}

