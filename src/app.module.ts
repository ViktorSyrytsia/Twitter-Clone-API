import { Container } from 'inversify';

import { App } from './app';
import { UsersModule } from './api/users/users.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './api/auth/auth.module';
import { TweetsModule } from './api/tweets/tweets.module';
import { CommentsModule } from './api/comments/comment.module';
import { UploadsModule } from './api/uploads/uploads.module';

export const AppModule = new Container();
AppModule.bind(App).to(App);
AppModule.load(
    DatabaseModule,
    AuthModule,
    UploadsModule,
    UsersModule,
    TweetsModule,
    CommentsModule
);
