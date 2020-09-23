import { ContainerModule, interfaces } from 'inversify';

import { AuthService } from './services/auth.service';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AuthController } from './controllers/auth.controller';
import { MailService } from './services/mail.service';
import { TokenService } from './services/token.service';
import { TokenRepository } from './repositories/token.repository';
import { ActivatedUserMiddleware } from './middlewares/activated.user.middleware';

export const AuthModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(AuthMiddleware).to(AuthMiddleware).inSingletonScope();
    bind(ActivatedUserMiddleware).to(ActivatedUserMiddleware).inSingletonScope();
    bind(AuthService).to(AuthService).inSingletonScope();
    bind(MailService).to(MailService).inSingletonScope();
    bind(AuthController).to(AuthController).inSingletonScope();
    bind(TokenService).to(TokenService).inSingletonScope();
    bind(TokenRepository).to(TokenRepository).inSingletonScope();
});
