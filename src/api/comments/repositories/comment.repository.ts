import {injectable} from 'inversify';
import {ReturnModelType} from '@typegoose/typegoose';
import {CreateQuery, DocumentQuery, Types} from 'mongoose';
import {DatabaseConnection} from '../../../database/database-connection';
import {Comment, DocumentComment} from '../models/comment.model';
import {RepositoryBase} from '../../base/repository.base';
import {Principal} from '../../auth/models/principal.model';

@injectable()
export class CommentRepository extends RepositoryBase<Comment> {
    protected _repository: ReturnModelType<typeof Comment>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, Comment);
    }

    public async findById(commentId: Types.ObjectId): Promise<DocumentComment> {
        return this._repository.findById(commentId);
    }

    public async findByTweet(tweetId: Types.ObjectId, principal: Principal, skip: number, limit: number): Promise<Object[]> {
        const comments = this._repository.find({tweetId});
        return this._addPaginationAndModify(comments, principal, skip, limit);
    }

    async findRepliedCommentsByCommentId(commentId: Types.ObjectId, principal: Principal, skip: number, limit: number) {
        const comments = this._repository.find({replyToComment: commentId});
        return this._addPaginationAndModify(comments, principal, skip, limit);
    }

    public async createComment(comment: CreateQuery<Comment>): Promise<DocumentComment> {
        return this._repository.create(comment);
    }

    public async updateComment(commentId: Types.ObjectId, data: object): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, data, {new: true});
    }

    public async deleteComment(commentId: Types.ObjectId): Promise<DocumentComment> {
        return this._repository.findByIdAndDelete(commentId);
    }

    public async likeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, {$push: {likes: userId}}, {new: true});
    }

    public async unlikeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, {$pull: {likes: userId}}, {new: true});
    }

    public async replyComment(id: Types.ObjectId, repliedCommentId: Types.ObjectId) {
        return this._repository.findByIdAndUpdate(id, {replyToComment: repliedCommentId});
    }

    private async _addPaginationAndModify(
        findCommentQuery: DocumentQuery<DocumentComment[], DocumentComment>,
        principal: Principal,
        skip?: number,
        limit?: number
    ): Promise<Object[]> {
        if (skip) {
            findCommentQuery = findCommentQuery.skip(skip);
        }
        if (limit) {
            findCommentQuery = findCommentQuery.limit(limit);
        }
        return findCommentQuery
            .map(async (comments: DocumentComment[]) => {
                for (let i = 0; i < comments.length; i++) {
                    comments[i] = await this._addFields(comments[i], principal);
                }
                return comments;
            })
            .populate({
                path: 'likes',
                select: '_id username firstName lastName avatar',
                options: {
                    skip: 0,
                    limit: 10
                }
            });
    }

    private async _addFields(comment: DocumentComment, principal?: Principal): Promise<DocumentComment> {
        comment.likesCount = comment.likes.length;
        comment.isLiked = principal ? comment.likes.includes(principal.details._id) : false;
        comment.repliesCount = await this._findNumberOfReplies(comment._id);
        return comment;
    }

    private async _findNumberOfReplies(commentId: Types.ObjectId): Promise<number> {
        const comments = await this._repository.find({replyToComment: commentId});
        return comments.length;
    }
}

