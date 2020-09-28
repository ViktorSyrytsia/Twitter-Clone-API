import { Server } from 'http';
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import * as socketIo from 'socket.io';
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
        this._socketServer.on('connection', (socket: SocketIO.Socket) => {

            socket.on('USER:CONNECT', async ({ userId }) => {
                try {
                    const user: DocumentUser = await this._userService.findById(new Types.ObjectId(userId));
                    if (!user) {
                        throw new Error('User not found!');
                    }
                    await this._websocketService.userConnect(this._socketServer, socket, user);
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }
            });

            socket.on('ROOM:ENTER', async ({ roomId, userId }) => {
                try {
                    const room = await this._roomService.findRoomById(roomId);
                    if (!room) {
                        throw new Error('Room not found');
                    }
                    const user = await this._userService.findById(userId);
                    if (!user) {
                        throw new Error('User not found!');
                    }
                    if (!room.subscribers.includes(user._id)) {
                        throw new Error('You do not have permission to do this');
                    }
                    await this._websocketService.roomEnter(this._socketServer, room._id, user._id,);
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }
            });

            socket.on('ROOM:LEAVE', async ({ roomId, userId }) => {
                try {
                    const room = await this._roomService.findRoomById(roomId);
                    if (!room) {
                        throw new Error('Room not found');
                    }
                    const user = await this._userService.findById(userId);
                    if (!user) {
                        throw new Error('User not found');
                    }
                    await this._websocketService.roomLeave(this._socketServer, room._id, user._id,);
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }
            });

            socket.on(
                'MESSAGE:NEW',
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
                        if (!room.subscribers.includes(user._id)) {
                            throw new Error('You do not have permission to do this');
                        }
                        await this._websocketService.messageNew(this._socketServer, new Types.ObjectId(roomId), new Types.ObjectId(userId), messageBody);
                    } catch (error) {
                        this._socketServer.in(socket.id).emit('connect_error', error.message);
                    }

                }
            );

            socket.on('MESSAGE:DELETE', async ({ roomId, userId, messageId }) => {
                try {
                    const room: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(roomId));
                    if (!room) {
                        throw new Error('Room not found');
                    }
                    const user: DocumentUser = await this._userService.findById(new Types.ObjectId(userId));
                    if (!user) {
                        throw new Error('User not found');
                    }
                    const message: DocumentMessage = await this._messageService.findMessageById(new Types.ObjectId(roomId));
                    if (!message) {
                        throw new Error('Message not found');
                    }
                    if (!room.subscribers.includes(user._id)) {
                        throw new Error('You do not have permission to do this');
                    }
                    await this._websocketService.messageDelete(this._socketServer, new Types.ObjectId(roomId), new Types.ObjectId(messageId));
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }

            });

            socket.on(
                'MESSAGE:EDIT',
                async ({ roomId, userId, messageId, newMessageBody }) => {
                    try {
                        const room: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(roomId));
                        if (!room) {
                            throw new Error('Room not found');
                        }
                        const user: DocumentUser = await this._userService.findById(new Types.ObjectId(userId));
                        if (!user) {
                            throw new Error('User not found');
                        }
                        const message: DocumentMessage = await this._messageService.findMessageById(new Types.ObjectId(roomId));
                        if (!message) {
                            throw new Error('Message not found');
                        }
                        if (!room.subscribers.includes(user._id)) {
                            throw new Error('You do not have permission to do this');
                        }
                        if (message.author !== user._id) {
                            throw new Error('You do not have permission to edit this message');
                        }
                        await this._websocketService.messageEdit(this._socketServer, new Types.ObjectId(roomId), new Types.ObjectId(messageId), newMessageBody);
                    } catch (error) {
                        this._socketServer.in(socket.id).emit('connect_error', error.message);
                    }

                }
            );

            socket.on('disconnect', async () => {
                try {
                    const user: DocumentUser = await this._userService.findUserBySocket(socket.id);
                    if (!user) {
                        throw new Error('User not found');
                    }
                    await this._websocketService.userDisconnect(this._socketServer, socket, user);
                } catch (error) {
                    this._socketServer.in(socket.id).emit('connect_error', error.message);
                }

            });
        });
    }
}
