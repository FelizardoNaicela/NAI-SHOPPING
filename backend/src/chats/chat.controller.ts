import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 🔥 CRIAR OU OBTER CONVERSA (user → store)
  @Post('conversation/:storeId')
  async getOrCreate(
    @Param('storeId') storeId: string,
    @Req() req,
  ) {
    const userId = req.user.sub;

    return this.chatService.getOrCreateConversation(
      userId,
      storeId,
    );
  }

  // 💬 ENVIAR MENSAGEM (HTTP fallback)
  @Post('message/:conversationId')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req,
    @Body('content') content: string,
  ) {
    const senderId = req.user.sub;

    return this.chatService.sendMessage(
      senderId,
      conversationId,
      content,
    );
  }

  // 📜 LISTAR MENSAGENS
  @Get('messages/:conversationId')
async getMessages(
  @Request() req,
  @Param('conversationId') conversationId: string,
  @Query('limit') limit?: string,
  @Query('cursor') cursor?: string,
) {
  return this.chatService.getMessages(
    conversationId,
    req.user.sub,
    Number(limit),
    cursor,
  );
}

  // 📥 CLIENTE → conversas com lojas
  @Get('conversations')
  async listUserConversations(@Req() req) {
    const userId = req.user.sub;

    return this.chatService.listConversations(userId);
  }

  // 📥 LOJA → conversas com usuários
  @Get('store')
async listStoreConversations(@Req() req) {
  const ownerId = req.user.sub;

  const stores = await this.chatService.getStoresByOwner(ownerId);

  if (!stores.length) return [];

  const storeIds = stores.map(s => s.id);

  return this.chatService.listStoreConversationsMultiple(
  storeIds,
  req.user.sub,
);}

@Post('upload')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/chat',

      filename: (_, file, cb) => {
        const unique =
          Date.now() +
          '-' +
          Math.round(Math.random() * 1e9);

        cb(
          null,
          `${unique}${extname(file.originalname)}`,
        );
      },
    }),
  }),
)
uploadChatImage(
  @UploadedFile() file: Express.Multer.File,
) {
  return {
    url: `/uploads/chat/${file.filename}`,
  };
}

@Post('upload-audio')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/chat/audio',

      filename: (_, file, cb) => {
        const unique =
          Date.now() +
          '-' +
          Math.round(Math.random() * 1e9);

        cb(
          null,
          `${unique}${extname(file.originalname)}`,
        );
      },
    }),
  }),
)
uploadChatAudio(
  @UploadedFile() file: Express.Multer.File,
) {
  return {
    url: `/uploads/chat/audio/${file.filename}`,
  };
}

@Post('upload-video')
@UseInterceptors(
  FileFieldsInterceptor(
    [
      {
        name: "file",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ],
    {
      storage: diskStorage({
        destination: "./uploads/chat/video",

        filename: (_, file, cb) => {

          const unique =
            Date.now() +
            "-" +
            Math.round(
              Math.random() * 1e9
            );

          cb(
            null,
            `${unique}${extname(file.originalname)}`
          );
        },
      }),
    },
  ),
)
uploadChatVideo(
  @UploadedFiles()
  files: {
    file?: Express.Multer.File[];
    thumbnail?: Express.Multer.File[];
  },
) {

  const video =
    files.file?.[0];

  const thumbnail =
    files.thumbnail?.[0];

  return {

    url:
      `/uploads/chat/video/${video!.filename}`,

    thumbnailUrl:
      thumbnail
        ? `/uploads/chat/video/${thumbnail.filename}`
        : null,

  };
}

@Post('upload-document')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/chat/documents',

      filename: (_, file, cb) => {
        const unique =
          Date.now() +
          '-' +
          Math.round(Math.random() * 1e9);

        cb(
          null,
          `${unique}${extname(file.originalname)}`,
        );
      },
    }),
  }),
)
uploadChatDocument(
  @UploadedFile() file: Express.Multer.File,
) {
  return {
    url: `/uploads/chat/documents/${file.filename}`,
    originalName: file.originalname,
  };
}

@Get("unread-count")
async getUnreadCount(@Req() req) {
  return this.chatService.getUnreadCount(
    req.user.sub,
  );
}

@Get("unread-messages")
async getUnreadMessages(@Req() req) {
  return this.chatService.getUnreadMessages(
    req.user.sub,
  );
}

@Post("share/message")
@UseGuards(JwtAuthGuard)
shareMessage(
  @Req() req,
  @Body()
  body: {
    conversationId: string;
    sharedMessageId: string;
  },
) {
  return this.chatService.createSharedMessage({
  conversationId: body.conversationId,
  senderId: req.user.sub,
  sharedMessageId: body.sharedMessageId,
});
}
@Get("conversation/:conversationId/info")
async getConversationInfo(
  @Param("conversationId")
  conversationId: string,

  @Req() req,
) {
  return this.chatService.getConversationInfo(
    conversationId,
    req.user.sub,
  );
}

@Get("share-conversations")
@UseGuards(JwtAuthGuard)
async getShareConversations(
  @Req() req,
) {
  const userId =
    req.user.id ?? req.user.sub;

  return this.chatService.listShareConversations(
  req.user.sub,
);
}

@Post('share/link')
@UseGuards(JwtAuthGuard)
shareLink(
  @Req() req,
  @Body()
  body: {
    conversationId: string;
    sharedProductId?: string;
    sharedPostId?: string;
  },
) {
  return this.chatService.createSharedLink({
  conversationId: body.conversationId,
  senderId: req.user.sub,
  sharedProductId: body.sharedProductId,
  sharedPostId: body.sharedPostId,
});
}


@Patch('message/:messageId')
async editMessage(
  @Param('messageId') messageId: string,
  @Req() req,
  @Body('content') content: string,
) {
  return this.chatService.editMessage(
    messageId,
    req.user.sub,
    content,
  );
}
}