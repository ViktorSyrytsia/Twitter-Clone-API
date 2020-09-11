import { Request, Response } from 'express';
import {
    controller, httpDelete, httpGet, httpPatch, httpPost, httpPut, principal, queryParam, request, requestBody,
    requestParam, response,
} from 'inversify-express-utils';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from 'http-status-codes';
import {
    ApiOperationDelete, ApiOperationGet, ApiOperationPatch, ApiOperationPost, ApiOperationPut, ApiPath,
    SwaggerDefinitionConstant,
} from 'swagger-express-typescript';
import { Types } from 'mongoose';

import { ControllerBase } from '../../base/controller.base';
import { CommentService } from '../services/comment.service';
import { Comment, DocumentComment } from '../models/comment.model';
import { HttpError } from '../../../shared/models/http.error';
import { Principal } from '../../auth/models/principal.model';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';
import { DocumentUser } from '../../users/models/user.model';

@ApiPath({
    path: '/api/v1/comments/',
    name: 'Comments',
    security: { apiKeyHeader: [] },
})
@controller('/comments')
export class CommentController extends ControllerBase {
    constructor(private _commentService: CommentService) {
        super();
    }

    @ApiOperationGet({
        description: 'Find users by comment likes',
        summary: 'Find users by comment likes',
        path: 'likes/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of comment',
                    required: true
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/likes/:id', AuthMiddleware)
    public async findLikesUsersByTweetId(
        @requestParam('id') id: string,
        @principal() principal: Principal,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'Comment id is missing')
                );
            }
            const users: DocumentUser[] = await this._commentService.findLikesUsersByCommentId(
                new Types.ObjectId(id),
                principal,
                Number.parseInt(skip),
                Number.parseInt(limit)
            )
            return this._success<{ users: DocumentUser[] }>(res, OK, { users });
        } catch (error) {
            return this._fail(
                res,
                error
            );
        }
    }

    @ApiOperationGet({
        description: 'Get comments by tweet',
        summary: 'Get comment by tweet id with pagination',
        path: '{tweetId}',
        parameters: {
            path: {
                tweetId: {
                    name: 'tweetId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of tweet',
                    required: true,
                    allowEmptyValue: false
                }
            },
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
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Comment'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot find comments',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        }
    })
    @httpGet('/:tweetId')
    public async getCommentsByTweet(
        @principal() principal: Principal,
        @requestParam('tweetId') tweetId: string,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!tweetId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        try {
            const comments: DocumentComment[] =
                await this._commentService.findCommentsByTweet(
                    new Types.ObjectId(tweetId),
                    principal,
                    Number.parseInt(skip),
                    Number.parseInt(limit)
                );

            return this._success<{ comments: DocumentComment[] }>(res, OK, {
                comments
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationGet({
        description: 'Get replied comments',
        summary: 'Get replied comment by comment id with pagination',
        path: '{id}',
        parameters: {
            path: {
                commentId: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment',
                    required: true,
                    allowEmptyValue: false
                }
            },
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
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Comment'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot find comments',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        }
    })
    @httpGet('/:id')
    public async getRepliedCommentsByCommentId(
        @principal() principal: Principal,
        @requestParam('id') commentId: string,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!commentId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment id is missing')
            );
        }
        try {
            const comments: Object[] =
                await this._commentService.findRepliedComments(
                    new Types.ObjectId(commentId),
                    principal,
                    Number.parseInt(skip),
                    Number.parseInt(limit)
                );

            return this._success<{ comments: Object[] }>(res, OK, {
                comments
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(error.code || INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPost({
        description: 'Create comment',
        summary: 'Create comment with given string',
        path: '{tweetId}',
        parameters: {
            path: {
                tweetId: {
                    name: 'tweetId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of tweet',
                    required: true
                }
            },
            body: {
                description: 'Comment text',
                required: true,
                properties: {
                    text: {
                        name: 'text',
                        required: true,
                        allowEmptyValue: false,
                        type: SwaggerDefinitionConstant.Parameter.Type.STRING
                    }
                }
            }
        },
        responses: {
            201: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot create comments',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        }
    })
    @httpPost('/:tweetId')
    public async createComment(
        @principal() principal: Principal,
        @requestParam('tweetId') tweetId: string,
        @requestBody() text: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!tweetId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        try {
            const createdComment: DocumentComment =
                await this._commentService.createComment(text,
                    principal,
                    new Types.ObjectId(tweetId));

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: createdComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(error.code || INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Update comment',
        summary: 'Update comment with new text',
        path: '{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment to update',
                    required: true,
                    allowEmptyValue: false
                }
            },
            body: {
                description: 'Comment text',
                required: true,
                properties: {
                    text: {
                        name: 'text',
                        required: true,
                        allowEmptyValue: false,
                        type: SwaggerDefinitionConstant.Parameter.Type.STRING
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        }
    })
    @httpPut('/:id')
    public async updateComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @requestBody() text: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment id is missing')
            );
        }
        try {
            const updatedComment: DocumentComment =
                await this._commentService.updateComment(
                    new Types.ObjectId(id),
                    text,
                    principal
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: updatedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(error.code || INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationDelete({
        description: 'delete comment',
        summary: 'delete comment by id',
        path: '{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment to delete',
                    required: true,
                    allowEmptyValue: false
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        }
    })
    @httpDelete('/:id')
    public async deleteComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment id is missing')
            );
        }
        try {
            const deletedComment: DocumentComment = await this._commentService
                .deleteComment(principal, new Types.ObjectId(id));

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: deletedComment
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }


    @ApiOperationPatch({
        description: 'Like comment',
        summary: 'Like comment by id',
        path: 'like/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment',
                    required: true,
                    allowEmptyValue: false
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },

            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        }
    })
    @httpPatch('/like/:id', AuthMiddleware)
    public async likeComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment id is missing')
            );
        }
        try {

            const likedComment: DocumentComment =
                await this._commentService.likeComment(
                    principal,
                    new Types.ObjectId(id)
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: likedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(error.code || INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }


    @ApiOperationPatch({
        description: 'Unlike comment',
        summary: 'Unlike comment by id',
        path: 'unlike/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment',
                    required: true,
                    allowEmptyValue: false
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            // ...
        }
    })
    @httpPatch('/unlike/:id', AuthMiddleware)
    public async unlikeComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment id is missing')
            );
        }
        try {
            const unlikedComment: DocumentComment =
                await this._commentService.unlikeComment(
                    principal,
                    new Types.ObjectId(id)
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: unlikedComment
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPatch({
        description: 'Reply to comment',
        summary: 'Reply to comment by id',
        path: 'reply/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment',
                    required: true,
                    allowEmptyValue: false
                }
            },
            body: {
                required: true,
                allowEmptyValue: false,
                properties: {
                    text: {
                        name: 'text',
                        required: true,
                        allowEmptyValue: false,
                        type: SwaggerDefinitionConstant.Parameter.Type.STRING
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError'
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        }
    })
    @httpPost('/reply/:id', AuthMiddleware)
    public async replyComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @requestBody() body: { text: string },
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment id is missing')
            );
        }
        try {
            const comment: DocumentComment =
                await this._commentService.replyComment(
                    body.text,
                    principal,
                    new Types.ObjectId(id),
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: comment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(error.code || INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }
}

