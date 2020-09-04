import { injectable } from 'inversify';
import { CreateQuery, Types, UpdateQuery } from 'mongoose';

import { TweetsRepository } from '../repositories/tweets.repository';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { UsersRepository } from '../../users/repositories/users.repository';

@injectable()
export class TweetsService {
    constructor(
        private _tweetsRepository: TweetsRepository,
        private _userRepository: UsersRepository
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

    public async findTweetsByAuthorId(id: Types.ObjectId, skip: number, limit: number): Promise<DocumentTweet[]> {
        return this._tweetsRepository.findTweetsByAuthorId(id, skip, limit);
    }

    public async findTweetsByFollowing(userId: Types.ObjectId, skip: number, limit: number): Promise<DocumentTweet[]> {
        const authorsIds: Types.ObjectId[] = await this._userRepository.getFollowingUserIdsByUserId(userId)
        return this._tweetsRepository.findTweetsByFollowing(authorsIds, skip, limit)
    }

    public async likeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._tweetsRepository.likeTweet(userId, tweetIdToLike)
    }

    public async unlikeTweet(userId: Types.ObjectId, tweetIdToLike: Types.ObjectId): Promise<DocumentTweet> {
        return this._tweetsRepository.unlikeTweet(userId, tweetIdToLike)
    }
}
