import { injectable } from 'inversify';
import { UpdateQuery } from 'mongoose';

import { UsersRepository } from '../repositories/users.repository';
import { DocumentUser, User } from '../models/user.model';

@injectable()
export class UsersService {
    constructor(private _usersRepository: UsersRepository) {}

    public async findUsersBySearchOrAll(
        search: string
    ): Promise<DocumentUser[]> {
        return search
            ? this._usersRepository.getBySearch(search)
            : this._usersRepository.getAll();
    }

    public async createUser(user: User): Promise<DocumentUser> {
        return this._usersRepository.createUser(user);
    }

    public async findUserById(userId: string): Promise<DocumentUser> {
        return this._usersRepository.getById(userId);
    }

    public async deleteUserById(userId: string): Promise<DocumentUser> {
        return this._usersRepository.deleteUser(userId);
    }

    public async updateUserById(
        userId: string,
        data: UpdateQuery<User>
    ): Promise<DocumentUser> {
        return this._usersRepository.updateUser(userId, data);
    }
}
