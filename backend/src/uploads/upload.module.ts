import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImagesModule } from '../images/images.module';

@Module({
  imports: [ImagesModule],
  controllers: [UploadController],
})
export class UploadModule {}
