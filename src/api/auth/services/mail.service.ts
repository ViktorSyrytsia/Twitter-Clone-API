import * as path from 'path';
import * as EmailTemplate from 'email-templates';
import { createTransport, Transporter } from 'nodemailer';
import { injectable } from 'inversify';

import { HttpError } from '../../../shared/models/http.error';
import { EmailTemplatesEnum } from '../enums/email-templates.enum';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';

@injectable()
export class MailService {

    private _transporter: Transporter;

    private _emailTemplates: EmailTemplate;

    constructor() {
        this._transporter = createTransport({
            service: process.env.ROOT_EMAIL_SERVICE,
            auth: {
                user: process.env.ROOT_EMAIL,
                pass: process.env.ROOT_EMAIL_PASSWORD
            }
        });
        this._emailTemplates = new EmailTemplate({
            message: {},
            views: {
                root: path.resolve(__dirname, '../', 'email-templates')
            }
        });
    }

    public sendConfirmMail(
        email: string,
        firstName: string,
        token: string
    ): Promise<void> {
        return this._sendEmail(
            email,
            firstName,
            'Confirm your email',
            token,
            EmailTemplatesEnum.ConfirmEmail
        );
    }

    private async _sendEmail(
        email: string,
        firstName: string,
        subject: string,
        token: string,
        template: EmailTemplatesEnum
    ): Promise<void> {
        try {
            const frontendUrl: string = process.env.FRONTEND_URL,
                html: string = await this._emailTemplates.render(template, {
                    firstName,
                    token,
                    frontendUrl
                });
            return this._transporter.sendMail({
                from: `noreply<${process.env.ROOT_EMAIL}>`,
                to: email,
                subject: subject,
                html,
                attachments: [
                    {
                        path: path.resolve(__dirname, '../', 'email-templates/', 'assets/', 'logo.png'),
                        filename: 'logo.png',
                        cid: 'logo'
                    },
                ]

            });
        } catch (error) {
            // throw new HttpError(INTERNAL_SERVER_ERROR, 'Template render error');
            throw new HttpError(INTERNAL_SERVER_ERROR, error.message);
        }
    }
}
