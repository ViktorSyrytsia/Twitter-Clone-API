import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { injectable } from 'inversify';
import { Types } from 'mongoose';

import { HttpError } from '../../../shared/models/http.error';
import { UsersService } from '../../users/services/users.service';
import { DocumentRoom, Room } from '../models/room.model';
import { RoomRepository } from '../repositories/room.repository';



@injectable()
export class RoomService {
    constructor(private _roomRepository: RoomRepository,
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
            if (userToAdd) {
                await this._roomRepository.subscribeToRoom(room.id, userToAdd);
            }
            return await this._roomRepository.findById(room.id);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findRoomById(roomId: Types.ObjectId): Promise<DocumentRoom> {
        try {
            return this._roomRepository.findById(roomId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findRoomByName(roomName: string): Promise<DocumentRoom[]> {
        try {
            return this._roomRepository.findByName(roomName);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findAllRooms(skip: number, limit: number): Promise<DocumentRoom[]> {
        try {
            return this._roomRepository.findAll(skip, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message)
        }
    }

    public async findRoomsBySubscriber(userId: Types.ObjectId): Promise<DocumentRoom[]> {
        try {
            return this._roomRepository.findRoomsBySubscriber(userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message)
        }
    }

    public async enterToChatRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        try {
            return await this._roomRepository.enterToRoom(roomId, userId);
        } catch (error) {
            throw new Error(error.message)
        }
    }

    public async leaveFromChatRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        try {
            return this._roomRepository.leaveFromRoom(roomId, userId);
        } catch (error) {
            throw new Error(error.message)
        }
    }

    public async subscribeToChatRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        try {
            return await this._roomRepository.subscribeToRoom(roomId, userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message)
        }

    }

    public async unsubscribeFromRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        try {
            return await this._roomRepository.unsubscribeFromRoom(roomId, userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message)
        }
    }

}
