import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageProcessingService {
  private basePath = 'uploads';

  async processImage(filename: string) {
    const originalPath = path.join(this.basePath, filename);
    const image = sharp(originalPath);
    const metadata = await image.metadata();

    const name = path.parse(filename).name;

    const paths = {
      large: `uploads/large/${name}.jpg`,
      medium: `uploads/medium/${name}.jpg`,
      small: `uploads/small/${name}.jpg`,
      thumb: `uploads/thumb/${name}.jpg`,
      webp: `uploads/webp/${name}.webp`,
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
      largeUrl: `/${paths.large}`,
      mediumUrl: `/${paths.medium}`,
      smallUrl: `/${paths.small}`,
      thumbUrl: `/${paths.thumb}`,
      webpUrl: `/${paths.webp}`,
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      sizeKb: Math.round(stats.size / 1024),
    };
  }

  private async ensureFolders() {
    const dirs = [
      'uploads/large',
      'uploads/medium',
      'uploads/small',
      'uploads/thumb',
      'uploads/webp',
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
}
