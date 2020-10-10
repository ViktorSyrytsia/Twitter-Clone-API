import { ContainerModule, interfaces } from 'inversify';
import { UploadsController } from './controllers/uploads.controller';
import { UploadsService } from './services/uploads.service';
import { UploadsRepository } from './repositories/uploads.repository';

export const UploadsModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(UploadsService).to(UploadsService);
    bind(UploadsRepository).to(UploadsRepository);
    bind(UploadsController).to(UploadsController);
});
