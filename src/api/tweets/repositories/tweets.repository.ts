import { injectable } from 'inversify';
import { CreateQuery, DocumentQuery, Types, UpdateQuery } from 'mongoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { RepositoryBase } from '../../base/repository.base';
import { HttpError } from '../../../shared/models/http.error';
import { NOT_FOUND } from 'http-status-codes';
import { Principal } from '../../auth/models/principal.model';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';

@injectable()
export class TweetsRepository extends RepositoryBase<Tweet> {
    protected _repository: ReturnModelType<typeof Tweet>;

    constructor(
        private _databaseConnection: DatabaseConnection,
        private _usersService: UsersService
    ) {
        super();
        this.initRepository(this._databaseConnection, Tweet);
    }

    public async createTweet(tweet: CreateQuery<Tweet>): Promise<DocumentTweet> {
        return this._repository.create(tweet);
    }

    public async updateTweet(tweet: UpdateQuery<Tweet>): Promise<DocumentTweet> {
        let tweetToUpdate: DocumentTweet = await this._repository.findById(tweet._id);
        if (!tweetToUpdate) {
            throw new HttpError(NOT_FOUND, 'Tweet not found');
        }
        return this._repository.findByIdAndUpdate(tweet._id, {
            $set: {
                ...tweet
            }
        }, { new: true })
    }

    public async deleteTweet(id: Types.ObjectId): Promise<DocumentTweet> {
        return this._repository.findByIdAndDelete(id);
    }

    public async findTweetById(id: Types.ObjectId): Promise<DocumentTweet> {
        const tweet: DocumentTweet = await this._repository.findById(id).select('-retweets');
        if (!tweet) {
            throw new HttpError(NOT_FOUND, 'Tweet not found');
        }
        return tweet;
    }

    public async findTweetsByAuthorsIds(authorsIds: Types.ObjectId[], principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        let findTweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet> = this._repository
            .find({ _id: { $in: authorsIds } })
            .populate('retweetedTweet')
            .sort({ createdAt: -1 });

        return this._addPaginationAndModify(findTweetsQuery, principal, skip, limit)
    }

    public async findRetweetsByTweetId(tweetId: Types.ObjectId, principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        let findRetweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet> = this._repository.find({ retweetedTweet: tweetId })
            .populate('retweetedTweet')
            .sort({ createdAt: -1 });
        return this._addPaginationAndModify(findRetweetsQuery, principal, skip, limit)
    }

    public async findLikesUsersByTweetId(tweetId: Types.ObjectId, principal: Principal, skip?: number, limit?: number): Promise<DocumentUser[]> {
        const tweet: DocumentTweet = await this._repository.findById(tweetId);
        if (!tweet) {
            throw new HttpError(NOT_FOUND, 'Tweet not found')
        }
        return this._usersService.findByLikes(tweet.likes as Types.ObjectId[], principal, skip, limit)
    }

    public async likeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._repository.update(
            { _id: tweetIdToLike },
            { $push: { likes: userId } }
        )
    }

    public async unlikeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._repository.findByIdAndUpdate(
            { _id: tweetIdToLike },
            { $pull: { likes: userId } },
            { new: true }
        );
    }

    private async _addPaginationAndModify(
        findTweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet>,
        principal: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentTweet[]> {
        if (skip) {
            findTweetsQuery = findTweetsQuery.skip(skip);
        }
        if (limit) {
            findTweetsQuery = findTweetsQuery.limit(limit)
        }
        return findTweetsQuery
            .map(async (tweets: DocumentTweet[]) => {
                for (const tweet of tweets) {
                    tweet.likesCount = tweet.likes.length;
                    tweet.liked = principal ? tweet.likes.includes(principal.details._id) : false;
                    tweet.retweetsCount = (await this._repository.find({ retweetedTweet: tweet._id })).length
                    tweet.retweeted = principal ? !!(await this._repository.findOne({
                        retweetedTweet: tweet._id,
                        authorId: principal.details._id
                    })) : false;
                }
                return tweets
            })
            .populate({
                path: 'likes',
                select: '_id username firstName lastName avatar',
                options: {
                    skip: 0,
                    limit: 10
                }
            })
    }
}
