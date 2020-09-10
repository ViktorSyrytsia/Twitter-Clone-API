import { injectable } from 'inversify';
import { CreateQuery, DocumentQuery, Types, UpdateQuery } from 'mongoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { RepositoryBase } from '../../base/repository.base';
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

    public async updateTweet(tweet: UpdateQuery<Tweet>, principal: Principal): Promise<DocumentTweet> {
        const updatedTweet: DocumentTweet = await this._repository.findByIdAndUpdate(tweet._id, {
            $set: { ...tweet }
        }, { new: true });
        return this._addFields(updatedTweet, principal);
    }

    public async deleteTweet(id: Types.ObjectId): Promise<DocumentTweet> {
        return this._repository.findByIdAndDelete(id);
    }

    public async findById(id: Types.ObjectId, principal: Principal): Promise<DocumentTweet> {
        return this._addFields(
            await this._repository.findById(id).select('-retweets'),
            principal
        );
    }

    public async findTweetsByAuthorsIds(authorsIds: Types.ObjectId[], principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        const findTweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet> = this._repository
            .find({ authorId: { $in: authorsIds } })
            .populate('retweetedTweet')
            .sort({ createdAt: -1 });
        return this._addPaginationAndModify(findTweetsQuery, principal, skip, limit);
    }

    public async findRetweetsByTweetId(tweetId: Types.ObjectId, principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        const findRetweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet> = this._repository.find({ retweetedTweet: tweetId })
            .populate('retweetedTweet')
            .sort({ createdAt: -1 });
        return this._addPaginationAndModify(findRetweetsQuery, principal, skip, limit);
    }

    public async findLikesUsersByTweetId(likes: Types.ObjectId[], principal: Principal, skip?: number, limit?: number): Promise<DocumentUser[]> {
        return this._usersService.findByLikes(likes as Types.ObjectId[], principal, skip, limit);
    }

    public async likeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._repository.update(
            { _id: tweetIdToLike },
            { $push: { likes: userId } }
        );
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
            findTweetsQuery = findTweetsQuery.limit(limit);
        }
        return findTweetsQuery
            .map(async (tweets: DocumentTweet[]) => {
                for (let i = 0; i < tweets.length; i++) {
                    tweets[i] = await this._addFields(tweets[i], principal);
                }
                return tweets;
            })
            .populate({
                path: 'likes',
                select: '_id username firstName lastName avatar',
                options: {
                    skip: 0,
                    limit: 5
                }
            });
    }

    private async _addFields(tweet: DocumentTweet, principal?: Principal): Promise<DocumentTweet> {
        tweet.likesCount = tweet.likes.length;
        tweet.isLiked = principal ? tweet.likes.includes(principal.details._id) : false;
        tweet.retweetsCount = (await this._repository.find({ retweetedTweet: tweet._id })).length;
        tweet.isRetweeted = principal ? !!(await this._repository.findOne({
            retweetedTweet: tweet._id,
            authorId: principal.details._id
        })) : false;
        return tweet;
    }
}
