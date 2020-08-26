import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';
import { ApiModel, ApiModelProperty } from 'swagger-express-typescript';
import { RolesEnum } from '../enums/users.enum';

@ApiModel({
    description: 'Model of user',
    name: 'User',
})
export class User extends Base {
    @ApiModelProperty({
        description: 'User firstname',
        required: true,
        example: ['ExampleName'],
    })
    @prop({ required: true })
    public firstName: string;

    @ApiModelProperty({
        description: 'User lastname',
        required: true,
        example: ['ExampleLastname'],
    })
    @prop({ required: true })
    public lastName: string;

    @ApiModelProperty({
        description: 'User nickname',
        required: true,
        example: ['ExampleUsername'],
    })
    @prop({ required: true })
    public username: string;

    @ApiModelProperty({
        description: 'User email',
        required: true,
        example: ['example@gmail.com'],
    })
    @prop({ required: true })
    public email: string;

    @ApiModelProperty({
        description: 'User role: \'User\' = \'user\', \'Admin\' = \'admin\'',
        required: true,
        example: ['user', 'admin'],
    })
    @prop({ required: true, default: 'user' })
    public role: RolesEnum;

    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    constructor(user: CreateQuery<User>) {
        super();
        Object.assign(this, user);
    }
}

export type DocumentUser = DocumentType<User>;
