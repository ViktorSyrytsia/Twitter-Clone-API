import { injectable } from 'inversify';

import { UsersRepository } from '../repositories/users.repository';
import { DocumentUser, User } from '../models/user.model';

@injectable()
export class UsersService {
    constructor(private _usersRepository: UsersRepository) {}

    public async findUsersBySearchOrAll(
        search: string
    ): Promise<DocumentUser[]> {
        return search
            ? this._usersRepository.findByName(search)
            : this._usersRepository._repository.find();
    }

    public async createUser(user: User): Promise<DocumentUser> {
        return this._usersRepository._repository.create(user);
    }

    public async findUserByEmail(email: string): Promise<DocumentUser> {
        return this._usersRepository._repository.findOne({ email: email });
    }

    public async findUserByUsername(username: string): Promise<DocumentUser> {
        return this._usersRepository._repository.findOne({
            username: username,
        });
    }
}
