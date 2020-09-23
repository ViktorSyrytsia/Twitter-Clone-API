import { ContainerModule, interfaces } from 'inversify';

import { CommentRepository } from './repositories/comment.repository';
import { CommentService } from './services/comment.service';
import { CommentController } from './controllers/comment.controller';

export const CommentsModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(CommentController).toAutoFactory(CommentController);
    bind(CommentService).toAutoFactory(CommentService);
    bind(CommentRepository).toAutoFactory(CommentRepository);
});
