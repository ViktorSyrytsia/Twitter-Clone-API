import { DocumentUser } from '../../users/models/user.model';

export interface UserWithTokenResponse {
    user: DocumentUser;
    token: string;
}
