import {injectable} from 'inversify';

import {CommentRepository} from '../repositories/comment.repository';
import {Comment, DocumentComment} from '../models/comment.model';
import {Like} from '../models/like.model';

@injectable()
export class CommentService {
    constructor(private _commentRepository: CommentRepository) {
    }

    public public;

    public async findById(id: string): Promise<DocumentComment> {
        return this._commentRepository.getById(id);
    }

    public async findByTweet(tweetId: string): Promise<Array<DocumentComment>> {
        return this._commentRepository.getByTweet(tweetId);
    }

    public async createComment(comment: Comment): Promise<DocumentComment> {
        return this._commentRepository.createComment(comment);
    }


    public async updateById(id: string, comment: Comment): Promise<DocumentComment> {
        return this._commentRepository.updateComment(id, comment);
    }

    public async likeComment(id: string): Promise<DocumentComment> {
        const like: Like = new Like();
        return this._commentRepository.likeComment(id, like);
    }

    public async unlikeComment(commentId: string, likeId: string): Promise<DocumentComment> {
        return this._commentRepository.unlikeComment(commentId, likeId);
    }

    public async deleteComment(id: string): Promise<DocumentComment> {
        return this._commentRepository.removeComment(id);
    }
}
