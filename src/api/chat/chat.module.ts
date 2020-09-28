import { ContainerModule, interfaces } from 'inversify';

import { RoomService } from './services/room.service';
import { RoomRepository } from './repositories/room.repository';
import { WebSocketService } from './services/websocket.service';
import { WebSocketController } from './controllers/websocket.controller';
import { MessageRepository } from './repositories/message.repository';
import { MessageService } from './services/message.service';
import { RoomController } from './controllers/room.controller';
import { MessageController } from './controllers/message.controller';

export const ChatModule = new ContainerModule((bind: interfaces.Bind) => {
    bind(WebSocketController).to(WebSocketController);
    bind(WebSocketService).to(WebSocketService);
    bind(RoomService).to(RoomService);
    bind(RoomRepository).to(RoomRepository);
    bind(RoomController).to(RoomController);
    bind(MessageRepository).to(MessageRepository);
    bind(MessageService).to(MessageService);
    bind(MessageController).to(MessageController);
});
