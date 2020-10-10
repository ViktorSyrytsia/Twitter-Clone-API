import { UploadedFile } from 'express-fileupload';
import * as fs from 'fs';
import { INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';
import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { HttpError } from '../../../shared/models/http.error';
import { DocumentFile, File } from '../models/file.model';
import { UploadsRepository } from '../repositories/uploads.repository';


@injectable()
export class UploadsService {
    constructor(
        private _uploadsRepository: UploadsRepository
    ) { }

    public async createFile(
        authorId: Types.ObjectId,
        file: UploadedFile
    ): Promise<DocumentFile> {
        try {
            const path = this._saveFile(file);
            return await this._uploadsRepository.createFile(
                new File({
                    author: authorId,
                    originalName: file.name,
                    extension: file.mimetype.split('/')[1],
                    type: file.mimetype.split('/')[0],
                    path,
                })
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async deleteFile(fileToRemove: DocumentFile): Promise<DocumentFile> {
        try {
            await this._deleteLocalFile(fileToRemove.path);
            return await this._uploadsRepository.deleteFile(fileToRemove._id);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findFilesByAuthor(
        authorId: Types.ObjectId,
        skip?: number,
        limit?: number,
        type?: string
    ): Promise<DocumentFile[]> {
        try {
            return this._uploadsRepository.findFilesByAuthorIds(
                [authorId],
                skip,
                limit,
                type
            );
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    public async findFileById(fileId: Types.ObjectId): Promise<DocumentFile> {
        try {
            return this._uploadsRepository.findById(fileId);
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    private _deleteLocalFile(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(new Error('File not deleted'));
                }
                resolve();
            });
        });
    }

    private _saveFile(file: UploadedFile): string {
        try {
            const path = this._pathCreator(file.mimetype, file.name);
            fs.writeFile(path, file.data, (err: Error) => {
                if (err) {
                    throw new HttpError(
                        INTERNAL_SERVER_ERROR,
                        `File uploading error: ${err.message}`
                    );
                }
            });
            return path.replace(/\s/g, '-');
        } catch (error) {
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }

    private _pathCreator(fileTypeString: string, fileName: string): string {
        const fileType: string = fileTypeString.split('/')[0];
        let path: string;
        switch (fileType) {
            case 'image':
                path = `./public/files/images/${new Date().toISOString().replace(/:/g, '-')}-${fileName}`;
                break;
            case 'audio':
                path = `./public/files/audios/${new Date().toISOString().replace(/:/g, '-')}-${fileName}`;
                break;
            case 'video':
                path = `./public/files/videos/${new Date().toISOString().replace(/:/g, '-')}-${fileName}`;
                break;
            default:
                path = `./public/files/others/${new Date().toISOString().replace(/:/g, '-')}-${fileName}`;
                break;
        }
        return path;
    }
}
