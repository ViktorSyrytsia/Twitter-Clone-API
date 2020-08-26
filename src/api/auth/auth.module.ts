import { ContainerModule, interfaces } from 'inversify';

import { AuthService } from './services/auth.service';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AuthController } from './controllers/auth.controller';
import { MailService } from './services/mail.service';
import { TokenService } from './services/token.service';
export const AuthModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(AuthMiddleware).to(AuthMiddleware);
    bind(AuthService).to(AuthService);
    bind(MailService).to(MailService);
    bind(AuthController).to(AuthController);
    bind(TokenService).to(TokenService);
});
