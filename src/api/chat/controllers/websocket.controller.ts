import { Server } from 'http';
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import * as socketIo from 'socket.io';
import * as encrypt from 'socket.io-encrypt';
import { DocumentUser } from '../../users/models/user.model';

import { UsersService } from '../../users/services/users.service';
import { DocumentMessage } from '../models/message.model';
import { DocumentRoom } from '../models/room.model';
import { MessageService } from '../services/message.service';
import { RoomService } from '../services/room.service';

import { WebSocketService } from '../services/websocket.service';

@injectable()
export class WebSocketController {
    private _socketServer: SocketIO.Server;

    constructor(private _websocketService: WebSocketService,
        private _userService: UsersService,
        private _roomService: RoomService,
        private _messageService: MessageService) { }

    public listenSocket(server: Server) {
        this._socketServer = socketIo(server);
        this._socketServer.use(encrypt('secret'));
        this._socketServer.on('connection', (socket: SocketIO.Socket) => {
            console.log('User connected:', socket.id);
            socket.on('ROOM:JOIN', async ({ roomId, userId }) => {
                try {
                    const user = await this._userService.findById(userId);
                    if (!user) {
                        throw new Error('User not found!')
                    }
                    const room = await this._roomService.findRoomById(roomId);
                    if (!room) {
                        throw new Error('Room not found')
                    }
                    const isSubscribe = user.subscribedRooms.find(room => room.toString() === roomId.toString())
                    if (!isSubscribe) {
                        throw new Error('You do not have permission to log in');
                    }

                    await this._websocketService.roomJoin(
                        socket,
                        this._socketServer,
                        room._id,
                        user._id,
                    );
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }
            });

            socket.on('ROOM:LEAVE', async ({ roomId, userId }) => {
                try {
                    const user = await this._userService.findById(userId);
                    if (!user) {
                        throw new Error('User not found!')
                    }
                    const room = await this._roomService.findRoomById(roomId);
                    if (!room) {
                        throw new Error('Room not found')
                    }
                    await this._websocketService.roomLeave(
                        socket,
                        this._socketServer,
                        room._id,
                        user._id,
                    );
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }
            });

            socket.on(
                'ROOM:NEW_MESSAGE',
                async ({ roomId, userId, messageBody }) => {
                    try {
                        const room: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(roomId));
                        if (!room) {
                            throw new Error('Room not found');
                        }
                        const user: DocumentUser = await this._userService.findById(new Types.ObjectId(userId));
                        if (!user) {
                            throw new Error('User not found');
                        }
                        await this._websocketService.messageNew(
                            this._socketServer,
                            new Types.ObjectId(roomId),
                            new Types.ObjectId(userId),
                            messageBody
                        );
                    } catch (error) {
                        this._socketServer.in(socket.id).emit('connect_error', error.message);
                    }

                }
            );

            socket.on('ROOM:DELETE_MESSAGE', async ({ roomId, messageId }) => {
                try {
                    const room: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(roomId));
                    if (!room) {
                        throw new Error('Room not found');
                    }
                    const message: DocumentMessage = await this._messageService.findMessageById(new Types.ObjectId(roomId));
                    if (!message) {
                        throw new Error('Message not found');
                    }
                    await this._websocketService.messageDelete(
                        this._socketServer,
                        new Types.ObjectId(roomId),
                        new Types.ObjectId(messageId)
                    );
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }

            });

            socket.on(
                'ROOM:EDIT_MESSAGE',
                async ({ roomId, userId, messageId, newMessageBody }) => {
                    try {
                        const room: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(roomId));
                        if (!room) {
                            throw new Error('Room not found');
                        }
                        const message: DocumentMessage = await this._messageService.findMessageById(new Types.ObjectId(roomId));
                        if (!message) {
                            throw new Error('Message not found');
                        }
                        const user: DocumentUser = await this._userService.findById(new Types.ObjectId(userId));
                        if (!user) {
                            throw new Error('User not found');
                        }
                        if (message.author !== user._id) {
                            throw new Error('You do not have permission to edit this message');
                        }
                        await this._websocketService.messageEdit(
                            this._socketServer,
                            new Types.ObjectId(roomId),
                            new Types.ObjectId(messageId),
                            newMessageBody
                        );
                    } catch (error) {
                        this._socketServer.in(socket.id).emit('connect_error', error.message);
                    }

                }
            );

            // socket.on('disconnect', async () => {
            //     await this._websocketService.disconect(
            //         this._socketServer,
            //         socket
            //     );
            // });
        });
    }
}
