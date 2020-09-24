import { Request, Response } from 'express';
import { BAD_REQUEST, CREATED, FORBIDDEN, NOT_FOUND, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import {
    controller, httpDelete, httpGet, httpPatch, httpPost, httpPut, principal, queryParam, request, requestBody,
    requestParam, response
} from 'inversify-express-utils';
import { Types } from 'mongoose';
import {
    ApiOperationDelete, ApiOperationGet, ApiOperationPatch, ApiOperationPost, ApiOperationPut, ApiPath,
    SwaggerDefinitionConstant
} from 'swagger-express-typescript';

import { HttpError } from '../../../shared/models/http.error';
import { ActivatedUserMiddleware } from '../../auth/middlewares/activated.user.middleware';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';
import { Principal } from '../../auth/models/principal.model';
import { ControllerBase } from '../../base/controller.base';
import { DocumentTweet } from '../../tweets/models/tweet.model';
import { TweetsService } from '../../tweets/services/tweets.service';
import { DocumentUser } from '../../users/models/user.model';
import { DocumentComment } from '../models/comment.model';
import { CommentService } from '../services/comment.service';


@ApiPath({
    path: '/api/v1/comments',
    name: 'Comments',
    security: { apiKeyHeader: [] },
})
@controller('/comments')
export class CommentController extends ControllerBase {
    constructor(
        private _commentService: CommentService,
        private _tweetService: TweetsService) {
        super();
    }

    @ApiOperationGet({
        description: 'Find users by comment likes',
        summary: 'Find users by comment likes with pagination',
        path: '/likes/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of comment',
                    required: true
                }
            },
            query: {
                skip: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
                    required: false,
                    allowEmptyValue: true,
                    name: 'skip',
                    description: 'Skip count',
                },
                limit: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
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
            500: {
                description: 'Cannot find comments',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/likes/:id')
    public async findLikesUsersByCommentId(
        @requestParam('id') id: string,
        @principal() principal: Principal,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment id is missing')
            );
        }
        try {
            const comment: DocumentComment = await this._commentService.findById(new Types.ObjectId(id), principal);
            if (!comment) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );

            }

            const users: DocumentUser[] = await this._commentService.findLikersByCommentId(
                comment,
                principal,
                Number.parseInt(skip),
                Number.parseInt(limit)
            );
            return this._success<{ users: DocumentUser[] }>(res, OK, { users });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationGet({
        description: 'Find comments by tweet',
        summary: 'Find comment by tweet id with pagination',
        path: '/{tweetId}',
        parameters: {
            path: {
                tweetId: {
                    name: 'tweetId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of tweet',
                    required: true,
                    allowEmptyValue: false
                }
            },
            query: {
                skip: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
                    required: false,
                    allowEmptyValue: true,
                    name: 'skip',
                    description: 'Skip count',
                },
                limit: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
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
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/:tweetId')
    public async findCommentsByTweet(
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
            const tweet: DocumentTweet = await this._tweetService.findById(new Types.ObjectId(tweetId));
            if (!tweet) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Tweet not found'));
            }
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
        description: 'Find replied comments',
        summary: 'Find replied comment by comment id with pagination',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of comment',
                    required: true,
                    allowEmptyValue: false
                }
            },
            query: {
                skip: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
                    required: false,
                    allowEmptyValue: true,
                    name: 'skip',
                    description: 'Skip count',
                },
                limit: {
                    type: SwaggerDefinitionConstant.Parameter.Type.NUMBER,
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
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/:id')
    public async findRepliedCommentsByCommentId(
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
            const comment: DocumentComment = await this._commentService.findById(new Types.ObjectId(commentId), principal);
            if (!comment) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );
            }

            const comments: DocumentComment[] =
                await this._commentService.findRepliedComments(
                    new Types.ObjectId(commentId),
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

    @ApiOperationPost({
        description: 'Create comment',
        summary: 'Create comment with given string',
        path: '/{tweetId}',
        parameters: {
            path: {
                tweetId: {
                    name: 'tweetId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of tweet',
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
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated',
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
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPost('/:tweetId', AuthMiddleware, ActivatedUserMiddleware)
    public async createComment(
        @principal() principal: Principal,
        @requestParam('tweetId') tweetId: string,
        @requestBody() body: { text: string },
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!tweetId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }

        if (!body.text) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment text is missing')
            );
        }
        try {
            const tweet: DocumentTweet = await this._tweetService.findById(new Types.ObjectId(tweetId));
            if (!tweet) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Tweet not found')
                );
            }
            const createdComment: DocumentComment =
                await this._commentService.createComment(
                    body.text,
                    principal,
                    new Types.ObjectId(tweetId)
                );

            return this._success<{ comment: DocumentComment }>(res, CREATED, {
                comment: createdComment
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPut({
        description: 'Update comment',
        summary: 'Update comment with new text',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of comment to update',
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
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated | Not comment author',
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
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/:id', AuthMiddleware, ActivatedUserMiddleware)
    public async updateComment(
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
        if (!body.text) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment text is missing')
            );
        }

        try {
            const comment: DocumentComment = await this._commentService.findById(new Types.ObjectId(id), principal);
            if (!comment) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );
            }
            if (!((comment.author as Types.ObjectId).equals(principal.details._id))) {
                return this._fail(
                    res,
                    new HttpError(FORBIDDEN, 'Not an owner of a comment')
                );

            }


            const updatedComment: DocumentComment =
                await this._commentService.updateComment(
                    body.text,
                    principal,
                    comment
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: updatedComment
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationDelete({
        description: 'Delete comment',
        summary: 'Delete comment by id',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of comment to delete',
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
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated | Not comment author',
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
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpDelete('/:id', AuthMiddleware, ActivatedUserMiddleware)
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
            const comment: DocumentComment = await this._commentService.findById(new Types.ObjectId(id), principal);
            if (!comment) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );
            }
            if (!((comment.author as Types.ObjectId).equals(principal.details._id))) {
                return this._fail(
                    res,
                    new HttpError(FORBIDDEN, 'Not an owner of a comment')
                );

            }

            const deletedComment: DocumentComment = await this._commentService
                .deleteComment(principal, comment);

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
        path: '/like/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of comment',
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
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            422: {
                description: 'Comment already liked',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError'
            },
            500: {
                description: 'Cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPatch('/like/:id', AuthMiddleware, ActivatedUserMiddleware)
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
            const comment: DocumentComment = await this._commentService.findById(new Types.ObjectId(id), principal);
            if (!comment) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );
            }
            if (comment.likes.includes(principal.details._id)) {
                return this._fail(
                    res,
                    new HttpError(UNPROCESSABLE_ENTITY, 'Already liked')
                );

            }

            const likedComment: DocumentComment =
                await this._commentService.likeComment(
                    principal,
                    comment
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: likedComment
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }


    @ApiOperationPatch({
        description: 'Unlike comment',
        summary: 'Unlike comment by id',
        path: '/unlike/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of comment',
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
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            422: {
                description: 'Comment already liked',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError'
            },
            500: {
                description: 'Cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPatch('/unlike/:id', AuthMiddleware, ActivatedUserMiddleware)
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
            const comment: DocumentComment = await this._commentService.findById(new Types.ObjectId(id), principal);
            if (!comment) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );

            }
            if (!comment.likes.includes(principal.details._id)) {
                return this._fail(
                    res,
                    new HttpError(UNPROCESSABLE_ENTITY, 'Already unliked')
                );

            }

            const unlikedComment: DocumentComment =
                await this._commentService.unlikeComment(
                    principal,
                    comment
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: unlikedComment
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        description: 'Reply to comment',
        summary: 'Reply to comment by id',
        path: '/reply/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of comment',
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
            201: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
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
            403: {
                description: 'Account not activated',
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
            apiKeyHeader: [],
        },
    })
    @httpPost('/reply/:id', AuthMiddleware, ActivatedUserMiddleware)
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
        if (!body.text) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Comment text is missing')
            );
        }

        try {
            const repliedCpmment: DocumentComment = await this._commentService.findById(new Types.ObjectId(id), principal);
            if (!repliedCpmment) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );
            }

            const comment: DocumentComment =
                await this._commentService.replyComment(
                    body.text,
                    principal,
                    repliedCpmment.id,
                );

            return this._success<{ comment: DocumentComment }>(res, CREATED, { comment });
        } catch (error) {
            return this._fail(res, error);
        }
    }
}
