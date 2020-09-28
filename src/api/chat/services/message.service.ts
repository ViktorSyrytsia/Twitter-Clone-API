import { INTERNAL_SERVER_ERROR } from 'http-status-codes';
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { HttpError } from '../../../shared/models/http.error';
import { Principal } from '../../auth/models/principal.model';

import { DocumentMessage } from '../models/message.model';
import { MessageRepository } from '../repositories/message.repository';


@injectable()
export class MessageService {
    constructor(private _messageRepository: MessageRepository) { }

    public async createNewMessage(userId: Types.ObjectId, roomId: Types.ObjectId, messageBody: string): Promise<DocumentMessage> {
        try {
            return this._messageRepository.createMessage({
                author: userId,
                room: roomId,
                body: messageBody,
            });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public deleteMessage(messageId: Types.ObjectId): Promise<DocumentMessage> {
        try {
            return this._messageRepository.deleteMessage(messageId);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async editMessage(messageId: Types.ObjectId, newMessageBody: string): Promise<DocumentMessage> {
        try {
            return await this._messageRepository.updateMessage(messageId, { newMessageBody, updatedAt: Date.now() });
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async findMessageById(messageId: Types.ObjectId): Promise<DocumentMessage> {
        try {
            return this._messageRepository.findById(messageId);
        } catch (error) {
            throw new Error(error.message);
        }
    }

    public async findMessagesByRoom(roomId: Types.ObjectId, limit: number, principal?: Principal): Promise<DocumentMessage[]> {
        try {
            return this._messageRepository.findAllInRoom(roomId, limit);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }


}
