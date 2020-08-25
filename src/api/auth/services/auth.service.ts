import { injectable } from 'inversify';

import { CONFLICT, NOT_ACCEPTABLE } from 'http-status-codes';
import { DocumentUser, User } from '../../users/models/user.model';
import { Credentials } from '../interfaces/credentials.interface';
import { UsersService } from '../../users/services/users.service';
import { UserWithTokenResponse } from '../interfaces/user-with-token-response.interface';
import { HttpError } from '../../../shared/models/http.error';

@injectable()
export class AuthService {

    constructor(
        private _usersService: UsersService
    ) {}

    public async getUserFromToken(token: string): Promise<User> {
        // logic
        // ...
        // got id and return user
        token = '123123';
        return null;
    }

    public async signUp(credentials: Credentials): Promise<UserWithTokenResponse> {
        // logic
        // ...
        //
        // generation token logic
        // example of different error
        let existingUser: DocumentUser = await this._usersService.findUserByEmail(credentials.email);
        if (!!existingUser) {
            throw new HttpError(CONFLICT, 'This email already exists');
        }
        existingUser = await this._usersService.findUserByUsername(credentials.username);
        if (!!existingUser) {
            throw new HttpError(NOT_ACCEPTABLE, 'This username already exists');
        }
        // handle other errors
        const user: DocumentUser = await this._usersService.createUser(new User(null)),
            token: string = '12341';
        return { user, token };
    }
}
