import { ReturnModelType } from '@typegoose/typegoose';
import { injectable } from 'inversify';
import { CreateQuery, DocumentQuery, Types } from 'mongoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { Principal } from '../../auth/models/principal.model';
import { RepositoryBase } from '../../base/repository.base';
import { CommentService } from '../../comments/services/comment.service';
import { UsersService } from '../../users/services/users.service';
import { DocumentTweet, Tweet } from '../models/tweet.model';


@injectable()
export class TweetsRepository extends RepositoryBase<Tweet> {
    protected _repository: ReturnModelType<typeof Tweet>;

    constructor(
        private _databaseConnection: DatabaseConnection,
        private _usersService: UsersService,
        private _commentService: CommentService
    ) {
        super();
        this.initRepository(this._databaseConnection, Tweet);
    }

    public async createTweet(tweet: CreateQuery<Tweet>, principal: Principal): Promise<DocumentTweet> {
        const newTweet: DocumentTweet = await this._repository.create(tweet);
        return this._addFields(newTweet, principal);
    }

    public async updateTweet(tweetId: Types.ObjectId, text: string, principal: Principal): Promise<DocumentTweet> {
        const updatedTweet: DocumentTweet = await this._repository.findByIdAndUpdate(tweetId, {
            $set: {
                text,
                lastEdited: Date.now()
            }
        }, { new: true }
        ).lean();
        return this._addFields(updatedTweet, principal);
    }

    public async deleteTweet(id: Types.ObjectId, principal: Principal): Promise<DocumentTweet> {
        // const comments: DocumentComment[] = await this._commentService.findCommentsByTweet(id, principal);
        //
        // for (const comment of comments) {
        //     await this._commentService.deleteComment(principal, comment._id);
        // }

        const tweet: DocumentTweet = await this._repository
            .findByIdAndDelete(id)
            .lean();
        return this._addFields(tweet, principal);
    }

    public async findById(id: Types.ObjectId, principal?: Principal): Promise<DocumentTweet> {
        const tweet: DocumentTweet = await this._repository
            .findById(id)
            .lean();
        return this._addFields(tweet, principal);
    }

    public async findTweetsByAuthorsIds(authorsIds: Types.ObjectId[], principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        const findTweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet> = this._repository
            .find({ authorId: { $in: authorsIds } })
            .sort({ createdAt: -1 });
        return this._addLazyLoadAndModify(findTweetsQuery, principal, skip, limit);
    }

    public async findRetweetsByTweetId(tweetId: Types.ObjectId, principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        const findRetweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet> = this._repository
            .find({ retweetedTweet: tweetId })
            .sort({ createdAt: -1 });
        return this._addLazyLoadAndModify(findRetweetsQuery, principal, skip, limit);
    }

    public async likeTweet(id: Types.ObjectId, principal: Principal): Promise<DocumentTweet> {
        const tweet: DocumentTweet = await this._repository
            .findByIdAndUpdate(
                id,
                { $push: { likes: principal.details._id } },
                { new: true }
            ).lean();
        return this._addFields(tweet, principal);
    }

    public async unlikeTweet(id: Types.ObjectId, principal: Principal): Promise<DocumentTweet> {
        const tweet: DocumentTweet = await this._repository
            .findByIdAndUpdate(
                id,
                { $pull: { likes: principal.details._id } },
                { new: true }
            ).lean();
        return this._addFields(tweet, principal);
    }

    private async _addLazyLoadAndModify(
        findTweetsQuery: DocumentQuery<DocumentTweet[], DocumentTweet>,
        principal: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentTweet[]> {
        findTweetsQuery.sort({ createdAt: -1 });

        if (skip) {
            findTweetsQuery = findTweetsQuery.skip(skip);
        }
        if (limit) {
            findTweetsQuery = findTweetsQuery.limit(limit);
        }
        return findTweetsQuery
            .lean()
            .map(async (tweets: DocumentTweet[]) => {
                for (let i = 0; i < tweets.length; i++) {
                    tweets[i] = await this._addFields(tweets[i], principal);
                }
                return tweets;
            });
    }

    private async _addFields(tweet: DocumentTweet, principal?: Principal): Promise<DocumentTweet> {
        if (principal && await principal.isAuthenticated()) {
            tweet.isLiked = tweet.likes.includes(principal.details._id);
            tweet.isRetweeted = await this._repository.exists({
                retweetedTweet: tweet._id,
                author: principal.details._id
            });
        }

        tweet.likesCount = tweet.likes.length;
        tweet.retweetsCount = await this._repository.countDocuments({ retweetedTweet: tweet._id });
        tweet.likes = await this._usersService.findUsersByUserIds(tweet.likes as Types.ObjectId[], principal, 0, 5);
        tweet.commentsCount = await this._commentService.countCommentsByTweet(tweet._id);
        tweet.author = await this._usersService.findById(tweet.author as Types.ObjectId, principal);

        if (tweet.retweetedTweet) {
            tweet.retweetedTweet = await this.findById(tweet.retweetedTweet as Types.ObjectId, principal);
        }

        return tweet;
    }
}
