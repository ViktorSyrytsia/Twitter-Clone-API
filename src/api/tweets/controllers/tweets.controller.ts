import { Request, Response } from 'express';
import {
    controller, httpDelete, httpGet, httpPost, httpPut, principal, queryParam, request, requestBody, requestParam,
    response,
} from 'inversify-express-utils';
import {
    ApiOperationDelete, ApiOperationGet, ApiOperationPost, ApiOperationPut, ApiPath, SwaggerDefinitionConstant,
} from 'swagger-express-typescript';
import { Types } from 'mongoose';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';

import { ControllerBase } from '../../base/controller.base';
import { TweetsService } from '../services/tweets.service';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { Principal } from '../../auth/models/principal.model';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';
import { HttpError } from '../../../shared/models/http.error';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';

@ApiPath({
    path: '/api/v1/tweets',
    name: 'Tweets',
    security: { apiKeyHeader: [] },
})
@controller('/tweets')
export class TweetsController extends ControllerBase {

    constructor(
        private _tweetsService: TweetsService,
    ) {
        super();
    }

    @ApiOperationGet({
        description: 'Find retweets by tweet id',
        summary: 'Find retweets by tweet id',
        path: '/retweets/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet',
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
                model: 'Tweet',
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
                description: 'Cannot find tweets',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/retweets/:id')
    public async findRetweetsByTweetId(
        @requestParam('id') id: string,
        @principal() principal: Principal,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Retweeted Tweet id is missing')
            );
        }
        try {
            const tweet: DocumentTweet = await this._tweetsService.findById(new Types.ObjectId(id));
            if (!tweet) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Tweet not found')
                );

            }

            const retweets: DocumentTweet[] = await this._tweetsService.findRetweetsByTweetId(
                new Types.ObjectId(id),
                principal,
                Number.parseInt(skip),
                Number.parseInt(limit)
            );
            return this._success<{ tweets: DocumentTweet[] }>(res, OK, { tweets: retweets });
        } catch (error) {
            return this._fail(
                res,
                error
            );
        }
    }


    @ApiOperationGet({
        description: 'Find tweet by id',
        summary: 'Find tweet',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet to find',
                    required: true
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
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
                description: 'Tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot find tweets',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/:id')
    public async findTweetById(
        @requestParam('id') id: string,
        @principal() principal: Principal,
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
            const tweet: DocumentTweet = await this._tweetsService.findById(
                new Types.ObjectId(id),
                principal
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationGet({
        description: 'Find users by tweet likes',
        summary: 'Find users by tweet likes',
        path: '/likes/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet',
                    required: true
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
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
                description: 'Cannot find tweets',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/likes/:id')
    public async findLikersByTweetId(
        @requestParam('id') id: string,
        @principal() principal: Principal,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        try {
            const tweet: DocumentTweet = await this._tweetsService.findById(new Types.ObjectId(id));
            if (!tweet) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Tweet not found')
                );

            }

            const users: DocumentUser[] = await this._tweetsService.findLikersByTweetId(
                tweet,
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
        description: 'Find tweets object by Author id/' +
            'If there is a tweetRetweet in this object it means that it is a retweet',
        summary: 'Find tweets',
        path: '/author/{id}',
        parameters: {
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
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet',
                    required: true
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
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
                description: 'Cannot find tweet',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/author/:id')
    public async findTweetByAuthorId(
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
                new HttpError(BAD_REQUEST, 'Author id is missing')
            );
        }
        try {
            const tweet: DocumentTweet[] = await this._tweetsService.findTweetsByAuthorId(
                new Types.ObjectId(id),
                principal,
                Number.parseInt(skip),
                Number.parseInt(limit)
            );
            return this._success<{ tweet: DocumentTweet[] }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        description: 'Create tweet object',
        summary: 'Create new tweet',
        path: '/',
        parameters: {
            body: {
                description: 'Tweet text',
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
                model: 'Tweet'
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
                description: 'Cannot create tweet',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPost('/', AuthMiddleware)
    public async createTweet(
        @requestBody() body: { text: string },
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        if (!body.text) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet text is missing')
            );
        }
        try {
            const newTweet: DocumentTweet = await this._tweetsService.createTweet(
                body.text,
                principal,
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet: newTweet });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationDelete({
        description: 'Delete tweet object',
        summary: 'Delete tweet',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet to delete',
                    required: true
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
                description: 'Cannot update tweet',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpDelete('/:id', AuthMiddleware)
    public async deleteTweet(
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
            const tweetToDelete: DocumentTweet = await this._tweetsService.findById(new Types.ObjectId(id));
            if (!tweetToDelete) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Tweet not found')
                );

            }
            if (!((tweetToDelete.author as Types.ObjectId).equals(principal.details._id))) {
                return this._fail(
                    res,
                    new HttpError(FORBIDDEN, 'Not an owner of a tweet')
                );
            }

            const tweet = await this._tweetsService.deleteTweet(new Types.ObjectId(id), principal);
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(
                res,
                error
            );
        }
    }

    @ApiOperationPut({
        description: 'Update tweet object',
        summary: 'Update tweet',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of tweet to update',
                    required: true,
                    allowEmptyValue: false
                }
            },
            body: {
                description: 'Tweet text',
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
                model: 'Tweet'
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
                description: 'Tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot update tweet',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/', AuthMiddleware)
    public async updateTweet(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @requestBody() body: { text: string },
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet id is missing')
            );
        }
        if (!body.text) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'Tweet text is missing')
            );
        }

        try {
            const tweetToUpdate: DocumentTweet = await this._tweetsService.findById(new Types.ObjectId(id));
            if (!tweetToUpdate) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Tweet not found')
                );

            }
            if (!((tweetToUpdate.author as Types.ObjectId).equals(principal.details._id))) {
                return this._fail(
                    res,
                    new HttpError(FORBIDDEN, 'Not an owner of a tweet')
                );
            }

            const updatedTweet: DocumentTweet = await this._tweetsService.updateTweet(
                body.text,
                principal,
                new Types.ObjectId(id),
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet: updatedTweet });
        } catch (error) {
            return this._fail(
                res,
                error
            );
        }
    }


    @ApiOperationPut({
        description: 'Like tweet object',
        summary: 'Like tweet',
        path: '/like/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet to like',
                    required: true
                }
            },
            body: {
                description: 'Like tweet',
                required: true,
                model: 'Tweet',
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
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
            422: {
                description: 'Tweet already liked',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError'
            },
            500: {
                description: 'Cannot like tweet',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/like/:id', AuthMiddleware)
    public async likeTweet(
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
            const tweetToLike: DocumentTweet = await this._tweetsService.findById(new Types.ObjectId(id));
            if (!tweetToLike) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );

            }
            if (tweetToLike.likes.includes(principal.details._id)) {
                return this._fail(
                    res,
                    new HttpError(UNPROCESSABLE_ENTITY, 'Already liked')
                );

            }

            const tweet: DocumentTweet = await this._tweetsService.likeTweet(
                new Types.ObjectId(id),
                principal
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPut({
        description: 'Unlike tweet object',
        summary: 'Unlike tweet',
        path: '/unlike/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet to unlike',
                    required: true
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
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
            422: {
                description: 'Tweet already liked',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError'
            },
            500: {
                description: 'Cannot like tweet',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/unlike/:id', AuthMiddleware)
    public async unlikeTweet(
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
            const tweetToUnlike: DocumentTweet = await this._tweetsService.findById(new Types.ObjectId(id));
            if (!tweetToUnlike) {
                return this._fail(
                    res,
                    new HttpError(NOT_FOUND, 'Comment not found')
                );

            }
            if (!tweetToUnlike.likes.includes(principal.details._id)) {
                return this._fail(
                    res,
                    new HttpError(UNPROCESSABLE_ENTITY, 'Already unliked')
                );

            }

            const tweet: DocumentTweet = await this._tweetsService.unlikeTweet(
                new Types.ObjectId(id),
                principal
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(
                res,
                error
            );
        }
    }

    @ApiOperationGet({
        description: 'Find tweets object by following/' +
            'If there is a tweetRetweet in this object it means that it is a retweet',
        summary: 'Find feed',
        path: '/feed',
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
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'HttpError',
            },
            404: {
                description: 'Tweets not found',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/feed')
    public async findTweetsByFollowing(
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @principal() principal: Principal,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const tweets: DocumentTweet[] = await this._tweetsService.findTweetsByFollowing(
                principal,
                Number.parseInt(skip),
                Number.parseInt(limit)
            );
            return this._success<{ tweets: DocumentTweet[] }>(res, OK, { tweets });
        } catch (error) {
            return this._fail(
                res,
                error
            );
        }
    }

    @ApiOperationPost({
        description: 'Retweet tweet object',
        summary: 'Retweet tweet',
        path: '/retweet',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of tweet',
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
    @httpPost('/retweet', AuthMiddleware)
    public async createRetweet(
        @principal() principal: Principal,
        @requestParam('id') id: string,
        @requestBody() body: { text: string },
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (id) {
            return this._fail(
                res,
                new HttpError(BAD_REQUEST, 'retweetedTweet id is missing')
            );
        }
        try {
            const tweet: DocumentTweet = await this._tweetsService.findById(new Types.ObjectId(id));
            if (!tweet) {
                throw new HttpError(NOT_FOUND, 'Tweet not found');
            }

            const retweet: DocumentTweet = await this._tweetsService.retweetTweet(
                body.text,
                principal,
                new Types.ObjectId(id),
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet: retweet });
        } catch (error) {
            return this._fail(
                res,
                error
            );
        }
    }
}
