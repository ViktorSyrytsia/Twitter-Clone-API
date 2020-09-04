import {injectable} from 'inversify';
import {ReturnModelType} from '@typegoose/typegoose';
import {CreateQuery, DocumentQuery, Types} from 'mongoose';

import {DatabaseConnection} from '../../../database/database-connection';
import {Comment, DocumentComment} from '../models/comment.model';
import {RepositoryBase} from '../../base/repository.base';

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

    public async findByTweet(tweetId: Types.ObjectId,
                             page: number,
                             limit: number
    ): Promise<DocumentComment[]> {
        let commentsQuery: DocumentQuery<DocumentComment[], DocumentComment> =
            this._repository.find({tweetId});

        if (page) {
            commentsQuery = commentsQuery.skip(page);
        }
        if (limit) {
            commentsQuery = commentsQuery.limit(limit);
        }
        return commentsQuery;
    }

    public async createComment(comment: CreateQuery<Comment>): Promise<DocumentComment> {
        return this._repository.create(comment);
    }

    public async updateComment(
        commentId: Types.ObjectId,
        data: object
    ): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, data, {new: true});
    }

    public async removeComment(commentId: Types.ObjectId): Promise<DocumentComment> {
        return this._repository.findByIdAndDelete(commentId);
    }

    public async likeComment(commentId: Types.ObjectId,
                             userId: Types.ObjectId
    ): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, {$push: {likes: userId}});
    }

    public async unlikeComment(commentId: Types.ObjectId,
                               userId: Types.ObjectId
    ): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, {$pull: {likes: userId}});
    }

}

