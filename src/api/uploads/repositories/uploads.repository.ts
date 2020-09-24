import { ReturnModelType } from '@typegoose/typegoose';
import { injectable } from 'inversify';
import { CreateQuery, DocumentQuery, Types } from 'mongoose';
import { DatabaseConnection } from '../../../database/database-connection';
import { RepositoryBase } from '../../base/repository.base';
import { DocumentFile, File } from '../models/file.model';


@injectable()
export class UploadsRepository extends RepositoryBase<File> {
    protected _repository: ReturnModelType<typeof File>;

    constructor(
        private _databaseConnection: DatabaseConnection) {
        super();
        this.initRepository(this._databaseConnection, File);
    }

    public async findFilesByAuthorIds(
        authorsIds: Types.ObjectId[],
        skip?: number,
        limit?: number,
        type?: string
    ): Promise<DocumentFile[]> {
        const findFilesQuery: DocumentQuery<
            DocumentFile[],
            DocumentFile
        > = this._repository
            .find({ author: { $in: authorsIds } })
            .sort({ createdAt: -1 });
        return this._addLazyLoadAndModify(findFilesQuery, skip, limit, type);
    }

    public async findById(id: Types.ObjectId): Promise<DocumentFile> {
        return await this._repository.findById(id);
    }

    public async createFile(file: CreateQuery<File>): Promise<DocumentFile> {
        return this._repository.create(file);
    }

    public async deleteFile(fileId: Types.ObjectId): Promise<DocumentFile> {
        return this._repository.findByIdAndDelete(fileId);
    }

    private async _addLazyLoadAndModify(
        findFileQuery: DocumentQuery<DocumentFile[], DocumentFile>,
        skip?: number,
        limit?: number,
        type?: string
    ): Promise<DocumentFile[]> {
        if (skip) {
            findFileQuery = findFileQuery.skip(skip);
        }
        if (limit) {
            findFileQuery = findFileQuery.limit(limit);
        }
        if (type) {
            findFileQuery = findFileQuery.find({ type: type });
        }

        return findFileQuery;
    }
}
