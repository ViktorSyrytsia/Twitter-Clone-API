import {
    IsNotEmpty,
    Matches,
} from 'class-validator';

export class SignInCredentials {
    @IsNotEmpty()
    emailOrUsername: string;

    @Matches( /^((?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9]).{6,})\S$/, { // https://regex101.com/library/fX8dY0
        message: 'Password must be at least 6 characters long, contain numbers, uppercase and lowercase letters'
    })
    password: string;
}
