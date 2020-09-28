import { Request, Response } from 'express';
import { BAD_REQUEST, NOT_FOUND } from 'http-status-codes';
import { controller, httpGet, queryParam, request, requestParam, response } from 'inversify-express-utils';
import { Types } from 'mongoose';
import { ApiOperationGet, ApiPath, SwaggerDefinitionConstant } from 'swagger-express-typescript';

import { HttpError } from '../../../shared/models/http.error';
import { ActivatedUserMiddleware } from '../../auth/middlewares/activated.user.middleware';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';
import { ControllerBase } from '../../base/controller.base';
import { DocumentMessage } from '../models/message.model';
import { DocumentRoom } from '../models/room.model';
import { MessageService } from '../services/message.service';
import { RoomService } from '../services/room.service';


@ApiPath({
    path: '/api/v1/rooms/',
    name: 'Rooms',
    security: { apiKeyHeader: [] },
})
@controller('/messages')
export class MessageController extends ControllerBase {
    constructor(
        private _roomService: RoomService,
        private _messageService: MessageService
    ) {
        super();
    }
    @ApiOperationGet({
        description: 'get all messages in the room, using lazy load',
        summary: 'Get all messages',
        parameters: {
            query: {
                limit: {
                    type: 'number',
                    required: true,
                    allowEmptyValue: false,
                    name: 'limit',
                    description:
                        'Limit parametr of laze load  (how many items need to show in response)',
                },
            },
        },
        responses: {
            200: {
                description: 'Success /  returns dto with messages',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Room',
            },
            401: {
                description: 'Fail / unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Room',
            },
            404: {
                description: 'Fail / rooms not found',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Room',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpGet('/room/:id', AuthMiddleware)
    public async findAllRooms(
        @requestParam('id') id: string,
        @queryParam('limit') limit: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'));
        }
        try {
            const room: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!room) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }
            const messages: DocumentMessage[] = await this._messageService.findMessagesByRoom(
                room.id,
                Number.parseInt(limit)
            )
            return this._success<{ messages: DocumentMessage[] }>(res, 200, {
                messages,
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }
}
