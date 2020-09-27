import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { UsersRepository } from '../repositories/users.repository';
import { DocumentUser, User } from '../models/user.model';
import { Principal } from '../../auth/models/principal.model';
import { HttpError } from '../../../shared/models/http.error';
import { TokenService } from '../../auth/services/token.service';
import { MailService } from '../../auth/services/mail.service';
import { DocumentToken } from '../../auth/models/token.model';
import { DocumentFile, File } from '../../uploads/models/file.model';
import { UploadsService } from '../../uploads/services/uploads.service';
import { UploadedFile } from 'express-fileupload';

@injectable()
export class UsersService {
    constructor(
        private _usersRepository: UsersRepository,
        private _tokenService: TokenService,
        private _mailService: MailService,
        private _uploadsService: UploadsService
    ) { }

    public async findUsersBySearchOrAll(
        search: string,
        skip: number,
        limit: number,
        principal: Principal
    ): Promise<DocumentUser[]> {
        try {
            return search
                ? await this._usersRepository.findBySearch(
                    search,
                    skip,
                    limit,
                    principal
                )
                : await this._usersRepository.findAll(skip, limit, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findByUsername(
        username: string,
        principal?: Principal
    ): Promise<DocumentUser> {
        try {
            return this._usersRepository.findByUsername(username, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findByEmail(
        email: string,
        principal?: Principal
    ): Promise<DocumentUser> {
        try {
            return this._usersRepository.findByEmail(email, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findUserByEmailOrUsername(emailOrUsername: string): Promise<DocumentUser> {
        try {
            return this._usersRepository.findUserByEmailOrUsername(emailOrUsername);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async createUser(
        user: User,
        principal?: Principal
    ): Promise<DocumentUser> {
        try {
            return this._usersRepository.createUser(user, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findPrincipalById(userId: Types.ObjectId): Promise<DocumentUser> {
        try {
            return this._usersRepository.findPrincipalById(userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findById(userId: Types.ObjectId, principal?: Principal): Promise<DocumentUser> {
        try {
            return this._usersRepository.findById(userId, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findUsersByUserIds(
        userIds: Types.ObjectId[],
        principal: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentUser[]> {
        try {
            return this._usersRepository.findUsersByUserIds(
                userIds,
                principal,
                skip,
                limit
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async deleteUserByPrincipal(principal: Principal): Promise<void> {
        try {
            await this._usersRepository.deleteUser(principal);
            const filesToDelete: DocumentFile[] = await this._uploadsService.findFilesByAuthor(
                principal.details._id
            );
            for (const file of filesToDelete) {
                await this._uploadsService.deleteFile(file);
            }
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async updateUser(
        user: User,
        principal: Principal,
        file?: UploadedFile
    ): Promise<DocumentUser> {
        if (user.email) {
            const emailRegExp: RegExp = new RegExp(
                /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/ // https://regex101.com/library/mX1xW0
            );
            if (!emailRegExp.test(user.email)) {
                throw new HttpError(UNPROCESSABLE_ENTITY, 'Wrong email format');
            }
        }

        let existingUser: DocumentUser = await this.findByUsername(
            user.username
        );
        if (existingUser && !existingUser._id.equals(principal.details._id)) {
            throw new HttpError(CONFLICT, 'This username already exists');
        }

        existingUser = await this.findByEmail(user.email);
        if (existingUser && !existingUser._id.equals(principal.details._id)) {
            throw new HttpError(CONFLICT, 'This email already exists');
        }

        if (file) {
            try {
                const avatar = await this._uploadsService.createFile(
                    principal.details._id,
                    file
                );
                user.avatar = avatar.id;
            } catch (error) {
                throw new HttpError(INTERNAL_SERVER_ERROR, `Can\'t create file: ${error.message}`);
            }
        }

        try {
            if (
                user.email &&
                !(await this._usersRepository.findByEmail(user.email))
            ) {
                const confirmEmailToken: DocumentToken = await this._tokenService.createConfirmPasswordToken(
                    user._id
                );
                await this._mailService.sendConfirmMail(
                    user.email,
                    user.firstName || principal.details.firstName,
                    confirmEmailToken.tokenBody
                );
            }
            return this._usersRepository.updateUser(user, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async changeAvatar(
        userId: Types.ObjectId,
        file: UploadedFile,
        principal?: Principal
    ): Promise<DocumentUser> {
        try {
            const avatar = await this._uploadsService.createFile(userId, file);
            return await this._usersRepository.changeAvatar(
                userId,
                avatar._id,
                principal
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async activateUser(userId: Types.ObjectId): Promise<DocumentUser> {
        try {
            return this._usersRepository.activateUser(userId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async followUser(userIdToFollow: Types.ObjectId, principal: Principal): Promise<DocumentUser> {
        try {
            return this._usersRepository.followUser(userIdToFollow, principal);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async unfollowUser(userIdToUnfollow: Types.ObjectId, principal: Principal): Promise<DocumentUser> {
        try {
            return this._usersRepository.unfollowUser(
                userIdToUnfollow,
                principal
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findFollowers(
        userId: Types.ObjectId,
        principal?: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentUser[]> {
        try {
            return this._usersRepository.findFollowers(
                userId,
                principal,
                skip,
                limit
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findFollows(
        userId: Types.ObjectId,
        principal?: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentUser[]> {
        try {
            return this._usersRepository.findFollows(
                userId,
                principal,
                skip,
                limit
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findUserBySocket(socketId: string): Promise<DocumentUser> {
        try {
            return await this._usersRepository.findBySocket(socketId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async updateConnection(userId: Types.ObjectId, socketId: string): Promise<DocumentUser> {
        try {
            return await this._usersRepository.updateConnection(userId, socketId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }
}
