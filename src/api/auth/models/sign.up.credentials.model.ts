import { UploadedFile } from 'express-fileupload';
import {
    IsEmail,
    IsNotEmpty,
    Matches,
    IsMimeType,
    IsOptional,
} from 'class-validator';

export class SignUpCredentials {
    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName: string;

    @IsNotEmpty()
    username: string;

    @IsEmail({}, {
        message: 'Wrong email format',
    })
    email: string;

    @Matches( /^((?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9]).{6,})\S$/, { // https://regex101.com/library/fX8dY0
        message: 'Password must be at least 6 characters long, contain numbers, uppercase and lowercase letters'
    })
    password: string;

    @IsOptional()
    @IsMimeType()
    file?: UploadedFile;
}
