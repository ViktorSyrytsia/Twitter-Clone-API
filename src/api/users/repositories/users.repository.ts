import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateQuery, DocumentQuery, Types } from 'mongoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentUser, User } from '../models/user.model';
import { RepositoryBase } from '../../base/repository.base';

@injectable()
export class UsersRepository extends RepositoryBase<User> {
    protected _repository: ReturnModelType<typeof User>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, User);
    }

    public async findById(userId: Types.ObjectId): Promise<DocumentUser> {
        return this._repository.findById(userId);
    }

    public async findAll(skip: number, limit: number): Promise<DocumentUser[]> {
        let usersQuery: DocumentQuery<DocumentUser[], DocumentUser> = this._repository.find()
        if (skip) {
            usersQuery = usersQuery.skip(skip)
        }
        if (limit) {
            usersQuery = usersQuery.limit(skip)
        }
        return usersQuery;
    }

    public async findByUsername(userUsername: string): Promise<DocumentUser> {
        return this._repository.findOne({ username: userUsername });
    }

    public async findByEmail(userEmail: string): Promise<DocumentUser> {
        return this._repository.findOne({ email: userEmail });
    }

    public async findBySearch(
        search: string,
        skip: number,
        limit: number
    ): Promise<DocumentUser[]> {
        let usersQuery: DocumentQuery<DocumentUser[], DocumentUser> = this._repository.find({
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
        })
        if (skip) {
            usersQuery = usersQuery.skip(skip)
        }
        if (limit) {
            usersQuery = usersQuery.limit(skip)
        }
        return usersQuery
    }

    public async createUser(user: CreateQuery<User>): Promise<DocumentUser> {
        return this._repository.create(user);
    }

    public async updateUser(
        userId: Types.ObjectId,
        data: object
    ): Promise<DocumentUser> {
        return this._repository.findByIdAndUpdate(userId, data, { new: true });
    }

    public async deleteUser(userId: Types.ObjectId): Promise<DocumentUser> {
        return this._repository.findByIdAndDelete(userId);
    }

    public async getFollowingUserIdsByUserId(userId: Types.ObjectId): Promise<Types.ObjectId[]> {
        return this._repository.find({ followers: userId }).map((user: DocumentUser[]) => {
            return user.map((_user: DocumentUser) => _user._id)
        })
    }

    public async followUser(userId: Types.ObjectId, userIdToFollow: Types.ObjectId): Promise<DocumentUser> {
        return this._repository.update(
            { _id: userIdToFollow },
            { $push: { followers: userId } }
        )
    }

    public async unfollowUser(userId: Types.ObjectId, userIdToUnFollow: Types.ObjectId): Promise<DocumentUser> {
        return this._repository.findByIdAndUpdate(
            { _id: userIdToUnFollow },
            { $pull: { followers: userId } },
            { new: true }
        );
    }
}
