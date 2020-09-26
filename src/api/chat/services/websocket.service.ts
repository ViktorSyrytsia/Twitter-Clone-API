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
    constructor(
        private _roomService: RoomService,
        private _messageService: MessageService,
        private _usersService: UsersService
    ) { }

    public async roomJoin(
        socket: SocketIO.Socket,
        socketServer: SocketIO.Server,
        roomId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<void> {
        socket.join(roomId.toString());
        try {
            const user: DocumentUser = await this._usersService.enterToChatRoom(
                userId,
                roomId,
                socket.id
            );
            let room: DocumentRoom = await this._roomService.findRoomById(roomId);
            if (!room.usersOnline.includes(userId)) {
                room = await this._roomService.enterToChatRoom(roomId, userId)
            }
            socketServer.in(roomId.toString()).emit('ROOM:SET_USERS', room.usersOnline);
        } catch (error) {
            throw new Error(error.message)
        }
    }

    public async roomLeave(
        socket: SocketIO.Socket,
        socketServer: SocketIO.Server,
        roomId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<void> {
        socket.leave(roomId.toString());
        try {
            const user = await this._usersService.leaveFromChatRoom(
                userId
            );
            const room: DocumentRoom = await this._roomService.leaveFromChatRoom(roomId, userId);
            socketServer.in(roomId.toString()).emit('ROOM:SET_USERS', room.usersOnline);
        } catch (error) {
            throw new Error(error.message)
        }
    }

    public async messageNew(
        socketServer: SocketIO.Server,
        roomId: Types.ObjectId,
        userId: Types.ObjectId,
        messageBody: string
    ): Promise<void> {
        try {
            const newMessage: DocumentMessage = await this._messageService.createNewMessage(
                userId,
                roomId,
                messageBody
            );
            await this._roomService.addMessageToRoom(roomId, newMessage._id);
            console.log(newMessage);

            socketServer.in(roomId.toString()).emit('ROOM:NEW_MESSAGE', newMessage);
        } catch (error) {
            throw new Error(error.message)
        }
    }

    public async messageDelete(
        socketServer: SocketIO.Server,
        roomId: Types.ObjectId,
        messageId: Types.ObjectId
    ): Promise<void> {
        await this._roomService.deleteMessageFromRoom(roomId, messageId);
        await this._messageService.deleteMessage(messageId);
        socketServer
            .in(roomId.toString())
            .emit('ROOM:DELETE_MESSAGE', 'Message deleted');
    }

    public async messageEdit(
        socketServer: SocketIO.Server,
        roomId: Types.ObjectId,
        messageId: Types.ObjectId,
        messageBody: string
    ) {
        const editedMessage: DocumentMessage = await this._messageService.editMessage(messageId, messageBody);
        socketServer.in(roomId.toString()).emit('ROOM:EDIT_MESSAGE', editedMessage);
    }

    //   public async disconect(
    //         socketServer: SocketIO.Server,
    //         socket: SocketIO.Socket
    //     ) {
    //         let user: DocumentUser = await this._usersService.findUserBySocketId(
    //             socket.id
    //         );
    //         if (user) {
    //             let room: DocumentRoom = await this._roomService.findRoomById(
    //                 user.currentRoomId
    //             );
    //             room = await this._roomService.deleteUserFromRoom(
    //                 user._id,
    //                 room._id
    //             );  
    //             user = await this._usersService.updateUserById(user._id, {
    //                 socketID: '',
    //                 currentRoomId: '',
    //             });
    //             socketServer.in(room.name).emit('ROOM:SET_USERS', room.users);
    //         }
    //     }
}
