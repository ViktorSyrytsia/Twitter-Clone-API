import { injectable } from 'inversify';
import { ReturnModelType } from '@typegoose/typegoose';

import { DatabaseConnection } from '../../../database/database-connection';
import { DocumentUser, User } from '../models/user.model';
import { RepositoryBase } from '../../base/repository.base';

@injectable()
export class UsersRepository extends RepositoryBase<User> {
    public _repository: ReturnModelType<typeof User>;

    constructor(private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, User);
    }

    public async findByName(searchValue: string): Promise<DocumentUser[]> {
        return this._repository.find({
            $or: [
                {
                    firstName: {
                        $regex: searchValue,
                        $options: 'i',
                    },
                },
                {
                    lastName: {
                        $regex: searchValue,
                        $options: 'i',
                    },
                },
            ],
        });
    }
}
