import { injectable } from 'inversify';
import { CreateQuery, DocumentQuery, Types, UpdateQuery } from 'mongoose';
import { ReturnModelType } from '@typegoose/typegoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { RepositoryBase } from '../../base/repository.base';
import { HttpError } from '../../../shared/models/http.error';
import { NOT_FOUND } from 'http-status-codes';

@injectable()
export class TweetsRepository extends RepositoryBase<Tweet> {
    protected _repository: ReturnModelType<typeof Tweet>;

    constructor(private _databaseConnection: DatabaseConnection) {
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

    public async findTweetsByAuthorId(authorId: Types.ObjectId, skip: number, limit: number): Promise<DocumentTweet[]> {
        let findTweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet> = this._repository.find({
            $or: [
                { authorId: authorId },
            ]
        })
            .populate('retweetedTweet')
            .sort({ createdAt: -1 });

        if (skip) {
            findTweetsQuery = findTweetsQuery.skip(skip);
        }
        if (limit) {
            findTweetsQuery = findTweetsQuery.limit(limit)
        }
        return findTweetsQuery
    }

    public async findTweetsByFollowing(authorsIds: Types.ObjectId[], skip: number, limit: number): Promise<DocumentTweet[]> {
        const authorOrQuery: { authorId: Types.ObjectId }[] = authorsIds.map((authorId: Types.ObjectId) => {
                return {
                    authorId: authorId
                }
            })
        let findTweetsQuery: DocumentQuery<DocumentTweet[],DocumentTweet> = this._repository.find(
            {
                $or: [...authorOrQuery,]
            }
        )
            .populate('retweetedTweet')
            .sort({ createdAt: -1 });

        if (skip) {
            findTweetsQuery = findTweetsQuery.skip(skip);
        }
        if (limit) {
            findTweetsQuery = findTweetsQuery.limit(limit)
        }
        return findTweetsQuery
    }

    public async likeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._repository.update(
            { _id: tweetIdToLike },
            {
                $push: {
                    likes: userId
                }
            }
        )
    }

    public async unlikeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._repository.findByIdAndUpdate(
            { _id: tweetIdToLike },
            { $pull: { followers: userId } },
            { new: true }
        );
    }
}
