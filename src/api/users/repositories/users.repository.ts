import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentUser, User } from '../models/user.model';
import { RepositoryBase } from '../../base/repository.base';
import { CreateQuery } from 'mongoose';

@injectable()
export class UsersRepository extends RepositoryBase<User> {
    protected _repository: ReturnModelType<typeof User>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, User);
    }

    public async getById(userId: string): Promise<DocumentUser> {
        return this._repository.findById(userId);
    }

    public async getAll(): Promise<DocumentUser[]> {
        return this._repository.find();
    }

    public async getByUsername(userUsername: string): Promise<DocumentUser> {
        return this._repository.findOne({ username: userUsername });
    }

    public async getByEmail(userEmail: string): Promise<DocumentUser> {
        return this._repository.findOne({ email: userEmail });
    }

    public async getBySearch(search: string): Promise<DocumentUser[]> {
        return this._repository.find({
            $or: [
                {
                    username: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    firstName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    lastName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ],
        });
    }

    public async createUser(user: CreateQuery<User>): Promise<DocumentUser> {
        return this._repository.create(user);
    }

    public async updateUser(
        userId: string,
        data: object
    ): Promise<DocumentUser> {
        return this._repository.findByIdAndUpdate(userId, data, { new: true });
    }

    public async deleteUser(userId: string): Promise<DocumentUser> {
        return this._repository.findByIdAndDelete(userId);
    }
}
