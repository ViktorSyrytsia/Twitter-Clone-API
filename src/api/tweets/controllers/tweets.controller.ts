import { Request, Response } from 'express';
import {
    controller, httpDelete, httpGet, httpPost, httpPut, principal, queryParam, request, requestBody, requestParam,
    response,
} from 'inversify-express-utils';
import {
    ApiOperationDelete, ApiOperationGet, ApiOperationPost, ApiOperationPut, ApiPath, SwaggerDefinitionConstant,
} from 'swagger-express-typescript';
import { Types } from 'mongoose';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from 'http-status-codes';

import { ControllerBase } from '../../base/controller.base';
import { TweetsService } from '../services/tweets.service';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { Principal } from '../../auth/models/principal.model';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';
import { HttpError } from '../../../shared/models/http.error';
import { DocumentUser } from '../../users/models/user.model';

@ApiPath({
    path: '/api/v1/tweets',
    name: 'Tweets',
    security: { apiKeyHeader: [] },
})
@controller('/tweets')
export class TweetsController extends ControllerBase {

    constructor(
        private _tweetsService: TweetsService
    ) {
        super();
    }

    @ApiOperationPost({
        description: 'Post tweet object',
        summary: 'Post new tweet',
        parameters: {
            body: {
                description: 'Post tweet',
                required: true,
                model: 'Tweet',
            },
        },
        responses: {
            200: {
                description: 'Success /  returns tweet dto',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            400: {
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPost('/', AuthMiddleware)
    public async createTweet(
        @requestBody() tweet: Tweet,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        try {
            const newTweet: DocumentTweet = await this._tweetsService.createTweet(
                new Tweet({
                    ...tweet,
                    authorId: principal.details._id
                })
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet: newTweet });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationDelete({
        description: 'Delete tweet object',
        summary: 'Delete tweet',
        parameters: {
            path: {
                id: {
                    type: 'string',
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet to delete',
                    required: true
                }
            },
            body: {
                description: 'Delete tweet',
                required: false,
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
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpDelete('/:id', AuthMiddleware)
    public async deleteTweet(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'Tweet id is missing')
                );
            }
            const tweet = await this._tweetsService.deleteTweet(new Types.ObjectId(id));
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPut({
        description: 'Update tweet object',
        summary: 'Update tweet',
        parameters: {
            body: {
                description: 'Update tweet',
                required: true,
                model: 'Tweet',
            },
        },
        responses: {
            200: {
                description: 'Success /  returns tweet dto',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            400: {
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/', AuthMiddleware)
    public async updateTweet(
        @requestBody() tweet: Tweet,
        @request() req: Request,
        @response() res: Response,
    ): Promise<Response> {
        try {
            const updatedTweet: DocumentTweet = await this._tweetsService.updateTweet(tweet);
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet: updatedTweet });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        description: 'Find tweet object by id',
        summary: 'Find tweet',
        parameters: {
            path: {
                id: {
                    type: 'string',
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet to find',
                    required: true
                }
            },
        },
        responses: {
            200: {
                description: 'Success /  returns tweet dto',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            400: {
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/:id', AuthMiddleware)
    public async findTweetById(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'Tweet id is missing')
                );
            }
            const tweet: DocumentTweet = await this._tweetsService.findTweetById(new Types.ObjectId(id));
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        description: 'Find tweets object by Author id/' +
            'If there is a tweetRetweet in this object it means that it is a retweet',
        summary: 'Find tweets',
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
            path: {
                id: {
                    type: 'string',
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of author to find tweets',
                    required: true
                }
            },
        },
        responses: {
            200: {
                description: 'Success / returns tweets dto',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
            400: {
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweets not found',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/author/:id', AuthMiddleware)
    public async findTweetByAuthorId(
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @principal() principal: Principal,
        @requestParam('id') id,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'Author id is missing')
                );
            }
            const tweet: DocumentTweet[] = await this._tweetsService.findTweetsByAuthorId(
                new Types.ObjectId(id),
                principal,
                Number.parseInt(skip),
                Number.parseInt(limit)
            );
            return this._success<{ tweet: DocumentTweet[] }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Like tweet object',
        summary: 'Like tweet',
        parameters: {
            path: {
                id: {
                    type: 'string',
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
                description: 'Success /  returns tweet dto',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            400: {
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
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
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'Tweet id is missing')
                );
            }
            const userId: Types.ObjectId = principal.details._id;
            const tweet: DocumentTweet = await this._tweetsService.likeTweet(
                userId,
                new Types.ObjectId(id)
            );
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPut({
        description: 'Unlike tweet object',
        summary: 'Unlike tweet',
        parameters: {
            path: {
                id: {
                    type: 'string',
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of tweet to unlike',
                    required: true
                }
            },
            body: {
                description: 'Unlike tweet',
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
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/unlike/:id', AuthMiddleware)
    public async unlikeTweet(
        @principal() principal: Principal,
        @requestParam('id') id,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            if (!id) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'Tweet id is missing')
                );
            }
            const userId: Types.ObjectId = principal.details._id;
            const tweet: DocumentTweet = await this._tweetsService.unlikeTweet(
                userId,
                new Types.ObjectId(id)
            )
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        description: 'Find tweets object by following/' +
            'If there is a tweetRetweet in this object it means that it is a retweet',
        summary: 'Find tweets',
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
                description: 'Success /  returns tweets dto',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
            400: {
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweets not found',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/feed', AuthMiddleware)
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
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationPost({
        description: 'Retweet tweet object',
        summary: 'Retweet tweet',
        parameters: {
            body: {
                description: 'Retweet tweet',
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
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            404: {
                description: 'Fail / tweet not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPost('/retweet', AuthMiddleware)
    public async createRetweet(
        @requestBody() tweet: Tweet,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        try {
            if (!tweet.retweetedTweet) {
                return this._fail(
                    res,
                    new HttpError(BAD_REQUEST, 'retweetedTweet id is missing')
                );
            }
            const retweet: DocumentTweet = await this._tweetsService.createTweet(
                new Tweet({
                    ...tweet,
                    authorId: principal.details._id
                })
            )
            return this._success<{ tweet: DocumentTweet }>(res, OK, { tweet: retweet });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        description: 'Find retweets by tweet id',
        summary: 'Find retweets by tweet id',
        parameters: {
            path: {
                id: {
                    type: 'string',
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
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            }
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/retweets/:id', AuthMiddleware)
    public async findRetweetsByTweetId(
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
                    new HttpError(BAD_REQUEST, 'Tweet id is missing')
                );
            }
            const retweets: DocumentTweet[] = await this._tweetsService.findRetweetsByTweetId(
                new Types.ObjectId(id),
                principal,
                Number.parseInt(skip),
                Number.parseInt(limit)
            )
            return this._success<{ tweets: DocumentTweet[] }>(res, OK, { tweets: retweets });
        } catch (error) {
            return this._fail(
                res,
                new HttpError(INTERNAL_SERVER_ERROR, error.message)
            );
        }
    }

    @ApiOperationGet({
        description: 'Find users by tweet likes',
        summary: 'Find users by tweet likes',
        parameters: {
            path: {
                id: {
                    type: 'string',
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
                description: 'Fail/ Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Tweet',
            }
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
                    new HttpError(BAD_REQUEST, 'Tweet id is missing')
                );
            }
            const users: DocumentUser[] = await this._tweetsService.findLikesUsersByTweetId(
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
}
