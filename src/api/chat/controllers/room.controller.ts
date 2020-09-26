import {
    controller,
    httpPost,
    request,
    requestBody,
    principal,
    response,
    httpGet,
    queryParam, requestParam, httpPut
} from 'inversify-express-utils';
import { Request, Response } from 'express';
import {
    ApiPath,
    ApiOperationGet,
    SwaggerDefinitionConstant,
    ApiOperationDelete,
    ApiOperationPut,
    ApiOperationPost,
} from 'swagger-express-typescript';

import { ControllerBase } from '../../base/controller.base';
import { RoomService } from '../services/room.service';
import { DocumentRoom } from '../models/room.model';
import { Principal } from '../../auth/models/principal.model';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { Types } from 'mongoose';
import { HttpError } from '../../../shared/models/http.error';
import { BAD_REQUEST, METHOD_NOT_ALLOWED, NOT_FOUND } from 'http-status-codes';

@ApiPath({
    path: '/api/v1/rooms/',
    name: 'Rooms',
    security: { apiKeyHeader: [] },
})
@controller('/rooms')
export class RoomController extends ControllerBase {
    constructor(
        private _roomService: RoomService,
        private _userService: UsersService
    ) {
        super();
    }
    @ApiOperationGet({
        description: 'Find all chat rooms, using lazy load',
        summary: 'Find all rooms',
        parameters: {
            query: {
                skip: {
                    type: 'number',
                    required: true,
                    allowEmptyValue: false,
                    name: 'skip',
                    description:
                        'Skip parametr of laze load (how many items need to skip)',
                },
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
                description: 'Success /  returns dto with rooms',
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
    @httpGet('/')
    public async findAllRooms(
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        try {
            const rooms: DocumentRoom[] = await this._roomService.findAllRooms(
                Number.parseInt(skip),
                Number.parseInt(limit),
            );
            return this._success<{ rooms: DocumentRoom[] }>(res, 200, {
                rooms,
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @httpGet('/:id')
    public async findRoomBeId(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'))
        }
        try {
            const room: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(id));
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @httpPost('/')
    public async createRoomAndSubscribe(
        @requestBody() body: { roomName: string, isPublic: boolean, userToAdd?: Types.ObjectId },
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        try {
            if (body.userToAdd) {
                const user: DocumentUser = await this._userService.findById(body.userToAdd);
                if (!user) {
                    return this._fail(res, new HttpError(NOT_FOUND, 'User not found'));
                }
            }
            const room = await this._roomService.createRoom(new Types.ObjectId("5f622978649dbb59d2632e04"), body.roomName, body.isPublic, body.userToAdd)
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @httpPut('/:id')
    public async inviteUser(
        @queryParam('userId') userId: string,
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'))
        }
        try {

            const user: DocumentUser = await this._userService.findById(new Types.ObjectId(userId));

            if (!user) {
                return this._fail(res, new HttpError(NOT_FOUND, 'User not found'));
            }
            const room = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!room) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }

            if (room.creator !== null && room.creator === new Types.ObjectId('5f622978649dbb59d2632e04')) {
                return this._fail(res, new HttpError(METHOD_NOT_ALLOWED, 'You have no rights to do so'));
            }
            await this._userService.subscribeToChatRoom(user._id, room.id);
            const updatedRoom = await this._roomService.subscribeToChatRoom(room.id, user._id);
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room: updatedRoom
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @httpPut('/subscribe/:id')
    public async sunscribeToRoom(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'))
        }
        try {
            const room = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!room) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }
            if (room.creator !== null) {
                return this._fail(res, new HttpError(METHOD_NOT_ALLOWED, 'You have no rights to do so'));
            }
            await this._userService.subscribeToChatRoom(new Types.ObjectId('5f6f10909747881d2e27cdd8'), room.id)
            const updatedRoom = await this._roomService.subscribeToChatRoom(room.id, new Types.ObjectId('5f6f10909747881d2e27cdd8'));
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room: updatedRoom
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @httpPut('/unsubscribe/:id')
    public async unsubscribeFromRoom(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'))
        }
        try {
            const room = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!room) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }
            await this._userService.unsubscribeFromChatRoom(new Types.ObjectId('5f6f10909747881d2e27cdd8'), room.id)
            const updatedRoom = await this._roomService.unsubscribeFromRoom(room.id, new Types.ObjectId('5f6f10909747881d2e27cdd8'));
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room: updatedRoom
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }
}
