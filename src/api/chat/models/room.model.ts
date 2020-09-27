import { DocumentType, prop, Ref } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { CreateQuery } from 'mongoose';

import { ApiModel, ApiModelProperty } from 'swagger-express-typescript';
import { User } from '../../users/models/user.model';

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
    public subscribers?: Ref<User>[];

    @ApiModelProperty({
        description: 'Room`s users',
        required: false,
        example: [['ObjectId1, ObjectId2']],
    })
    @prop({ ref: () => User, required: false, default: [] })
    public usersOnline?: Ref<User>[];

    @ApiModelProperty({
        description: 'Room time stamp',
        required: false,
        example: ['20200801'],
    })
    @prop({ required: false, default: Date.now() })
    public createdAt?: number;


    @ApiModelProperty({
        description: 'Room update time stamp',
        required: false,
        example: ['20200890'],
    })
    @prop({ required: false, default: Date.now() })
    public updatedAt?: number;

    constructor(room: CreateQuery<Room>) {
        super();
        Object.assign(this, room);
    }
}

export type DocumentRoom = DocumentType<Room>;
