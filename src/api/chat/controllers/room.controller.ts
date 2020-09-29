import { Request, Response } from 'express';
import { BAD_REQUEST, FORBIDDEN, NOT_FOUND } from 'http-status-codes';
import { controller, httpDelete, httpGet, httpPost, httpPut, principal, queryParam, request, requestBody, requestParam, response } from 'inversify-express-utils';
import { Types } from 'mongoose';
import { ApiOperationDelete, ApiOperationGet, ApiOperationPost, ApiOperationPut, ApiPath, SwaggerDefinitionConstant } from 'swagger-express-typescript';

import { HttpError } from '../../../shared/models/http.error';
import { ActivatedUserMiddleware } from '../../auth/middlewares/activated.user.middleware';
import { AuthMiddleware } from '../../auth/middlewares/auth.middleware';
import { Principal } from '../../auth/models/principal.model';
import { ControllerBase } from '../../base/controller.base';
import { DocumentUser } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { DocumentRoom } from '../models/room.model';
import { RoomService } from '../services/room.service';


@ApiPath({
    path: '/api/v1/rooms',
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
        description: 'Find all chat rooms or only subscribed, using lazy load',
        summary: 'Get rooms array',
        parameters: {
            query: {
                skip: {
                    type: 'number',
                    required: false,
                    allowEmptyValue: true,
                    name: 'skip',
                    description:
                        'Skip parametr of laze load (how many items need to skip)',
                },
                limit: {
                    type: 'number',
                    required: false,
                    allowEmptyValue: true,
                    name: 'limit',
                    description:
                        'Limit parametr of laze load  (how many items need to show in response)',
                },
                subscribed: {
                    type: 'boolean',
                    required: true,
                    allowEmptyValue: false,
                    name: 'subscribed',
                    description:
                        'If subscribed=true, than finds only subscribed rooms, if subscribed=false, finds all rooms',
                },
            },
        },
        responses: {
            200: {
                description: 'Success /  returns dto with rooms',
                type: SwaggerDefinitionConstant.Response.Type.ARRAY,
                model: 'Room',
            },
            500: {
                description: 'Cannot find rooms',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
    })
    @httpGet('/', AuthMiddleware)
    public async findAllRooms(
        @queryParam('subscribed') subscribed: boolean,
        @queryParam('skip') skip: string,
        @queryParam('limit') limit: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal
    ): Promise<Response> {
        try {
            let rooms: DocumentRoom[];
            if (subscribed) {
                rooms = await this._roomService.findAllRooms(
                    principal.details._id,
                    Number.parseInt(skip),
                    Number.parseInt(limit),
                );
            } else {
                rooms = await this._roomService.findAllRooms(
                    null,
                    Number.parseInt(skip),
                    Number.parseInt(limit),
                );
            }
            return this._success<{ rooms: DocumentRoom[] }>(res, 200, {
                rooms,
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPost({
        description: 'Create new chat room object and subscribe to it',
        summary: 'Create new room',
        path: '/',
        parameters: {
            body: {
                description: 'Room body parameters',
                required: true,
                properties: {
                    roomName: {
                        description: 'Name of the new chat room',
                        name: 'roomName',
                        required: true,
                        allowEmptyValue: false,
                        type: SwaggerDefinitionConstant.Parameter.Type.STRING
                    },
                    isPublic: {
                        description: 'If the new room is public, than isPublic=true, else if room is private isPublic=false',
                        name: 'isPublic',
                        required: true,
                        allowEmptyValue: false,
                        type: SwaggerDefinitionConstant.Parameter.Type.BOOLEAN
                    },
                    userToAdd: {
                        description: 'The user id with whom you want to create a new room',
                        name: 'userToAdd',
                        required: false,
                        allowEmptyValue: true,
                        type: SwaggerDefinitionConstant.Parameter.Type.STRING
                    }
                }
            }
        },
        responses: {
            201: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Room'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'User not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot create room',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPost('/', AuthMiddleware, ActivatedUserMiddleware)
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
            const room = await this._roomService.createRoom(principal.details._id, body.roomName, body.isPublic, body.userToAdd);
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationGet({
        description: 'Find  chat room by id',
        summary: 'Get room by id',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of room',
                    required: true
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Room',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Room not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot find room',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
    })
    @httpGet('/:id')
    public async findRoomById(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'));
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

    @ApiOperationGet({
        description: 'Find  chat room by name',
        summary: 'Get room by name',
        path: '/name/{name}',
        parameters: {
            path: {
                name: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'name',
                    allowEmptyValue: false,
                    description: 'name of room',
                    required: true
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Room',
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Room not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot find room',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            }
        },
    })
    @httpGet('/name/:name')
    public async findRoomByName(
        @requestParam('name') name: string,
        @request() req: Request,
        @response() res: Response
    ): Promise<Response> {
        if (!name) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room name is missing'));
        }
        try {
            const rooms: DocumentRoom[] = await this._roomService.findRoomByName(name);
            return this._success<{ rooms: DocumentRoom[] }>(res, 200, {
                rooms
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationDelete({
        description: 'Delete room object',
        summary: 'Delete room',
        path: '/{id}',
        parameters: {
            path: {
                id: {
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    name: 'id',
                    allowEmptyValue: false,
                    description: 'Id of room to delete',
                    required: true
                }
            },
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Room'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated | Not room author',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Room not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot delete room',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpDelete('/:id', AuthMiddleware, ActivatedUserMiddleware)
    public async deleteRoom(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'));
        }
        try {
            const roomToDelete: DocumentRoom = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!roomToDelete) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }
            if (!((roomToDelete.creator as Types.ObjectId).equals(principal.details._id))) {
                return this._fail(
                    res,
                    new HttpError(FORBIDDEN, 'Not a creator of a room')
                );
            }
            const room: DocumentRoom = await this._roomService.deleteRoom(roomToDelete._id);
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPut({
        description: 'Invite user to the chat room',
        summary: 'Room invite',
        path: '/invite/{id}?user={userId}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of room to invite',
                    required: true,
                    allowEmptyValue: false
                }
            },
            query: {
                userId: {
                    name: 'userId',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of user to invite',
                    required: true,
                    allowEmptyValue: false
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Room'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated | Not room creator',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Room not found | User not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot invite user',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/invite/:id', AuthMiddleware, ActivatedUserMiddleware)
    public async inviteUser(
        @queryParam('userId') userId: string,
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'));
        }
        if (!userId) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'User id is missing'));
        }
        try {
            const user: DocumentUser = await this._userService.findById(new Types.ObjectId(userId));
            if (!user) {
                return this._fail(res, new HttpError(NOT_FOUND, 'User not found'));
            }
            let room = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!room) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }
            if (room.creator !== null && room.creator === principal.details._id) {
                return this._fail(res, new HttpError(FORBIDDEN, 'Not room creator'));
            }
            room = await this._roomService.subscribeToChatRoom(room.id, user._id);
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPut({
        description: 'Subscribe to the chat room',
        summary: 'Room subscribe',
        path: '/subscribe/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of the room to subscribe',
                    required: true,
                    allowEmptyValue: false
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Room'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated | You have no rights',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Room not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot subscribe',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/subscribe/:id', AuthMiddleware, ActivatedUserMiddleware)
    public async sunscribeToRoom(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'));
        }
        try {
            let room = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!room) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }
            if (room.creator !== null) {
                return this._fail(res, new HttpError(FORBIDDEN, 'You have no rights'));
            }
            room = await this._roomService.subscribeToChatRoom(room.id, principal.details._id);
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }

    @ApiOperationPut({
        description: 'Unsubscribe from the chat room',
        summary: 'Room unsubscribe',
        path: '/unsubscribe/{id}',
        parameters: {
            path: {
                id: {
                    name: 'id',
                    type: SwaggerDefinitionConstant.Parameter.Type.STRING,
                    description: 'Id of the room to unsubscribe',
                    required: true,
                    allowEmptyValue: false
                }
            }
        },
        responses: {
            200: {
                description: 'Success',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'Room'
            },
            400: {
                description: 'Parameters fail',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            401: {
                description: 'Unauthorized',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            403: {
                description: 'Account not activated',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            404: {
                description: 'Room not found',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
            500: {
                description: 'Cannot unsubscribe',
                type: SwaggerDefinitionConstant.Response.Type.OBJECT,
                model: 'HttpError',
            },
        },
        security: {
            apiKeyHeader: [],
        },
    })
    @httpPut('/unsubscribe/:id', AuthMiddleware, ActivatedUserMiddleware)
    public async unsubscribeFromRoom(
        @requestParam('id') id: string,
        @request() req: Request,
        @response() res: Response,
        @principal() principal: Principal,
    ): Promise<Response> {
        if (!id) {
            return this._fail(res, new HttpError(BAD_REQUEST, 'Room id is missing'));
        }
        try {
            let room = await this._roomService.findRoomById(new Types.ObjectId(id));
            if (!room) {
                return this._fail(res, new HttpError(NOT_FOUND, 'Room not found'));
            }
            room = await this._roomService.unsubscribeFromRoom(room.id, principal.details._id);
            return this._success<{ room: DocumentRoom }>(res, 200, {
                room
            });
        } catch (error) {
            return this._fail(res, error);
        }
    }
}
