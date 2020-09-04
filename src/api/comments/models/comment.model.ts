import {Base} from '@typegoose/typegoose/lib/defaultClasses';
import {DocumentType, prop, Ref} from '@typegoose/typegoose';
import {CreateQuery, Types} from 'mongoose';
import {ApiModel, ApiModelProperty} from 'swagger-express-typescript';
import {User} from '../../users/models/user.model';
<<<<<<< HEAD

// tweet stub
export class Tweet {
}

// like stub
export class Like {
}

=======
import {Tweet} from './tweet.model';

>>>>>>> 789158a... fixed issues with comment model and repository
@ApiModel({
    description: 'Model of Comment',
    name: 'Comment',
})
export class Comment extends Base {
    @ApiModelProperty({
        description: 'Author id of comment',
        required: true,
        example: ['5f423af74c9234267e6aa6ea']
    })
    @prop({required: true})
    public authorId: Ref<User>;

    @ApiModelProperty({
        description: 'Tweet id of comment',
        required: true,
        example: ['5f423af74c9234267e6aa6ea']
    })
    @prop({required: true})
    public tweetId: Ref<Tweet>;

    @ApiModelProperty({
        description: 'id of replied comment',
        required: false,
        example: ['5f423af74c9234267e6aa6ea']
    })
    @prop({required: false})
    public replyToComment: Ref<Comment>;

    @ApiModelProperty({
        description: 'text of comment',
        required: true,
        example: ['some comment..'],
    })
    @prop({required: true})
    public text: string;

    @ApiModelProperty({
        description: 'likes array of comment',
        required: true,
<<<<<<< HEAD
        example:['5f423af74c9234267e6aa6ea','3r423af74c95f4267e6ak612']
=======
        example: [['5f423af74c9234267e6aa6ea', '3r423af74c95f4267e6ak612']]
>>>>>>> 789158a... fixed issues with comment model and repository
    })
    @prop({ref: () => User, required: true})
    public likes: Types.ObjectId[];

    @ApiModelProperty({
        description: 'comment creation time stamp',
        required: true,
<<<<<<< HEAD
        example:['20200801'],
=======
        example: ['1599137650207'],
>>>>>>> 04a8e66... code refactoring
    })
    @prop({required:true, default: Date.now()})
    public createdAt: number;

    @ApiModelProperty({
        description: 'time stamp of last comment edition',
        required: true,
<<<<<<< HEAD
        example:['20200801'],
=======
        example: ['1599137650207'],
>>>>>>> 04a8e66... code refactoring
    })
    @prop({required:true, default: Date.now()})
    public lastEdited: number;

    constructor(comment: CreateQuery<Comment>) {
        super();
        Object.assign(this,comment);
    }
}

export type DocumentComment = DocumentType<Comment>;
