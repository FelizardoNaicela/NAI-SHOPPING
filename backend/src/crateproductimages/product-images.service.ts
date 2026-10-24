import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';


@Injectable()
export class ProductImagesService {
  constructor(private prisma: PrismaService) {}

  async addImages(productId: string, urls: string[]) {
    const count = await this.prisma.productImage.count({
      where: { productId },
    });

    return this.prisma.productImage.createMany({
      data: urls.map((url, index) => ({
        originalUrl: url,
        productId,
        order: count + index,
      })),
    });
  }

  async setCover(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) throw new NotFoundException();

    await this.prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { isCover: false },
    });

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { isCover: true },
    });
  }

  async reorder(productId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.productImage.update({
        where: { id },
        data: { order: index },
      }),
    );

    return this.prisma.$transaction(updates);
  }

  async remove(imageId: string) {
    return this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }
}
