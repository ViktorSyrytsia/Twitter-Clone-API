import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateQuery, DocumentQuery, Types, UpdateQuery } from 'mongoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentMessage, Message } from '../models/message.model';
import { RepositoryBase } from '../../base/repository.base';
import { Principal } from '../../auth/models/principal.model';

@injectable()
export class MessageRepository extends RepositoryBase<Message> {
    protected _repository: ReturnModelType<typeof Message>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, Message);
    }

    public async findById(messageId: Types.ObjectId): Promise<DocumentMessage> {
        return await this._repository.findById(messageId).lean();
    }

    public async findAllInRoom(
        roomId: Types.ObjectId,
        limit: number,
        principal?: Principal
    ): Promise<DocumentMessage[]> {
        const findMessagesQuery: DocumentQuery<DocumentMessage[], DocumentMessage> = this._repository
            .find({ room: roomId })
            .sort({ createdAt: -1 });
        return await this._addLazyLoadAndModify(findMessagesQuery, principal, limit);
    }

    public async createMessage(
        message: CreateQuery<Message>
    ): Promise<DocumentMessage> {
        return await this._repository.create(message);
    }

    public async updateMessage(
        messageId: Types.ObjectId,
        message: UpdateQuery<Message>
    ): Promise<DocumentMessage> {
        return await this._repository.findByIdAndUpdate(messageId, { ...message }, {
            new: true,
        }).lean();
    }

    public async deleteMessage(
        messageId: Types.ObjectId
    ): Promise<DocumentMessage> {
        return await this._repository.findByIdAndDelete(messageId).lean();
    }

    private async _addLazyLoadAndModify(
        findMessagesQuery: DocumentQuery<DocumentMessage[], DocumentMessage>,
        principal?: Principal,
        limit?: number
    ): Promise<DocumentMessage[]> {
        if (limit) {
            findMessagesQuery = findMessagesQuery.limit(limit);
        }
        return findMessagesQuery.lean()
    }

}
