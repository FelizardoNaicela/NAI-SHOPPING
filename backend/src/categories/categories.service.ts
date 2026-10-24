import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(name: string, parentId?: string) {
    return this.prisma.category.create({
      data: {
        name,
        slug: name
  .normalize('NFD')                 // separa letras dos acentos
  .replace(/[\u0300-\u036f]/g, '')  // remove os acentos
  .toLowerCase()
  .replace(/\s+/g, '-'),
        parentId,
      },
    });
  }

  findAll() {
  return this.prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        orderBy: { name: "asc" }
      }
    },
    orderBy: { name: "asc" }
  });
}
}
