import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { LegalInvestigationModule } from '../legal-investigation/legal-investigation.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    LegalInvestigationModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    PrismaService,
    ChatGateway,
    JwtService,
  ],
})
export class ChatModule {}