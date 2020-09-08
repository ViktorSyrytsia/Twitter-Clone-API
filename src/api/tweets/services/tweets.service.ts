import { injectable } from 'inversify';
import { CreateQuery, Types, UpdateQuery } from 'mongoose';

import { TweetsRepository } from '../repositories/tweets.repository';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { Principal } from '../../auth/models/principal.model';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';

@injectable()
export class TweetsService {
    constructor(
        private _tweetsRepository: TweetsRepository,
        private _usersService: UsersService
    ) {
    }

    public async createTweet(tweet: CreateQuery<Tweet>): Promise<DocumentTweet> {
        return this._tweetsRepository.createTweet(tweet);
    }

    public async updateTweet(tweet: UpdateQuery<Tweet>): Promise<DocumentTweet> {
        return this._tweetsRepository.updateTweet(tweet);
    }

    public async deleteTweet(id: Types.ObjectId): Promise<DocumentTweet> {
        return this._tweetsRepository.deleteTweet(id);
    }

    public async findTweetById(id: Types.ObjectId): Promise<DocumentTweet> {
        return this._tweetsRepository.findTweetById(id);
    }

    public async findTweetsByAuthorId(authorId: Types.ObjectId, principal: Principal, skip: number, limit: number): Promise<DocumentTweet[]> {
        return this._tweetsRepository.findTweetsByAuthorsIds([authorId], principal, skip, limit);
    }

    public async findTweetsByFollowing(principal: Principal, skip: number, limit: number): Promise<DocumentTweet[]> {
        const authorsIds: Types.ObjectId[] = await this._usersService.getFollowingUsersIdsByUserId(principal.details._id)
        return this._tweetsRepository.findTweetsByAuthorsIds(authorsIds, principal, skip, limit)
    }

    public async findRetweetsByTweetId(id: Types.ObjectId, principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        return this._tweetsRepository.findRetweetsByTweetId(id, principal, skip, limit)
    }

    public async findLikesUsersByTweetId(id: Types.ObjectId, principal: Principal, skip: number, limit: number): Promise<DocumentUser[]> {
        return this._tweetsRepository.findLikesUsersByTweetId(id, principal, skip, limit)
    }

    public async likeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._tweetsRepository.likeTweet(userId, tweetIdToLike)
    }

    public async unlikeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._tweetsRepository.unlikeTweet(userId, tweetIdToLike)
    }
}
