import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { DocumentType, prop, Ref } from '@typegoose/typegoose';
import { CreateQuery } from 'mongoose';
import { User } from '../../users/models/user.model';
import { ApiModel, ApiModelProperty, SwaggerDefinitionConstant } from 'swagger-express-typescript';
import { TokenType } from '../enums/token.enum';

@ApiModel({
  description: 'Model of signup credentials',
  name: 'FullCredentials',
})
export class FullCredentials extends Base {
@ApiModelProperty({
    description: 'User firstname',
    required: true,
    example: ['John']
})
public firstName: string;

@ApiModelProperty({
    description: 'User lastname',
    required: true,
    example: ['Doe']
})
public lastName: string;

@ApiModelProperty({
    description: 'User nickname',
    required: true,
    example: ['elonmusk']
})
public username: string;

@ApiModelProperty({
    description: 'User email',
    required: true,
    example: ['example@gmail.com'],
})
public email: string;


@ApiModelProperty({
    description: 'User password',
    required: true,
    example: ['catsAreCute!69']
})
public password: string;
}

@ApiModel({
    description: 'Model of signin credentials',
    name: 'Credentials',
})
export class Credentials extends Base {
@ApiModelProperty({
    description: 'User email or login',
    required: true,
    example: ['elonmusk', 'example@gmail.com']
})
public emailOrUsername: string;

@ApiModelProperty({
    description: 'User password',
    required: true,
    example: ['catsAreCute!69']
})
public password: string;

}
