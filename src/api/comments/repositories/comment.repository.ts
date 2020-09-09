import {injectable} from 'inversify';
import {ReturnModelType} from '@typegoose/typegoose';
import {CreateQuery, DocumentQuery, Types} from 'mongoose';
import {DatabaseConnection} from '../../../database/database-connection';
import {DocumentComment, Comment} from '../models/comment.model';
import {RepositoryBase} from '../../base/repository.base';

const LIKES_LIMIT = 10;

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

    public async findByTweet(tweetId: Types.ObjectId, skip: number, limit: number): Promise<Object[]> {
        return this.findCommentsByParam({tweetId}, skip, limit);
    }

    async findRepliedCommentsByCommentId(commentId: Types.ObjectId, skip: number, limit: number) {
        return this.findCommentsByParam({replyToComment: commentId}, skip, limit);
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

    private async findNumberOfReplies(commentId: Types.ObjectId): Promise<number> {
        const comments = await this._repository.find({replyToComment: commentId});
        return comments.length;
    }

    private async findCommentsByParam(param: Object, skip: number, limit: number): Promise<Object[]> {
        let commentsQuery =
            this._repository.find(param).populate({
                path: 'likes',
                select: '_id username avatar',
                options: {
                    limit: LIKES_LIMIT
                }
            });

        if (skip) {
            commentsQuery = commentsQuery.skip(skip);
        }
        if (limit) {
            commentsQuery = commentsQuery.limit(limit);
        }

        commentsQuery[0].map(async (comment: DocumentComment) => {
            return {
                authorId: comment.authorId,
                tweetId: comment.tweetId,
                text: comment.text,
                likes: comment.likes,
                likesCount: comment.likesCount,
                replyToComment: await this.findNumberOfReplies(comment._id),
                createdAt: comment.createdAt,
                lastEdited: comment.lastEdited,
            };
        });

        return await Promise.all(commentsQuery[0]);
    }
}

