import { ContainerModule, interfaces } from 'inversify';

import { TweetsService } from './services/tweets.service';
import { TweetsController } from './controllers/tweets.controller';
import { TweetsRepository } from './repositories/tweets.repository';

export const TweetsModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(TweetsController).to(TweetsController).inSingletonScope();
    bind(TweetsService).to(TweetsService).inSingletonScope();
    bind(TweetsRepository).to(TweetsRepository).inSingletonScope();
});
