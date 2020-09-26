import { injectable } from 'inversify';
import { CreateQuery, Types } from 'mongoose';

import { RoomRepository } from '../repositories/room.repository';
import { DocumentRoom, Room } from '../models/room.model';
import { UsersRepository } from '../../users/repositories/users.repository';
import { UsersService } from '../../users/services/users.service';
import { HttpError } from '../../../shared/models/http.error';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';

@injectable()
export class RoomService {
    constructor(private _roomRepository: RoomRepository,
        private _userRepository: UsersRepository,
        private _userService: UsersService) { }

    public async deleteRoom(roomId: Types.ObjectId): Promise<DocumentRoom> {
        return this._roomRepository.deleteRoom(roomId);
    }

    public async createRoom(creatorId: Types.ObjectId, roomName: string, isPublic: boolean, userToAdd: Types.ObjectId) {
        try {
            let room: DocumentRoom;
            if (isPublic) {
                room = await this._roomRepository.createRoom(new Room({ creator: null, name: roomName }));
            } else {
                room = await this._roomRepository.createRoom(new Room({ creator: creatorId, name: roomName }));
            }
            await this._roomRepository.subscribeToRoom(room.id, creatorId)
            await this._userService.subscribeToChatRoom(creatorId, room.id);
            await this._roomRepository.enterToRoom(room.id, creatorId);
            if (userToAdd) {
                await this._roomRepository.subscribeToRoom(room.id, userToAdd);
                await this._userService.subscribeToChatRoom(userToAdd, room.id);
                await this._roomRepository.enterToRoom(room.id, userToAdd);
            }
            return await this._roomRepository.findById(room.id);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }

    }

    public async addMessageToRoom(
        roomId: Types.ObjectId,
        messageId: Types.ObjectId
    ): Promise<DocumentRoom> {
        try {
            return this._roomRepository.addMessageToRoom(roomId, messageId);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async deleteMessageFromRoom(
        roomId: Types.ObjectId,
        messageId: Types.ObjectId
    ): Promise<DocumentRoom> {
        return this._roomRepository.deleteMessageFromRoom(roomId, messageId);
    }


    public async findRoomById(roomId: Types.ObjectId) {
        return this._roomRepository.findById(roomId);
    }

    public async findAllRooms(
        skip: number,
        limit: number
    ): Promise<DocumentRoom[]> {
        try {
            return this._roomRepository.findAll(skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message)
        }

    }

    public async enterToChatRoom(
        roomId: Types.ObjectId,
        userId: Types.ObjectId
    ): Promise<DocumentRoom> {
        return await this._roomRepository.enterToRoom(roomId, userId);
    }

    public async leaveFromChatRoom(
        roomId: Types.ObjectId,
        userId: Types.ObjectId,
    ): Promise<DocumentRoom> {
        return this._roomRepository.leaveFromRoom(roomId, userId);
    }

    public async subscribeToChatRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        try {
            return await this._roomRepository.subscribeToRoom(roomId, userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message)
        }

    }

    public async unsubscribeFromRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        return await this._roomRepository.unsubscribeFromRoom(roomId, userId);
    }

}
