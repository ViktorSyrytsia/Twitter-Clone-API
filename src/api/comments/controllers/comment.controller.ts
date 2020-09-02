import {Request, Response} from 'express';
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
        description: 'Get comment by tweet',
        summary: 'Get comment by tweet id',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns array of comment',
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
            const comments: Array<DocumentComment> = await this._commentService.findByTweet(tweetId);
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
            500: {
                description: 'Fail / cannot update comment',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Comment',
            },
        }
    })
    @httpPut('/')
    public async updateComment(
        @requestParam('id') id: string,
        @requestBody() comment: Comment,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const updatedComment: DocumentComment = await this._commentService.updateById(id, comment);
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: updatedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Like comment',
        summary: 'Like comment',
        path: '/:id/like',
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
    @httpPatch('/:id/like')
    public async likeComment(
        @requestParam('id') id: string,
        @requestBody() comment: Comment,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const likedComment: DocumentComment = await this._commentService.likeComment(id);
            return this._success<{ comment: DocumentComment }>(res, OK, {
                comment: likedComment
            });
        } catch (error) {
            return this._fail(
                res, new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Unlike comment',
        summary: 'Unlike comment by id',
        path: '/:id/unlike',
        parameters: {},
        responses: {
            200: {
                description: 'Success /  returns unliked comment comment',
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
    @httpPatch('/:id/unlike')
    public async unlikeComment(
        @requestParam('commentId') commentId: string,
        @requestParam('likeId') likeId: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const unlikedComment: DocumentComment = await this._commentService.unlikeComment(commentId, likeId);
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
        parameters: {},
        responses: {
            200: {
                description: 'Success / returns removed comment ',
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
    @httpDelete('/')
    public async removeComment(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ) {
        try {
            const unlikedComment: DocumentComment = await this._commentService.deleteComment(id);
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

