import {injectable} from 'inversify';
import {CommentRepository} from '../repositories/comment.repository';
import {Comment, DocumentComment} from '../models/comment.model';
import {Types} from 'mongoose';
import {Principal} from '../../auth/models/principal.model';
import {HttpError} from '../../../shared/models/http.error';
import {FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND} from 'http-status-codes';
import {TweetsService} from '../../tweets/services/tweets.service';

@injectable()
export class CommentService {
    constructor(private _commentRepository: CommentRepository,
                private _tweetService: TweetsService) {
    }

    public async findById(id: Types.ObjectId): Promise<DocumentComment> {
        return this._commentRepository.findById(id);
    }

    public async findCommentsByTweet(tweetId: Types.ObjectId, principal: Principal, skip: number, limit: number): Promise<Object[]> {
        const tweet = await this._tweetService.findById(tweetId, principal);

        if (!tweet) {
            throw new HttpError(NOT_FOUND, 'tweet not found');
        }

        try {
            return this._commentRepository.findByTweet(tweetId, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findRepliedComments(id: Types.ObjectId, skip: number, limit: number) {
        try {
            return this._commentRepository.findRepliedCommentsByCommentId(id, skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async createComment(text: string, principal: Principal, tweetId: Types.ObjectId): Promise<DocumentComment> {
        const tweet = await this._tweetService.findById(tweetId, principal);

        if (!tweet) {
            throw new HttpError(NOT_FOUND, 'tweet not found');
        }

        const comment = new Comment({
            authorId: principal.details._id,
            tweetId: tweetId,
            replyToComment: null,
            text,
            likes: [],
            createdAt: new Date().valueOf(),
            lastEdited: new Date().valueOf()
        });

        return this._commentRepository.createComment(comment);
    }

    public async updateComment(id: Types.ObjectId, text: string, principal: Principal): Promise<DocumentComment> {
        const comment = await this._commentRepository.findById(id);

        if (!comment) {
            throw new HttpError(NOT_FOUND, 'comment not found');
        }

        if (comment.authorId !== principal.details._id) {
            throw new HttpError(FORBIDDEN, 'not owner of comment');
        }

        comment.text = text;
        comment.lastEdited = new Date().valueOf();

        try {
            return this._commentRepository.updateComment(comment._id, comment);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async deleteComment(principal: Principal, id: Types.ObjectId): Promise<DocumentComment> {
        const comment = await this._commentRepository.findById(id);

        if (!comment) {
            throw new HttpError(NOT_FOUND, 'comment not found');
        }
        if (comment.authorId !== principal.details._id) {
            throw new HttpError(FORBIDDEN, 'not owner of comment');
        }

        try {
            return this._commentRepository.deleteComment(id);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async likeComment(principal: Principal, commentId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentComment> {
        const comment = await this._commentRepository.findById(commentId);

        if (!comment) {
            throw new HttpError(NOT_FOUND, 'comment not found');
        }
        if (comment.authorId !== principal.details._id) {
            throw new HttpError(FORBIDDEN, 'not owner of comment');
        }

        try {
            return this._commentRepository.likeComment(commentId, userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async unlikeComment(principal: Principal, commentId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentComment> {
        const comment = await this._commentRepository.findById(commentId);

        if (!comment) {
            throw new HttpError(NOT_FOUND, 'comment not found');
        }
        if (comment.authorId !== principal.details._id) {
            throw new HttpError(FORBIDDEN, 'not owner of comment');
        }

        try {
            return this._commentRepository.unlikeComment(commentId, userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }


    async replyComment(principal: Principal, commentId: Types.ObjectId, repliedCommentId: Types.ObjectId) {
        const comment = await this._commentRepository.findById(commentId);

        if (!comment) {
            throw new HttpError(NOT_FOUND, 'comment not found');
        }
        if (comment.authorId !== principal.details._id) {
            throw new HttpError(FORBIDDEN, 'not owner of comment');
        }

        try {
            return this._commentRepository.replyComment(commentId, repliedCommentId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }
}
