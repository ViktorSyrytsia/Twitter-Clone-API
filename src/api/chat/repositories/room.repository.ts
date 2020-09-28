import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateQuery, DocumentQuery, Types } from 'mongoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentRoom, Room } from '../models/room.model';
import { RepositoryBase } from '../../base/repository.base';

@injectable()
export class RoomRepository extends RepositoryBase<Room> {
    protected _repository: ReturnModelType<typeof Room>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, Room);
    }
    public async createRoom(room: CreateQuery<Room>): Promise<DocumentRoom> {
        return await this._repository.create(room);
    }

    public async deleteRoom(roomId: Types.ObjectId): Promise<DocumentRoom> {
        return await this._repository.findByIdAndDelete(roomId).lean();
    }

    public async findAll(skip: number, limit: number): Promise<DocumentRoom[]> {
        const findRoomsQuery: DocumentQuery<DocumentRoom[], DocumentRoom> = this._repository.find().sort({ createdAt: -1 });
        return await this._addLazyLoadAndModify(findRoomsQuery, skip, limit);
    }

    public async findById(roomId: Types.ObjectId): Promise<DocumentRoom> {
        return await this._repository.findById(roomId).lean();
    }

    public async findByName(roomName: string): Promise<DocumentRoom[]> {
        return await this._repository.find({
            name: {
                $regex: roomName,
                $options: 'i',
            },
        }).lean();
    }

    public async findRoomsBySubscriber(userId: Types.ObjectId): Promise<DocumentRoom[]> {
        return await this._repository.find({ subscribers: [userId] }).lean();
    }

    public async enterToRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        return await this._repository
            .findByIdAndUpdate(
                roomId,
                {
                    $push: {
                        usersOnline: userId,
                    },
                },
                { new: true }
            )
            .lean();
    }

    public async leaveFromRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        return await this._repository
            .findByIdAndUpdate(
                { _id: roomId },
                {
                    $pull: {
                        usersOnline: userId,
                    },
                },
                { new: true }
            )
            .lean();
    }

    public async subscribeToRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        return await this._repository
            .findByIdAndUpdate(
                roomId,
                {
                    $push: {
                        subscribers: userId,
                    },
                },
                { new: true }
            )
            .lean();
    }
    public async unsubscribeFromRoom(roomId: Types.ObjectId, userId: Types.ObjectId): Promise<DocumentRoom> {
        return await this._repository
            .findByIdAndUpdate(
                roomId,
                {
                    $pull: {
                        subscribers: userId,
                    },
                },
                { new: true }
            )
            .lean();
    }

    private async _addLazyLoadAndModify(
        findRoomsQuery: DocumentQuery<DocumentRoom[], DocumentRoom>,
        skip?: number,
        limit?: number
    ): Promise<DocumentRoom[]> {
        if (skip) {
            findRoomsQuery = findRoomsQuery.skip(skip);
        }
        if (limit) {
            findRoomsQuery = findRoomsQuery.limit(limit);
        }
        return findRoomsQuery
            .lean();
    }
}
