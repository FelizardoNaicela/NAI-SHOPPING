import { Controller, Post, Get, Body } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() body: { name: string; parentId?: string }) {
    return this.categoriesService.create(body.name, body.parentId);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }
}
