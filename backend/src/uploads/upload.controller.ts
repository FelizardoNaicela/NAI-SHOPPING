import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ImageProcessingService } from '../images/image-processing.service';
import { UPLOADS_DIR } from '../common/storage-paths';

type ProcessedImage = {
  originalUrl: string
  largeUrl: string
  mediumUrl: string
  smallUrl: string
  thumbUrl: string
  webpUrl: string
  width: number | null
  height: number | null
  sizeKb: number
}
@Controller('upload')
export class UploadController {
  constructor(
    private imageProcessor: ImageProcessingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
}),
  }))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
  const processed: ProcessedImage[] = [];

  for (const file of files) {
    const data = await this.imageProcessor.processImage(file.filename);
    processed.push(data);
  }
    return processed;
  }
}
