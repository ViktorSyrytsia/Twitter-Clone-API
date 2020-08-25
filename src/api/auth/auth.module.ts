import { ContainerModule, interfaces } from 'inversify';

import { AuthService } from './services/auth.service';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AuthController } from './controllers/auth.controller';

export const AuthModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(AuthMiddleware).to(AuthMiddleware);
    bind(AuthService).to(AuthService);
    bind(AuthController).to(AuthController);
});
