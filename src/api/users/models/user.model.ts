import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';

export class User extends Base {

    @prop({ required: true })
    public firstName: string;

    @prop({ required: true })
    public lastName: string;

    @prop({ required: true })
    public username: string;

    @prop({ required: true })
    public email: string;

    @prop({ required: true, default: 'user' })
    public role: string;

    public get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    constructor(user: CreateQuery<User>) {
        super();
        Object.assign(this, user);
    }
}

export type DocumentUser = DocumentType<User>;
