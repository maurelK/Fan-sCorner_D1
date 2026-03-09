import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CreatorsModule } from './modules/creators/creators.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    CreatorsModule,
    SubscriptionsModule,
    MessagesModule,
    PaymentsModule,
    UploadModule,
  ],
})
export class AppModule {}
