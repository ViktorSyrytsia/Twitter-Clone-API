import { injectable } from 'inversify';
import { sign, verify } from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import {
    CONFLICT, EXPECTATION_FAILED, INTERNAL_SERVER_ERROR, NOT_ACCEPTABLE, PRECONDITION_FAILED, UNPROCESSABLE_ENTITY
} from 'http-status-codes';

import { DocumentUser, User } from '../../users/models/user.model';
import { Credentials, FullCredentials } from '../models/requests.models';
import { UsersService } from '../../users/services/users.service';
import { MailService } from './mail.service';
import { HttpError } from '../../../shared/models/http.error';
import { UserWithToken } from '../models/userWithToken.model';
import { TokenService } from './token.service';
import { DocumentToken } from '../models/token.model';
import { TokenType } from '../enums/token.enum';


@injectable()
export class AuthService {
    constructor(private _usersService: UsersService,
                private _tokenService: TokenService,
                private _mailService: MailService) {}

    public async getUserFromToken(token: string): Promise<DocumentUser> {
        try {
            const decrypted: any = verify(
                token, process.env.JWT_SECRET
            );
            return await this._usersService.findById(decrypted.userId);
        } catch (error) {
            throw error;
        }
    }

    public async signUp(
        fullCredentials: FullCredentials
    ): Promise<void> {
        const emailRegExp: RegExp = new RegExp(
            /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/
            // https://regex101.com/library/mX1xW0
        );
        const passwordRegExp: RegExp = new RegExp(
            /^((?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9]).{6,})\S$/
            // https://regex101.com/library/fX8dY0
        );
        if (emailRegExp.test(fullCredentials.email) === false) {
            throw new HttpError(UNPROCESSABLE_ENTITY, 'Wrong email format.');
        }
        if (passwordRegExp.test(fullCredentials.password) === false) {
            throw new HttpError(UNPROCESSABLE_ENTITY,
                'Password must be at least 6 characters long, contain numbers, uppercase and lowercase letters.'
            );
        }
        if (Object.keys(fullCredentials).length !== 5 ||
            !fullCredentials.firstName ||
            !fullCredentials.lastName ||
            !fullCredentials.username)
        {
            throw new HttpError(UNPROCESSABLE_ENTITY, 'Wrong json.');
        }
        let existingUser: DocumentUser = await this._usersService.findUserByUsername(
            fullCredentials.username
        );
        if (existingUser) {
            throw new HttpError(NOT_ACCEPTABLE, 'This username already exists');
        }
        existingUser = await this._usersService.findUserByEmail(
            fullCredentials.email
        );
        if (existingUser) {
            throw new HttpError(CONFLICT, 'This email already exists');
        }
        const newUser: User = new User({
            firstName: fullCredentials.firstName,
            lastName: fullCredentials.lastName,
            username: fullCredentials.username,
            email: fullCredentials.email,
            password: await hash(fullCredentials.password, 10)
        });
        try {
            const documentUser: DocumentUser = await this._usersService.createUser(newUser),
                confirmEmailToken: DocumentToken = await this._tokenService.createConfirmPasswordToken(documentUser._id);
            await this._mailService.sendConfirmMail(
                fullCredentials.email, confirmEmailToken.tokenBody
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, 'Failed to create a user.');
        }
    }

    public async confirmEmail(
        token: string
    ): Promise<UserWithToken> {
        const documentToken: DocumentToken = await this._tokenService.findTokenByBodyAndType(token, TokenType.ConfirmEmail);
        if (!documentToken || documentToken.isExpired) {
            throw new HttpError(EXPECTATION_FAILED, 'Token is broken or expired.');
        }
        const userId: any = documentToken.userId,
            documentUser: DocumentUser = await this._usersService.activateUser(userId),
            jwtToken = sign({
                    userID: documentUser._id
                },
                process.env.JWT_SECRET, {
                    expiresIn: '3h'
                }
            );
        await this._tokenService.deleteToken(documentToken._id);
        return new UserWithToken(documentUser, jwtToken);
    }

    public async signIn(
        credentials: Credentials
    ): Promise<UserWithToken> {
        if (Object.keys(credentials).length !== 2 ||
            !credentials.emailOrUsername ||
            !credentials.password)
        {
            throw new HttpError(UNPROCESSABLE_ENTITY, 'Wrong json.');
        }
        const documentUser: DocumentUser = (await this._usersService.findUserByEmail(credentials.emailOrUsername) ||
            await this._usersService.findUserByUsername(credentials.emailOrUsername)
        );
        if (!documentUser || await compare(credentials.password, documentUser.password) === false) {
            throw new HttpError(EXPECTATION_FAILED, 'User doesn\'t exist or password doesn\'t match.');
        }
        if (documentUser.active === false) {
            throw new HttpError(PRECONDITION_FAILED, 'User was not activated.');
        }
        const jwtToken = sign({
                userId: documentUser._id
            },
            process.env.JWT_SECRET, {
                expiresIn: '3h'
            }
        );
        return new UserWithToken(documentUser, jwtToken);
    }
}
