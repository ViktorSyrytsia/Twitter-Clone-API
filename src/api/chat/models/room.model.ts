import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop, Ref } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';
import { ApiModel, ApiModelProperty } from 'swagger-express-typescript';

import { User } from '../../users/models/user.model';
import { Message } from './message.model';

@ApiModel({
    description: 'Model of chat room',
    name: 'Room',
})
export class Room extends Base {
    @ApiModelProperty({
        description: 'Room name',
        required: true,
        example: ['ExampleName'],
    })
    @prop({ required: true })
    public name: string;

    @ApiModelProperty({
        description: 'Room creator or NULL if it`s a public room',
        required: true,
        example: ['ObjectId', null],
    })
    @prop({ ref: () => User, required: false, default: null })
    public creator: Ref<User> | null;

    @ApiModelProperty({
        description: 'Room`s users',
        required: false,
        example: [['ObjectId1, ObjectId2']],
    })
    @prop({ ref: () => User, required: false, default: [] })
    public users?: Ref<User>[];

    @ApiModelProperty({
        description: 'Room`s users',
        required: false,
        example: [['ObjectId1, ObjectId2']],
    })
    @prop({ ref: () => User, required: false, default: [] })
    public usersOnline?: Ref<User>[];

    @ApiModelProperty({
        description: 'Room`s messages',
        required: false,
        example: [['ObjectId1,ObjectId2,ObjectId3']],
    })
    @prop({ ref: () => Message, required: false, default: [] })
    public messages?: Ref<Message>[];

    @ApiModelProperty({
        description: 'Room time stamp',
        required: false,
        example: ['20200801'],
    })
    @prop({ required: false, default: Date.now() })
    public createdAt?: number;

    constructor(room: CreateQuery<Room>) {
        super();
        Object.assign(this, room);
    }
}

export type DocumentRoom = DocumentType<Room>;
