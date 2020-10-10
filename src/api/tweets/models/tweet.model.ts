import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop, Ref } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';
import { ApiModel, ApiModelProperty, SwaggerDefinitionConstant } from 'swagger-express-typescript';

import { User } from '../../users/models/user.model';

@ApiModel({
    description: 'Model of tweet',
    name: 'Tweet',
})
export class Tweet extends Base {

    @ApiModelProperty({
        description: 'Author id of tweet ',
        required: true,
        example: ['5f423af74c9234267e6aa6ea'],
        type: SwaggerDefinitionConstant.Response.Type.STRING,
    })
    @prop({ ref: () => User, required: true })
    public author: Ref<User>;

    @ApiModelProperty({
        description: 'Text of tweet',
        required: true,
        example: ['some tweet..'],
        type: SwaggerDefinitionConstant.Response.Type.STRING,
    })
    @prop({ required: true })
    public text: string;

    @ApiModelProperty({
        description: 'Likes array of tweet',
        required: false,
        example: [['5f423af74c9234267e6aa6ea', '3r423af74c95f4267e6ak612']],
        type: SwaggerDefinitionConstant.Response.Type.STRING,

    })
    @prop({ ref: () => User, required: false, default: [] })
    public likes?: Ref<User>[];

    @ApiModelProperty({
        description: 'Id of retweeted tweet',
        required: false,
        example: ['5f423af74c9234267e6aa6ea'],
        type: SwaggerDefinitionConstant.Response.Type.STRING,
    })
    @prop({ ref: () => Tweet, required: false })
    public retweetedTweet?: Ref<Tweet>;

    @ApiModelProperty({
        description: 'Tweet creation time stamp',
        required: false,
        example: ['1599137650207'],
        type: SwaggerDefinitionConstant.Response.Type.NUMBER,
    })
    @prop({ required: false, default: Date.now() })
    public createdAt?: number;

    @ApiModelProperty({
        description: 'Time stamp of last tweet edition',
        required: false,
        example: ['1599137650207'],
        type: SwaggerDefinitionConstant.Response.Type.NUMBER,
    })
    @prop({ required: false, default: Date.now() })
    public lastEdited?: number;

    @ApiModelProperty({
        description: 'Retweets',
        required: false,
        example: [['5f423af74c9234267e6aa6ea', '3r423af74c95f4267e6ak612']],
        type: SwaggerDefinitionConstant.Response.Type.ARRAY,
    })
    public retweets?: DocumentTweet[];

    @ApiModelProperty({
        description: 'Comments count',
        required: false,
        example: [23],
        type: SwaggerDefinitionConstant.Response.Type.NUMBER,
    })
    public commentsCount?: Number;

    @ApiModelProperty({
        description: 'Number of likes',
        required: false,
        example: ['3', '15'],
        type: SwaggerDefinitionConstant.Response.Type.NUMBER,
    })
    public likesCount?: Number;

    @ApiModelProperty({
        description: 'Is liked by current user',
        required: false,
        example: ['true', 'false'],
        type: SwaggerDefinitionConstant.Response.Type.BOOLEAN,
    })
    public isLiked?: boolean;

    @ApiModelProperty({
        description: 'Number of retweets',
        required: false,
        example: ['3', '15'],
        type: SwaggerDefinitionConstant.Response.Type.NUMBER,
    })
    public retweetsCount?: Number;

    @ApiModelProperty({
        description: 'Is tweet retweeted by current user',
        required: false,
        example: [false, true],
        type: SwaggerDefinitionConstant.Response.Type.BOOLEAN,
    })
    public isRetweeted?: boolean;

    constructor(tweet: CreateQuery<Tweet>) {
        super();
        this.commentsCount = 0;
        this.isLiked = false;
        this.likesCount = 0;
        this.retweets = [];
        this.isRetweeted = false;
        this.retweetsCount = 0;
        Object.assign(this, tweet);
    }
}

export type DocumentTweet = DocumentType<Tweet>;
