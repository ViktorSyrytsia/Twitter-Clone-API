import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, UNPROCESSABLE_ENTITY } from 'http-status-codes';

import { TweetsRepository } from '../repositories/tweets.repository';
import { DocumentTweet, Tweet } from '../models/tweet.model';
import { Principal } from '../../auth/models/principal.model';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { HttpError } from '../../../shared/models/http.error';

@injectable()
export class TweetsService {
    constructor(
        private _tweetsRepository: TweetsRepository,
        private _usersService: UsersService
    ) {
    }

    public async findById(id: Types.ObjectId, principal?: Principal): Promise<DocumentTweet> {
        try {
            return this._tweetsRepository.findById(id, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }


    public async findTweetsByAuthorId(authorId: Types.ObjectId, principal: Principal, skip: number, limit: number): Promise<DocumentTweet[]> {
        try {
            return this._tweetsRepository.findTweetsByAuthorsIds([authorId], principal, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findTweetsByFollowing(principal: Principal, skip: number, limit: number): Promise<DocumentTweet[]> {
        try {
            const authorsIds: Types.ObjectId[] = (await this._usersService.findFollows(principal.details._id, principal))
                .map((user: DocumentUser) => user._id);
            return this._tweetsRepository.findTweetsByAuthorsIds(authorsIds, principal, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findRetweetsByTweetId(id: Types.ObjectId, principal: Principal, skip?: number, limit?: number): Promise<DocumentTweet[]> {
        try {
            return this._tweetsRepository.findRetweetsByTweetId(id, principal, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findLikersByTweetId(tweet: DocumentTweet, principal: Principal, skip: number, limit: number): Promise<DocumentUser[]> {
        try {
            return this._usersService.findUsersByUserIds(tweet.likes as Types.ObjectId[], principal, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async createTweet(text: string, principal: Principal): Promise<DocumentTweet> {
        try {
            return this._tweetsRepository.createTweet(
                new Tweet({
                    author: principal.details._id,
                    text,
                }),
                principal
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async retweetTweet(text: string, principal: Principal, retweetId: Types.ObjectId): Promise<DocumentTweet> {
        try {
            return this._tweetsRepository.createTweet(
                new Tweet({
                    text,
                    author: principal.details._id,
                    retweetedTweet: retweetId,
                }),
                principal
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async updateTweet(text: string, principal: Principal, tweetId: Types.ObjectId): Promise<DocumentTweet> {
        try {
            return this._tweetsRepository.updateTweet(tweetId, text, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async deleteTweet(id: Types.ObjectId, principal: Principal): Promise<DocumentTweet> {
        try {
            return this._tweetsRepository.deleteTweet(id, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }


    public async likeTweet(id: Types.ObjectId, principal: Principal): Promise<DocumentTweet> {
        try {
            return this._tweetsRepository.likeTweet(id, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async unlikeTweet(id: Types.ObjectId, principal: Principal): Promise<DocumentTweet> {
        try {
            return this._tweetsRepository.unlikeTweet(id, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }
}
