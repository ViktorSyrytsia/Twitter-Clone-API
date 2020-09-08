import { ApiModel, ApiModelProperty } from 'swagger-express-typescript';

@ApiModel({
    description: 'Model of HttpError',
    name: 'HttpError',
})
export class HttpError extends Error {

    @ApiModelProperty({
        description: 'Response status',
        required: true,
        example: ['fail'],
    })
    public status: string = 'fail';

    @ApiModelProperty({
        description: 'Error status code',
        required: true,
        example: [404, 400, 500],
    })
    public readonly code: number;

    @ApiModelProperty({
        description: 'Error message',
        required: true,
        example: ['Message Text'],
    })
    public message: string;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}
