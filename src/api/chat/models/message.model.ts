import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop, Ref } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';
import { ApiModel, ApiModelProperty } from 'swagger-express-typescript';

import { User } from '../../users/models/user.model';
import { Room } from './room.model';

@ApiModel({
    description: 'Model of chat message',
    name: 'Message',
})
export class Message extends Base {
    @ApiModelProperty({
        description: 'Message`s author',
        required: true,
        example: ['ExampleName'],
    })
    @prop({ ref: () => User, required: true })
    public author: Ref<User>;

    @ApiModelProperty({
        description: 'Message`s room',
        required: true,
        example: ['ObjectId'],
    })
    @prop({ ref: () => Room, required: true })
    public room: Ref<Room>;

    @ApiModelProperty({
        description: 'Message body (text)',
        required: true,
        example: ['Hello my name is Jack'],
    })
    @prop({ required: true })
    public body: string;

    @ApiModelProperty({
        description: 'Message time stamp',
        required: false,
        example: ['20200801'],
    })
    @prop({ required: false, default: Date.now() })
    public createdAt: number;

    constructor(message: CreateQuery<Message>) {
        super();
        Object.assign(this, message);
    }
}

export type DocumentMessage = DocumentType<Message>;
