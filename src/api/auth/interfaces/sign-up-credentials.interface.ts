import { UploadedFile } from 'express-fileupload';

export interface SignUpCredentials {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    file?: UploadedFile;
}
