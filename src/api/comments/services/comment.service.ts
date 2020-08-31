import {injectable} from 'inversify';
import {UpdateQuery} from 'mongoose';

import {CommentRepository} from '../repositories/comment.repository';
import {DocumentComment, Comment} from '../models/comment.model';

@injectable()
export class CommentService {
    constructor(private _commentRepository: CommentRepository) {}

    public public;
}
