import { injectable } from 'inversify';
import { Types } from 'mongoose';

import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { DocumentMessage } from '../models/message.model';
import { DocumentRoom } from '../models/room.model';
import { MessageService } from './message.service';
import { RoomService } from './room.service';

@injectable()
export class WebSocketService {
    constructor(private _roomService: RoomService, private _messageService: MessageService, private _usersService: UsersService) { }

    public async userConnect(socketServer: SocketIO.Server, socket: SocketIO.Socket, user: DocumentUser) {
        try {
            const rooms: DocumentRoom[] = await this._roomService.findAllRooms(user._id);
            for (const room of rooms) {
                socket.join(room.id.toString());
            }
            const connectedUser: DocumentUser = await this._usersService.updateConnection(user._id, socket.id);
            socketServer.emit('USER:CONNECTED', connectedUser);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async roomEnter(socketServer: SocketIO.Server, roomId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
        try {
            let room: DocumentRoom = await this._roomService.findRoomById(roomId);
            if (!room.usersOnline.includes(userId)) {
                room = await this._roomService.enterToChatRoom(roomId, userId);
            }
            socketServer.in(roomId.toString()).emit('ROOM:SET_USERS', room.usersOnline);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async roomLeave(socketServer: SocketIO.Server, roomId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
        try {
            const room: DocumentRoom = await this._roomService.leaveFromChatRoom(roomId, userId);
            socketServer.in(roomId.toString()).emit('ROOM:SET_USERS', room.usersOnline);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async messageNew(socketServer: SocketIO.Server, roomId: Types.ObjectId, userId: Types.ObjectId, messageBody: string): Promise<void> {
        try {
            const newMessage: DocumentMessage = await this._messageService.createNewMessage(userId, roomId, messageBody);
            socketServer.in(roomId.toString()).emit('MESSAGE:NEW', newMessage);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async messageDelete(socketServer: SocketIO.Server, roomId: Types.ObjectId, messageId: Types.ObjectId): Promise<void> {
        try {
            const deletedMessage: DocumentMessage = await this._messageService.deleteMessage(messageId);
            socketServer.in(roomId.toString()).emit('MESSAGE:DELETE', deletedMessage);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async messageEdit(socketServer: SocketIO.Server, roomId: Types.ObjectId, messageId: Types.ObjectId, messageBody: string) {
        try {
            const editedMessage: DocumentMessage = await this._messageService.editMessage(messageId, messageBody);
            socketServer.in(roomId.toString()).emit('MESSAGE:EDIT', editedMessage);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async userDisconnect(socketServer: SocketIO.Server, socket: SocketIO.Socket, user: DocumentUser): Promise<void> {
        try {
            const rooms: DocumentRoom[] = await this._roomService.findAllRooms(user._id);
            for (const room of rooms) {
                socket.leave(room.id.toString());
            }
            const disconnectedUser: DocumentUser = await this._usersService.updateConnection(user._id, null);
            socketServer.emit('USER:DISCONNECTED', disconnectedUser);
        } catch (error) {
            throw new Error(error.message);
        }
    }
}
