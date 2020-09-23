import { ContainerModule, interfaces } from 'inversify';

import { TweetsService } from './services/tweets.service';
import { TweetsController } from './controllers/tweets.controller';
import { TweetsRepository } from './repositories/tweets.repository';

export const TweetsModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(TweetsController).toAutoFactory(TweetsController);
    bind(TweetsService).toAutoFactory(TweetsService);
    bind(TweetsRepository).toAutoFactory(TweetsRepository);
});
