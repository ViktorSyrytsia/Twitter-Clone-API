import { injectable } from 'inversify';
import { Types, UpdateQuery } from 'mongoose';

import { UsersRepository } from '../repositories/users.repository';
import { DocumentUser, User } from '../models/user.model';
import { Principal } from '../../auth/models/principal.model';

@injectable()
export class UsersService {
    constructor(private _usersRepository: UsersRepository) {
    }

    public async findUsersBySearchOrAll(
        search: string,
        skip: number,
        limit: number
    ): Promise<DocumentUser[]> {
        return search
            ? this._usersRepository.findBySearch(search, skip, limit)
            : this._usersRepository.findAll(skip, limit);
    }

    public async findUserByUsername(username: string): Promise<DocumentUser> {
        return this._usersRepository.findByUsername(username);
    }

    public async findUserByEmail(email: string): Promise<DocumentUser> {
        return this._usersRepository.findByEmail(email);
    }

    public async createUser(user: User): Promise<DocumentUser> {
        return this._usersRepository.createUser(user);
    }

    public async findById(userId: Types.ObjectId): Promise<DocumentUser> {
        return this._usersRepository.findById(userId);
    }

    public async findByLikes(userIds: Types.ObjectId[], principal: Principal, skip?: number, limit?: number): Promise<DocumentUser[]> {
        return this._usersRepository.findByLikes(userIds, principal, skip, limit);
    }

    public async getFollowingUsersIdsByUserId(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
        return this._usersRepository.getFollowingUsersIdsByUserId(userId);
    }

    public async deleteUserById(userId: Types.ObjectId): Promise<DocumentUser> {
        return this._usersRepository.deleteUser(userId);
    }

    public async updateUserById(
        userId: Types.ObjectId,
        data: UpdateQuery<User>
    ): Promise<DocumentUser> {
        return this._usersRepository.updateUser(userId, data);
    }

    public async followUser(userId: Types.ObjectId, userIdToFollow: Types.ObjectId): Promise<DocumentUser> {
        return this._usersRepository.followUser(userId, userIdToFollow);
    }

    public async unfollowUser(userId: Types.ObjectId, userIdToFollow: Types.ObjectId): Promise<DocumentUser> {
        return this._usersRepository.unfollowUser(userId, userIdToFollow);
    }
}
