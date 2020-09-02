import {injectable} from 'inversify';
import {ReturnModelType} from '@typegoose/typegoose';
import {CreateQuery} from 'mongoose';

import {DatabaseConnection} from '../../../database/database-connection';
import {Comment, DocumentComment} from '../models/comment.model';
import {Like} from '../models/like.model';
import {RepositoryBase} from '../../base/repository.base';

@injectable()
export class CommentRepository extends RepositoryBase<Comment> {
    protected _repository: ReturnModelType<typeof Comment>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, Comment);
    }

    public async getByTweet(tweetId: string): Promise<Array<DocumentComment>> {
        return this._repository.find({tweetId});
    }

    public async getById(commentId: string): Promise<DocumentComment> {
        return this._repository.findById(commentId);
    }

    public async createComment(comment: CreateQuery<Comment>): Promise<DocumentComment> {
        return this._repository.create(comment);
    }

    public async updateComment(
        commentId: string,
        data: object
    ): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, data, {new: true});
    }

    public async removeComment(commentId: string): Promise<DocumentComment> {
        return this._repository.findByIdAndDelete(commentId);
    }

    public async likeComment(commentId: string, like: Like): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, {$push: {likes: like}});
    }

    public async unlikeComment(commentId: string, likeId: string): Promise<DocumentComment> {
        return this._repository.findByIdAndUpdate(commentId, {$pull: {likes: likeId}});
    }

}

