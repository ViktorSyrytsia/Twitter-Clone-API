import { ContainerModule, interfaces } from 'inversify';

import { CommentRepository } from './repositories/comment.repository';
import { CommentService } from './services/comment.service';
import { CommentController } from './controllers/comment.controller';

export const CommentsModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(CommentController).to(CommentController).inSingletonScope();
    bind(CommentService).to(CommentService).inSingletonScope();
    bind(CommentRepository).to(CommentRepository).inSingletonScope();
});
