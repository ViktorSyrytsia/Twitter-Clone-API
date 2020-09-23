import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';
import { CreateQuery, DocumentQuery, Types } from 'mongoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentUser, User } from '../models/user.model';
import { RepositoryBase } from '../../base/repository.base';
import { Principal } from '../../auth/models/principal.model';


@injectable()
export class UsersRepository extends RepositoryBase<User> {
    protected _repository: ReturnModelType<typeof User>;

    private _selectFields: string = '_id username firstName lastName avatar followers';

    constructor(
        private _databaseConnection: DatabaseConnection
    ) {
        super();
        this.initRepository(this._databaseConnection, User);
    }

    public async findById(userId: Types.ObjectId, principal?: Principal): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findById(userId)
            .select(this._selectFields)
            .lean();
        return this._addFields(user, principal);
    }

    public async findPrincipalById(userId: Types.ObjectId): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findById(userId)
            .select('-password')
            .lean();
        return this._addFields(user);
    }

    public async findAll(
        skip: number,
        limit: number,
        principal: Principal
    ): Promise<DocumentUser[]> {
        const usersQuery: DocumentQuery<DocumentUser[], DocumentUser> = this._repository.find();
        return this._addLazyLoadAndModify(usersQuery, principal, skip, limit);

    }

    public async findByUsername(username: string, principal?: Principal): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findOne({ username })
            .select(this._selectFields)
            .lean();
        return this._addFields(user, principal);
    }

    public async findByEmail(email: string, principal?: Principal): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findOne({ email })
            .select(this._selectFields)
            .lean();
        return this._addFields(user, principal);
    }

    public async findUserByEmailOrUsername(emailOrUsername: string): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findOne({
                $or: [{ username: emailOrUsername }, { email: emailOrUsername }]
            })
            .lean();
        return this._addFields(user);
    }

    public async findBySearch(
        search: string,
        skip: number,
        limit: number,
        principal?: Principal
    ): Promise<DocumentUser[]> {
        const usersQuery: DocumentQuery<DocumentUser[], DocumentUser> = this._repository.find({
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
        return this._addLazyLoadAndModify(usersQuery, principal, skip, limit);
    }

    public async createUser(user: CreateQuery<User>, principal?: Principal): Promise<DocumentUser> {
        const newUser: DocumentUser = await this._repository
            .create(user);
        return this._addFields(newUser, principal);
    }

    public async updateUser(user: User, principal: Principal): Promise<DocumentUser> {
        const oldUser: DocumentUser = await this._repository
            .findById(principal.details._id);
        const updatedUser: DocumentUser = await this._repository
            .findByIdAndUpdate(
                principal.details._id,
                {
                    $set: {
                        avatar: (user.avatar || oldUser.avatar),
                        firstName: (user.firstName || oldUser.firstName),
                        lastName: (user.lastName || oldUser.lastName),
                        username: (user.username || oldUser.username),
                        email: (user.email || oldUser.email),
                        active: (user.email ? (user.email === oldUser.email) : true),
                        lastUpdated: Date.now()
                    }
                },
                { new: true }
            )
            .select('-password')
            .lean();
        return this._addFields(updatedUser);
    }

    public async activateUser(userId: Types.ObjectId): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findByIdAndUpdate(userId, { $set: { active: true } }, { new: true })
            .select('-password')
            .lean();
        return this._addFields(user);
    }

    public async deleteUser(principal: Principal): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findByIdAndDelete(principal.details._id)
            .lean();
        return user;
    }

    public async followUser(userIdToFollow: Types.ObjectId, principal: Principal): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findByIdAndUpdate(
                userIdToFollow,
                { $addToSet: { followers: principal.details._id } }
            )
            .select(this._selectFields)
            .lean();
        return this._addFields(user, principal);
    }

    public async unfollowUser(userIdToUnFollow: Types.ObjectId, principal: Principal): Promise<DocumentUser> {
        const user: DocumentUser = await this._repository
            .findByIdAndUpdate(
                userIdToUnFollow,
                { $pull: { followers: principal.details._id } }
            )
            .select(this._selectFields)
            .lean();
        return this._addFields(user, principal);
    }

    public async findUsersByUserIds(
        usersIds: Types.ObjectId[],
        principal: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentUser[]> {
        const findUsersQuery: DocumentQuery<DocumentUser[], DocumentUser> = this._repository
            .find({ _id: { $in: usersIds } });
        return this._addLazyLoadAndModify(findUsersQuery, principal, skip, limit);
    }

    public async findFollowers(
        userId: Types.ObjectId,
        principal?: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentUser[]> {
        const followerIds = (await this._repository.findById(userId)).followers,
            findUsersQuery: DocumentQuery<DocumentUser[], DocumentUser> = this._repository
                .find({ _id: { $in: followerIds } });
        return this._addLazyLoadAndModify(findUsersQuery, principal, skip, limit);
    }

    public async findFollows(
        userId: Types.ObjectId,
        principal?: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentUser[]> {
        const findUsersQuery: DocumentQuery<DocumentUser[], DocumentUser> = this._repository
            .find({ followers: { $elemMatch: { $eq: userId } } });
        return this._addLazyLoadAndModify(findUsersQuery, principal, skip, limit);
    }

    private async _addFields(
        user: DocumentUser,
        principal?: Principal
    ): Promise<DocumentUser> {
        if (!user) {
            return null;
        }

        if (principal && await principal.isAuthenticated() && !user._id.equals(principal.details._id)) {
            user.isFollower = (await this._repository.findById(principal.details._id)).followers.includes(user._id);
            user.isFollowed = (await this._repository.findById(user._id)).followers.includes(principal.details._id);
        }

        user.followersCount = user.followers.length;
        user.followingCount = await this._repository.countDocuments({ followers: { $elemMatch: { $eq: user._id } } });

        delete user.followers;

        return user;
    }

    private async _addLazyLoadAndModify(
        findUsersQuery: DocumentQuery<DocumentUser[], DocumentUser>,
        principal: Principal,
        skip?: number,
        limit?: number
    ): Promise<DocumentUser[]> {
        if (skip) {
            findUsersQuery = findUsersQuery.skip(skip);
        }
        if (limit) {
            findUsersQuery = findUsersQuery.limit(limit);
        }

        findUsersQuery
            .select(this._selectFields)
            .lean()
            .map(async (users: DocumentUser[]) => {
                for (const user of users) {
                    await this._addFields(user, principal);
                }
                return users;
            });
        return findUsersQuery;
    }
}
