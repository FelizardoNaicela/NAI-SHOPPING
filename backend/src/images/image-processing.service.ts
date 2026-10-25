import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { UPLOADS_DIR } from '../common/storage-paths';

@Injectable()
export class ImageProcessingService {
 private basePath = UPLOADS_DIR;

  async processImage(filename: string) {
    const originalPath = path.join(this.basePath, filename);
    const image = sharp(originalPath);
    const metadata = await image.metadata();

    const name = path.parse(filename).name;

    const paths = {
  large: path.join(this.basePath, 'large', `${name}.jpg`),
  medium: path.join(this.basePath, 'medium', `${name}.jpg`),
  small: path.join(this.basePath, 'small', `${name}.jpg`),
  thumb: path.join(this.basePath, 'thumb', `${name}.jpg`),
  webp: path.join(this.basePath, 'webp', `${name}.webp`),
};

    // garantir pastas
    await this.ensureFolders();

    // LARGE (1200px)
    await image
      .resize(1200, null, { withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(paths.large);

    // MEDIUM (800px)
    await image
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(paths.medium);

    // SMALL (400px)
    await image
      .resize(400, null, { withoutEnlargement: true })
      .jpeg({ quality: 78 })
      .toFile(paths.small);

    // THUMB (200x200 crop)
    await image
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 75 })
      .toFile(paths.thumb);

    // WEBP
    await image
      .webp({ quality: 80 })
      .toFile(paths.webp);

    const stats = fs.statSync(originalPath);

    return {
  originalUrl: `/uploads/${filename}`,
  largeUrl: `/uploads/large/${name}.jpg`,
  mediumUrl: `/uploads/medium/${name}.jpg`,
  smallUrl: `/uploads/small/${name}.jpg`,
  thumbUrl: `/uploads/thumb/${name}.jpg`,
  webpUrl: `/uploads/webp/${name}.webp`,
  width: metadata.width ?? null,
  height: metadata.height ?? null,
  sizeKb: Math.round(stats.size / 1024),
};
  }

  private async ensureFolders() {
  const dirs = [
    path.join(this.basePath, 'large'),
    path.join(this.basePath, 'medium'),
    path.join(this.basePath, 'small'),
    path.join(this.basePath, 'thumb'),
    path.join(this.basePath, 'webp'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
}
