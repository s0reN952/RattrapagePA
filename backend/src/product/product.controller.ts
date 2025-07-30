import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get('warehouse/:id')
  findByWarehouse(@Param('id') id: number) {
    return this.productService.findByWarehouse(id);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.productService.findById(id);
  }

  @Post()
  create(@Body() product: any) {
    return this.productService.create(product);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() data: any) {
    return this.productService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productService.remove(id);
  }
}