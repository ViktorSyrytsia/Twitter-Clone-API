import {Request, Response} from 'express';
import {
    controller,
    httpDelete,
    httpGet,
    httpPatch,
    httpPost,
    httpPut,
    principal,
    request,
    requestBody,
    requestParam,
    response,
} from 'inversify-express-utils';
import {INTERNAL_SERVER_ERROR, OK} from 'http-status-codes';
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
                page: {
                    name: 'page',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    required: false,
                },
                limit: {
                    name: 'limit',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    required: false
                }
            }
        },
        responses: {
            200: {description: 'Success / returns array of comments',},
            404: {description: 'Fail / tweet not found'},
            500: {description: 'Fail / cannot find comments'},
        }
    })
    @httpGet('/{tweetId}')
    public async getCommentsByTweet(
        @requestParam('tweetId') tweetId: string,
        @requestParam('page') page: number,
        @requestParam('limit') limit: number,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const comments: Array<DocumentComment> =
                await this._commentService.findCommentByTweet(Types.ObjectId(tweetId), page, limit);

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
        summary: 'Create comment with given string',
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
            201: {description: 'Success / returns created comment',},
            404: {description: 'Fail / tweet not found'},
            422: {description: 'Fail / text not a string'},
            500: {description: 'Fail / cannot create comment',},
        }
    })
    @httpPost('/{tweetId}')
    public async createComment(
        @principal() principal: Principal,
        @requestParam('tweetId') tweetId: string,
        @requestParam('repliedCommentId') repliedCommentId: string,
        @requestBody() text: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const createdComment: DocumentComment =
                await this._commentService.createComment(text,
                    principal,
                    Types.ObjectId(tweetId),
                    Types.ObjectId(repliedCommentId));

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
        summary: 'Update comment with new text',
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
            200: {description: 'Success / returns updated comment comment',},
            403: {description: 'Fail / not comment author'},
            404: {description: 'Fail / comment not found'},
            422: {description: 'Fail / text not a string'},
            500: {description: 'Fail / cannot update comment',},
        }
    })
    @httpPut('/{commentId}')
    public async updateComment(
        @principal() principal: Principal,
        @requestParam('commentId') commentId: string,
        @requestBody() text: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const updatedComment: DocumentComment =
                await this._commentService.updateComment(Types.ObjectId(commentId), text, principal);

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: updatedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationDelete({
        description: 'delete comment',
        summary: 'delete comment by id',
        path: '/{id}',
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
            200: {description: 'Success / returns removed comment '},
            403: {description: 'Fail / not owner of comment'},
            404: {description: 'Fail / comment not found'},
            500: {description: 'Fail / cannot remove comment',},
        }
    })
    @httpDelete('/{commentId}')
    public async removeComment(
        @principal() principal: Principal,
        @requestParam('commentId') commentId: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const deletedComment: DocumentComment =
                await this._commentService.deleteComment(principal,Types.ObjectId(commentId));

            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: deletedComment
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
        path: '/like/{id}',
        parameters: {},
        responses: {
            200: {
                description: 'Success / returns liked comment',
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
    @httpPatch('/like/{id}')
    public async likeComment(
        @requestParam('id') id: string,
        @requestParam() userId: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const likedComment: DocumentComment =
                await this._commentService.likeComment(Types.ObjectId(id), Types.ObjectId(userId));

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
        path: '/',
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
            200: {description: 'Success / returns unliked comment',},
            500: {description: 'Fail / cannot unlike comment',},
        }
    })
    @httpPatch('/unlike/{id}')
    public async unlikeComment(
        @requestParam('id') id: string,
        @requestParam('likeId') likeId: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const unlikedComment: DocumentComment =
                await this._commentService.unlikeComment(Types.ObjectId(id), Types.ObjectId(likeId));

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

