import { ContainerModule, interfaces } from 'inversify';

import { AuthService } from './services/auth.service';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AuthController } from './controllers/auth.controller';
import { MailService } from './services/mail.service';
import { TokenService } from './services/token.service';
import { TokenRepository } from './repositories/token.repository';
import { ActivatedUserMiddleware } from './middlewares/activated.user.middleware';

export const AuthModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(AuthMiddleware).toAutoFactory(AuthMiddleware);
    bind(ActivatedUserMiddleware).toAutoFactory(ActivatedUserMiddleware);
    bind(AuthService).toAutoFactory(AuthService);
    bind(MailService).toSelf().inSingletonScope();
    bind(AuthController).toAutoFactory(AuthController);
    bind(TokenService).toAutoFactory(TokenService);
    bind(TokenRepository).toAutoFactory(TokenRepository);
});
