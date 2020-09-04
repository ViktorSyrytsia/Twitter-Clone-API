import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop, Ref } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';
import { ApiModel, ApiModelProperty } from 'swagger-express-typescript';

import { User } from '../../users/models/user.model';

@ApiModel({
    description: 'Model of tweet',
    name: 'Tweet',
})
export class Tweet extends Base {

    @ApiModelProperty({
        description: 'Tweet User',
        required: true,
        example: ['5f423af74c9234267e6aa6ea'],
    })
    @prop({ ref: () => User, required: false })
    public authorId: Ref<User>;

    @ApiModelProperty({
        description: 'Text',
        required: true,
        example: ['Some text'],
    })
    @prop({ required: true })
    public text: string;

    @ApiModelProperty({
        description: 'Likes',
        required: true,
        example: [['ObjectId1', 'ObjectId2']],
    })
    @prop({ ref: () => User, required: false })
    public likes: Ref<User>[]

    @ApiModelProperty({
        description: 'Retweets',
        required: true,
        example: ['ObjectId']
    })
    @prop({ ref: () => Tweet, required: false})
    public retweetedTweet: Ref<Tweet>;

    @ApiModelProperty({
        description: 'Tweet timestamp of created',
        required: true,
        example: ['20200801'],
    })
    @prop({ required: false, default: Date.now() })
    public createdAt: number;

    @ApiModelProperty({
        description: 'Tweet timestamp of lastEdited',
        required: true,
        example: ['20200801'],
    })
    @prop({ required: false, default: Date.now() })
    public lastEdited: number;

    constructor(tweet: CreateQuery<Tweet>) {
        super();
        Object.assign(this, tweet);
    }
}
export type DocumentTweet = DocumentType<Tweet>;
