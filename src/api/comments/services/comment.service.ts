import { FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { injectable } from 'inversify';
import { Types } from 'mongoose';

import { HttpError } from '../../../shared/models/http.error';
import { Principal } from '../../auth/models/principal.model';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { Comment, DocumentComment } from '../models/comment.model';
import { CommentRepository } from '../repositories/comment.repository';


@injectable()
export class CommentService {
    constructor(
        private _commentRepository: CommentRepository,
        private _usersService: UsersService
    ) {
    }

    public async findById(id: Types.ObjectId, principal: Principal): Promise<DocumentComment> {
        return this._commentRepository.findById(id, principal);
    }

    public async findCommentsByTweet(tweetId: Types.ObjectId, principal: Principal, skip?: number, limit?: number): Promise<DocumentComment[]> {
        try {
            return this._commentRepository.findByTweet(tweetId, principal, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async countCommentsByTweet(tweetId: Types.ObjectId): Promise<Number> {
        try {
            return this._commentRepository.countByTweet(tweetId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findRepliedComments(id: Types.ObjectId, principal?: Principal, skip?: number, limit?: number) {
        try {
            return this._commentRepository.findRepliesByCommentId(id, principal, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async createComment(text: string, principal: Principal, tweetId: Types.ObjectId): Promise<DocumentComment> {
        return this._commentRepository.createComment(
            new Comment({
                author: principal.details._id,
                tweet: tweetId,
                text
            }),
            principal
        );
    }

    public async updateComment(text: string, principal: Principal, comment: DocumentComment): Promise<DocumentComment> {
        try {
            return this._commentRepository.updateComment(comment._id, text, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async deleteComment(principal: Principal, comment: DocumentComment): Promise<DocumentComment> {
        try {
            return this._commentRepository.deleteComment(comment._id, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async likeComment(principal: Principal, comment: DocumentComment): Promise<DocumentComment> {
        try {
            return this._commentRepository.likeComment(comment._id, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async unlikeComment(principal: Principal, comment: DocumentComment): Promise<DocumentComment> {
        try {
            return this._commentRepository.unlikeComment(comment._id, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }


    public async replyComment(text: string, principal: Principal, repliedCommentId: Types.ObjectId) {
        try {
            return this._commentRepository.createComment(
                new Comment({
                    text,
                    author: principal.details._id,
                    repliedComment: repliedCommentId,
                }),
                principal
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findLikersByCommentId(comment: DocumentComment, principal: Principal, skip: number, limit: number): Promise<DocumentUser[]> {
        try {
            return this._usersService.findUsersByUserIds(comment.likes as Types.ObjectId[], principal, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }
}
