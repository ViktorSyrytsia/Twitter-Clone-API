import {injectable} from 'inversify';
import {CommentRepository} from '../repositories/comment.repository';
import {Comment, DocumentComment} from '../models/comment.model';
import {Types} from 'mongoose';
import {Principal} from '../../auth/models/principal.model';
import {CommentNotFoundError} from '../models/errors/CommentNotFound.error';
import {NotOwnerOfCommentError} from '../models/errors/NotOwnerOfComment.error';

@injectable()
export class CommentService {
    constructor(private _commentRepository: CommentRepository) {
    }

    public async findCommentByTweet(tweetId: Types.ObjectId,
                                    page: number,
                                    limit: number
    ): Promise<DocumentComment[]> {
        return this._commentRepository.findByTweet(tweetId, page, limit);
    }

    public async createComment(text: string,
                               principal: Principal,
                               tweetId: Types.ObjectId,
                               repliedCommentId
    ): Promise<DocumentComment> {
        const comment = new Comment({
            authorId: principal.details._id,
            tweetId: tweetId,
            replyToComment: repliedCommentId ? repliedCommentId : null,
            text,
            likes: [],
            createdAt: new Date().valueOf(),
            lastEdited: new Date().valueOf()
        });
        return this._commentRepository.createComment(comment);
    }

    public async updateComment(commentId: Types.ObjectId,
                               text: string,
                               principal: Principal
    ): Promise<DocumentComment> {
        const comment = await this._commentRepository.findById(commentId);

        if (!comment){
            throw new CommentNotFoundError(404,'comment not found');
        }

        if (comment.authorId !== principal.details._id) {
            throw new NotOwnerOfCommentError(403,'not owner of comment');
        }

        comment.text = text;
        comment.lastEdited = new Date().valueOf();

        return this._commentRepository.updateComment(comment._id, comment);
    }

    public async deleteComment(principal: Principal, commentId: Types.ObjectId): Promise<DocumentComment> {
        const comment = await this._commentRepository.findById(commentId);

        if (!comment) {
            throw new CommentNotFoundError(404,'comment not found');
        }
        if (comment.authorId !== principal.details._id) {
            throw new NotOwnerOfCommentError(403,'not owner of comment');
        }
        return this._commentRepository.removeComment(commentId);
    }

    public async likeComment(commentId: Types.ObjectId,
                             userId: Types.ObjectId
    ): Promise<DocumentComment> {
        return this._commentRepository.likeComment(commentId, userId);
    }

    public async unlikeComment(commentId: Types.ObjectId,
                               userId: Types.ObjectId
    ): Promise<DocumentComment> {
        return this._commentRepository.unlikeComment(commentId, userId);
    }
}
