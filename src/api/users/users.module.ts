import { ContainerModule, interfaces } from 'inversify';

import { UsersController } from './controllers/users.controller';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';

export const UsersModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(UsersRepository).to(UsersRepository).inSingletonScope();
    bind(UsersService).to(UsersService).inSingletonScope();
    bind(UsersController).to(UsersController).inSingletonScope();
});
