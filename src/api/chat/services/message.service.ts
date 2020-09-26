import { injectable } from 'inversify';
import { UpdateQuery, CreateQuery, Types } from 'mongoose';

import { RoomRepository } from '../repositories/room.repository';
import { DocumentRoom, Room } from '../models/room.model';
import { DocumentMessage } from '../models/message.model';
import { MessageRepository } from '../repositories/message.repository';

@injectable()
export class MessageService {
    constructor(private _messageRepository: MessageRepository) { }

    public async createNewMessage(
        userId: Types.ObjectId,
        roomId: Types.ObjectId,
        messageBody: string
    ): Promise<DocumentMessage> {
        return this._messageRepository.createMessage({
            author: userId,
            room: roomId,
            body: messageBody,
            createdAt: Date.now(),
        });
    }

    public deleteMessage(messageId: Types.ObjectId): Promise<DocumentMessage> {
        try {
            return this._messageRepository.deleteMessage(messageId);
        } catch (error) {
            throw new Error(error.message);
        }

    }

    public async editMessage(
        messageId: Types.ObjectId,
        newMessageBody: string
    ): Promise<DocumentMessage> {
        try {
            return await this._messageRepository.updateMessage(messageId, newMessageBody);
        } catch (error) {
            throw new Error(error.message);
        }

    }

    public async findMessageById(
        messageId: Types.ObjectId
    ): Promise<DocumentMessage> {
        return this._messageRepository.findById(messageId);
    }
}
