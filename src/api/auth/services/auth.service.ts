import { injectable } from 'inversify';
import { sign, verify } from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import {
    CONFLICT, EXPECTATION_FAILED, FORBIDDEN, INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY
} from 'http-status-codes';

import { DocumentUser, User } from '../../users/models/user.model';
import { UsersService } from '../../users/services/users.service';
import { MailService } from '../services/mail.service';
import { HttpError } from '../../../shared/models/http.error';
import { UserWithToken } from '../models/user.with.token.model';
import { TokenService } from './token.service';
import { DocumentToken } from '../models/token.model';
import { TokenType } from '../enums/token.enum';
import { SignInCredentials } from '../models/sign.in.credentials.model';
import { SignUpCredentials } from '../models/sign.up.credentials.model';
import { Principal } from '../models/principal.model';
import { UploadsService } from '../../uploads/services/uploads.service';
import { DocumentFile, File } from '../../uploads/models/file.model';
import { Types } from 'mongoose';
import { validate } from 'class-validator';

@injectable()
export class AuthService {
    private _accessTokenExpiresIn: string = '3h';
    private _refreshTokenExpiresIn: string = '7d';
    private _validationOptions = {
        skipUndefinedProperties: false,
        skipMissingProperties: false,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        dismissDefaultMessages: false,
    };

    constructor(
        private _usersService: UsersService,
        private _tokenService: TokenService,
        private _mailService: MailService,
        private _uploadsService: UploadsService
    ) { }

    public async getPrincipalFromToken(token: string): Promise<DocumentUser> {
        try {
            const decrypted: any = verify(token, process.env.JWT_SECRET);
            return this._usersService.findPrincipalById(decrypted.userId);
        } catch (error) {
            throw error;
        }
    }

    public async signUp(credentials: SignUpCredentials): Promise<void> {
        let validationInstance = new SignUpCredentials;
        validationInstance = Object.assign(validationInstance, credentials);
        await this._validate(validationInstance)

        let existingUser: DocumentUser = await this._usersService.findByUsername(
            credentials.username
        );
        if (existingUser) {
            throw new HttpError(CONFLICT, 'This username already exists');
        }

        existingUser = await this._usersService.findByEmail(credentials.email);
        if (existingUser) {
            throw new HttpError(CONFLICT, 'This email already exists');
        }

        try {
            const newUser: User = new User({
                firstName: credentials.firstName,
                lastName: credentials.lastName,
                username: credentials.username,
                email: credentials.email,
                password: await hash(credentials.password, 10),
            });
            const documentUser: DocumentUser = await this._usersService.createUser(
                newUser
            ),
                confirmEmailToken: DocumentToken = await this._tokenService.createConfirmPasswordToken(
                    documentUser._id
                );
            if (credentials.file) {
                await this._usersService.changeAvatar(
                    documentUser._id,
                    credentials.file
                );
            }
            await this._mailService.sendConfirmMail(
                credentials.email,
                credentials.firstName,
                confirmEmailToken.tokenBody
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async confirmEmail(token: string): Promise<UserWithToken> {
        const documentToken: DocumentToken = await this._tokenService.findTokenByBodyAndType(
            token,
            TokenType.ConfirmEmail
        );
        if (!documentToken || documentToken.isExpired) {
            throw new HttpError(
                EXPECTATION_FAILED,
                'Token is broken or expired'
            );
        }

        try {
            const userId: any = documentToken.userId,
                documentUser: DocumentUser = await this._usersService.activateUser(
                    userId
                ),
                accessToken: string = this._generateAccessToken(userId),
                refreshToken: string = this._generateRefreshToken(userId);

            await this._tokenService.deleteToken(documentToken._id);

            return new UserWithToken(documentUser, accessToken, refreshToken);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async signIn(
        credentials: SignInCredentials
    ): Promise<UserWithToken> {
        let validationInstance = new SignInCredentials;
        validationInstance = Object.assign(validationInstance, credentials);
        await this._validate(validationInstance)

        const documentUser: DocumentUser = await this._usersService.findUserByEmailOrUsername(
            credentials.emailOrUsername
        );
        if (!documentUser) {
            throw new HttpError(
                EXPECTATION_FAILED,
                'User doesn\'t exist or password doesn\'t match'
            );
        }
        const passwordCompare: boolean = await compare(
            credentials.password,
            documentUser.password
        );
        if (!passwordCompare) {
            throw new HttpError(
                EXPECTATION_FAILED,
                'User doesn\'t exist or password doesn\'t match'
            );
        }

        try {
            const accessToken = this._generateAccessToken(documentUser._id),
                refreshToken = this._generateRefreshToken(documentUser._id);

            return new UserWithToken(
                await this._usersService.findPrincipalById(documentUser._id),
                accessToken,
                refreshToken
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async resendConfirmEmail(principal: Principal): Promise<void> {
        if (principal.details.active) {
            throw new HttpError(CONFLICT, 'User already activated');
        }

        try {
            await this._tokenService.deleteTokenByUserId(principal.details._id);
            const confirmEmailToken: DocumentToken = await this._tokenService.createConfirmPasswordToken(
                principal.details._id
            );
            await this._mailService.sendConfirmMail(
                principal.details.email,
                principal.details.firstName,
                confirmEmailToken.tokenBody
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async refreshAccessToken(
        refreshToken: string
    ): Promise<UserWithToken> {
        let userId: Types.ObjectId;
        try {
            const decrypted: { userId: Types.ObjectId } = verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET
            ) as { userId: Types.ObjectId };
            userId = decrypted.userId;
        } catch (error) {
            throw new HttpError(FORBIDDEN, 'Refresh token is broken or expired');
        }

        try {
            return {
                user: await this._usersService.findPrincipalById(userId),
                accessToken: this._generateAccessToken(userId),
                refreshToken: this._generateRefreshToken(userId),
            };
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    private _generateAccessToken(userId: Types.ObjectId): string {
        return sign(
            {
                userId: userId,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: this._accessTokenExpiresIn,
            }
        );
    }

    private _generateRefreshToken(userId: Types.ObjectId): string {
        return sign(
            {
                userId: userId,
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: this._refreshTokenExpiresIn,
            }
        );
    }

    private async _validate(object: Object): Promise<void> {
        await validate(object, this._validationOptions).then(errors => {
            if (errors.length > 0) {
                let errorsList = '';
                for (const error of errors) {
                    errorsList = errorsList.concat(Object.values(error.constraints)[0], '. ')
                }
                throw new HttpError(
                    UNPROCESSABLE_ENTITY,
                    errorsList
                );
            }
        });
    }
}
