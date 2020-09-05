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

@ApiPath({
    path: '/api/v1/comments',
    name: 'Comments',
    security: {apiKeyHeader: []},
})
@controller('/comments')
export class CommentController extends ControllerBase {
    constructor(private _commentService: CommentService) {
        super();
    }

    @ApiOperationGet({
        description: 'Get comments by tweet',
        summary: 'Get comment by tweet id with pagination',
        path: '/:tweetId',
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
            404: {description: 'Fail / tweet not found'},
            500: {description: 'Fail / cannot find comments'},
        }
    })
    @httpGet('/:tweetId')
    public async getCommentsByTweet(
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
                await this._commentService.findCommentByTweet(
                    new Types.ObjectId(tweetId),
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
        path: '/:commentId',
        parameters: {
            path: {
                commentId: {
                    name: 'commentId',
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
            404: {description: 'Fail / comment not found'},
            500: {description: 'Fail / cannot find comments'},
        }
    })
    @httpGet('/:commentId')
    public async getRepliedCommentsByCommentId(
        @requestParam('commentId') commentId: string,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!commentId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'CommentId id is missing')
            );
        }
        try {
            const comments: Object[] =
                await this._commentService.findRepliedComments(
                    new Types.ObjectId(commentId),
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
        path: '/:tweetId',
        parameters: {
            path: {
                tweetId: {
                    name: 'tweetId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of tweet',
                    required: true
                }
            },
            query: {
                repliedCommentId: {
                    name: 'repliedCommentId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of replied comment',
                    required: false,
                }
            },
            body: {
                name: 'text',
                type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                description: 'text of comment',
                required: true,
            }
        },
        responses: {
            201: {
                description: 'Success / returns created comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            404: {description: 'Fail / tweet not found'},
            422: {description: 'Fail / text not a string'},
            500: {description: 'Fail / cannot create comment',},
        }
    })
    @httpPost('/:tweetId')
    public async createComment(
        @principal() principal: Principal,
        @requestParam('tweetId') tweetId: string,
        @queryParam('repliedCommentId') repliedCommentId: string,
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
                    new Types.ObjectId(tweetId),
                    new Types.ObjectId(repliedCommentId));

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
        path: '/:commentId',
        parameters: {
            path: {
                commentId: {
                    name: 'commentId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment to update',
                    required: true,
                    allowEmptyValue: false
                }
            },
            body: {
                name: 'text',
                type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                description: 'text of comment',
                required: true,
                allowEmptyValue: false,
            }
        },
        responses: {
            200: {
                description: 'Success / returns updated comment comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            403: {description: 'Fail / not comment author'},
            404: {description: 'Fail / comment not found'},
            422: {description: 'Fail / text not a string'},
            500: {description: 'Fail / cannot update comment',},
        }
    })
    @httpPut('/:commentId')
    public async updateComment(
        @principal() principal: Principal,
        @requestParam('commentId') commentId: string,
        @requestBody() text: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!commentId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        try {
            const updatedComment: DocumentComment =
                await this._commentService.updateComment(
                    new Types.ObjectId(commentId),
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
        path: '/:commentId',
        parameters: {
            path: {
                commentId: {
                    name: 'commentId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment to update',
                    required: true,
                    allowEmptyValue: false
                }
            },
        },
        responses: {
            200: {
                description: 'Success / returns removed comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            403: {description: 'Fail / not owner of comment'},
            404: {description: 'Fail / comment not found'},
            500: {description: 'Fail / cannot remove comment',},
        }
    })
    @httpDelete('/:commentId')
    public async deleteComment(
        @principal() principal: Principal,
        @requestParam('commentId') commentId: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!commentId) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        try {
            const deletedComment: DocumentComment =
                await this._commentService.deleteComment(principal, new Types.ObjectId(commentId));

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
        path: '/like/:commentId',
        parameters: {
            path: {
                commentId: {
                    name: 'commentId',
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
            500: {description: 'Fail / cannot like comment',},
        }
    })
    @httpPatch('/like/:commentId')
    public async likeComment(
        @requestParam('commentId') commentId: string,
        @requestParam() userId: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!commentId) {
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
                    new Types.ObjectId(commentId),
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
        path: '/unlike/:commentId',
        parameters: {
            path: {
                commentId: {
                    name: 'commentId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'id of comment',
                    required: true,
                    allowEmptyValue: false
                }
            },
        },
        responses: {
            200: {
                description: 'Success / returns unliked comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment'
            },
            500: {description: 'Fail / cannot unlike comment',},
        }
    })
    @httpPatch('/unlike/:commentId')
    public async unlikeComment(
        @requestParam('commentId') commentId: string,
        @requestParam('likeId') likeId: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!commentId) {
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
                    new Types.ObjectId(commentId),
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
}

