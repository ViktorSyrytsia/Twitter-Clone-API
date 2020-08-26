import { injectable } from 'inversify';
import { uuid } from 'uuidv4';

import { TokenRepository } from '../repositories/token.repository';
import { DocumentToken, Token } from '../models/token.model';
import { TokenType } from '../enums/token.enum';

@injectable()
export class TokenService {
    constructor(private _tokenRepository: TokenRepository) {}

    public async findToken(
        body: string,
        type: TokenType
    ): Promise<DocumentToken[]> {
        return this._tokenRepository.findByBodyAndType(body, type);
    }

    public async createConfirmPasswordToken(
        userId: string
    ): Promise<DocumentToken> {
        return this._tokenRepository.createToken(
            new Token({
                userId,
                tokeBody: uuid(),
                tokenType: TokenType.ConfirmEmail,
                createdAt: Date.now(),
            })
        );
    }

    public async deleteToken(tokenId: string): Promise<DocumentToken> {
        return this._tokenRepository.deleteToken(tokenId);
    }
}
