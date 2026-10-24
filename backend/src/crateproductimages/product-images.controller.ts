import { Controller, Post, Body, Delete, Param, Patch} from '@nestjs/common';
import { ProductImagesService } from './product-images.service';


@Controller('product-images')
export class ProductImagesController {
  constructor(private service: ProductImagesService) {}

  @Post(':productId')
  addImages(
    @Param('productId') productId: string,
    @Body() body: { urls: string[] },
  ) {
    return this.service.addImages(productId, body.urls);
  }

  @Patch('cover/:imageId')
  setCover(@Param('imageId') imageId: string) {
    return this.service.setCover(imageId);
  }

  @Patch('reorder/:productId')
  reorder(
    @Param('productId') productId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.service.reorder(productId, body.orderedIds);
  }

  @Delete(':imageId')
  remove(@Param('imageId') imageId: string) {
    return this.service.remove(imageId);
  }
}
