import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateQuery, DocumentQuery, Types } from 'mongoose';
import { DatabaseConnection } from '../../../database/database-connection';
import { Comment, DocumentComment } from '../models/comment.model';
import { RepositoryBase } from '../../base/repository.base';
import { Principal } from '../../auth/models/principal.model';

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

    public async findByTweet(tweetId: Types.ObjectId, principal: Principal, skip: number, limit: number): Promise<DocumentComment[]> {
        const findCommentsQuery: DocumentQuery<DocumentComment[], DocumentComment> = this._repository.find({ tweetId });
        return this._addPaginationAndModify(findCommentsQuery, principal, skip, limit);
    }

    async findRepliedCommentsByCommentId(commentId: Types.ObjectId, principal: Principal, skip: number, limit: number) {
        const comments = this._repository.find({ repliedComment: commentId });
        return this._addPaginationAndModify(comments, principal, skip, limit);
    }

    public async createComment(comment: CreateQuery<Comment>, principal: Principal): Promise<DocumentComment> {
        return this._addFields(
            await this._repository.create(comment),
            principal
        );
    }

    public async updateComment(commentId: Types.ObjectId, text: string, principal: Principal): Promise<DocumentComment> {
        return this._addFields(
            await this._repository.findByIdAndUpdate(commentId, {
                $set: {
                    text,
                    lastEdited: Date.now()
                }
            }, { new: true }),
            principal
        );
    }

    public async deleteComment(commentId: Types.ObjectId, principal: Principal): Promise<DocumentComment> {
        return this._addFields(
            await this._repository.findByIdAndDelete(commentId),
            principal
        );
    }

    public async likeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, { $push: { likes: userId } }, { new: true });
    }

    public async unlikeComment(commentId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, { $pull: { likes: userId } }, { new: true });
    }

    private async _addPaginationAndModify(
        findCommentQuery: DocumentQuery<DocumentComment[], DocumentComment>,
        principal: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentComment[]> {
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
                    limit: 5
                }
            });
    }

    private async _addFields(comment: DocumentComment, principal?: Principal): Promise<DocumentComment> {
        comment.likesCount = comment.likes.length;
        comment.isLiked = principal ? comment.likes.includes(principal.details._id) : false;
        comment.repliesCount = await this._findNumberOfReplies(comment._id);

        const findCommentQuery: DocumentQuery<DocumentComment[], DocumentComment> = this._repository
            .find({ repliedComment: comment._id })
        comment.replies = await this._addPaginationAndModify(findCommentQuery, principal, 0, 5);
        return comment;
    }

    private async _findNumberOfReplies(commentId: Types.ObjectId): Promise<number> {
        const comments = await this._repository.find({ repliedComment: commentId });
        return comments.length;
    }
}

