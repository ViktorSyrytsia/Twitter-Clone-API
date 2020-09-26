import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateQuery, Types, UpdateQuery } from 'mongoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentMessage, Message } from '../models/message.model';
import { RepositoryBase } from '../../base/repository.base';

@injectable()
export class MessageRepository extends RepositoryBase<Message> {
    protected _repository: ReturnModelType<typeof Message>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, Message);
    }

    public async findById(messageId: Types.ObjectId): Promise<DocumentMessage> {
        return this._repository.findById(messageId);
    }

    public async findAllInRoom(
        roomId: Types.ObjectId
    ): Promise<DocumentMessage[]> {
        return this._repository.find({ room: roomId });
    }

    public async createMessage(
        message: CreateQuery<Message>
    ): Promise<DocumentMessage> {
        return this._repository.create(message);
    }

    public async updateMessage(
        messageId: Types.ObjectId,
        messageBody: string
    ): Promise<DocumentMessage> {
        return this._repository.findByIdAndUpdate(messageId, { body: messageBody }, {
            new: true,
        });
    }

    public async deleteMessage(
        messageId: Types.ObjectId
    ): Promise<DocumentMessage> {
        return this._repository.findByIdAndDelete(messageId);
    }
}
