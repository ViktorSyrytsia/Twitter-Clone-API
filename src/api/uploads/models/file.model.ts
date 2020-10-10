import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop, Ref } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';
import { ApiModel, ApiModelProperty } from 'swagger-express-typescript';

import { User } from '../../users/models/user.model';

@ApiModel({
    description: 'Model of file to save',
    name: 'File',
})
export class File extends Base {
    @ApiModelProperty({
        description: 'Name of the uploaded file',
        required: true,
        example: ['my_avatar.jpeg'],
    })
    @prop({ required: true })
    public originalName: string;

    @ApiModelProperty({
        description: 'Path to file',
        required: false,
        example: ['C://app/public/files/images/my_avatar.jpeg'],
    })
    @prop({ required: true })
    public path: string;

    @ApiModelProperty({
        description: 'Type of the uploaded file',
        required: true,
        example: ['audio, video, image', 'others'],
    })
    @prop({ required: true })
    public type: string;

    @ApiModelProperty({
        description: 'Extension if the uploaded to file',
        required: true,
        example: ['jpeg', 'mpeg', 'mp4'],
    })
    @prop({ required: true })
    public extension: string;

    @ApiModelProperty({
        description: 'ObjectId of file author',
        required: true,
        example: ['ObjectId'],
    })
    @prop({ ref: () => User, required: true })
    public author: Ref<User>;

    @ApiModelProperty({
        description: 'File timestamp',
        required: false,
        example: ['20200801'],
    })
    @prop({ required: false, default: Date.now() })
    public createdAt?: number;

    @ApiModelProperty({
        description: 'File timestamp of lastEdited',
        required: false,
        example: ['20200801'],
    })
    @prop({ required: false, default: Date.now() })
    public lastEdited?: number;

    constructor(file: CreateQuery<File>) {
        super();
        Object.assign(this, file);
    }
}

export type DocumentFile = DocumentType<File>;
