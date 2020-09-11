import {Request, Response} from 'express';
import {
    controller,
    httpDelete,
    httpGet,
    httpPatch,
    httpPost,
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
import {Types} from 'mongoose';
import {Principal} from '../../auth/models/principal.model';
import {AuthMiddleware} from '../../auth/middlewares/auth.middleware';
import {DocumentUser} from '../../users/models/user.model';

@ApiPath({
    path: '/api/v1/comments/',
    name: 'Comments',
    security: {apiKeyHeader: []},
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
                description: 'Success / returns users',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'User',
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Fail / tweet not found',
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
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
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
                description: 'Success / returns array of comments',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Comment'
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot find comments',
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
            const comments: Object[] =
                await this._commentService.findCommentsByTweet(
                    new Types.ObjectId(tweetId),
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
                description: 'Success / returns array of comments',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Comment'
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot find comments',
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
                new HttpError(BAD_REQUEST, 'id is missing')
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
                properties:{
                    text: {
                        name:'text',
                        required: true,
                        allowEmptyValue: false,
                        type: SwaggerDefinitionConstant.Parameter.Type.STRING
                    }
                }
            }
        },
        responses: {
            201: {
                description: 'Success / returns created comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot create comments',
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
                properties:{
                    text: {
                        name:'text',
                        required: true,
                        allowEmptyValue: false,
                        type: SwaggerDefinitionConstant.Parameter.Type.STRING
                    }
                }
            }
        },
        responses: {
            200: {
                description: 'Success / returns updated comment comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Fail / not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Fail / comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot update comment',
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
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        try {
            const updatedComment: DocumentComment =
                await this._commentService.updateComment(
                    new Types.ObjectId(id),
                    text,
                    principal);

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
                    description: 'id of comment to update',
                    required: true,
                    allowEmptyValue: false
                }
            },
        },
        responses: {
            200: {
                description: 'Success / returns updated comment comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Fail / not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Fail / comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot update comment',
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
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        try {
            const deletedComment: DocumentComment =
                await this._commentService.deleteComment(principal, new Types.ObjectId(id));

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: deletedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(error.code || INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }


    @ApiOperationPatch({
        description: 'Like comment',
        summary: 'Like comment',
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
                description: 'Success / returns liked comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },

            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Fail / not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Fail / comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        }
    })
    @httpPatch('/like/:id')
    public async likeComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @requestParam() userId: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        if (!userId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'User id is missing')
            );
        }
        try {

            const likedComment: DocumentComment =
                await this._commentService.likeComment(
                    principal,
                    new Types.ObjectId(id),
                    new Types.ObjectId(userId)
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
                description: 'Success / returns liked comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Fail / not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Fail / comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        }
    })
    @httpPatch('/unlike/:id')
    public async unlikeComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @requestParam('likeId') likeId: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        if (!likeId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Like id is missing')
            );
        }
        try {
            const unlikedComment: DocumentComment =
                await this._commentService.unlikeComment(
                    principal,
                    new Types.ObjectId(id),
                    new Types.ObjectId(likeId)
                );

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: unlikedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(error.code || INTERNAL_SERVER_ERROR, error.message)
            );
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
            query: {
                replyCommentId: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment to reply',
                    required: true,
                    allowEmptyValue: false
                }
            }
        },
        responses: {
            200: {
                description: 'Success / returns liked comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
            400: {
                description: 'Fail / Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Fail / not comment author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError'
            },
            404: {
                description: 'Fail / Comment not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Fail / cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        }
    })
    @httpPatch('/reply/:id')
    public async replyComment(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @queryParam('replyCommentId') replyCommentId: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        if (!replyCommentId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Like id is missing')
            );
        }
        try {
            const comment: DocumentComment =
                await this._commentService.replyComment(
                    principal,
                    new Types.ObjectId(id),
                    new Types.ObjectId(replyCommentId)
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

