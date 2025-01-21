import { Resolver, Query, Mutation, Arg, Ctx, ID, UseMiddleware } from 'type-graphql';
import { Product, ProductModel } from '../models/Product';
import { isAuth } from '../middleware/isAuth';
import { isAdmin } from '../middleware/isAdmin';
import { Context } from '../types/Context';

@Resolver()
export class ProductResolver {
  @Query(() => [Product])
  async products(): Promise<Product[]> {
    return ProductModel.find({ isActive: true }).populate('createdBy');
  }

  @Query(() => Product, { nullable: true })
  async product(@Arg('id', () => ID) id: string): Promise<Product | null> {
    return ProductModel.findById(id).populate('createdBy');
  }

  @Mutation(() => Product)
  @UseMiddleware(isAuth, isAdmin)
  async createProduct(
    @Arg('name') name: string,
    @Arg('description') description: string,
    @Arg('price') price: number,
    @Arg('sku') sku: string,
    @Arg('stock') stock: number,
    @Arg('categories', () => [String]) categories: string[],
    @Ctx() { user }: Context
  ): Promise<Product> {
    const product = await ProductModel.create({
      name,
      description,
      price,
      sku,
      stock,
      categories,
      createdBy: user.id
    });

    return product.populate('createdBy');
  }

  @Mutation(() => Product)
  @UseMiddleware(isAuth, isAdmin)
  async updateProduct(
    @Arg('id', () => ID) id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('description', { nullable: true }) description?: string,
    @Arg('price', { nullable: true }) price?: number,
    @Arg('discountedPrice', { nullable: true }) discountedPrice?: number,
    @Arg('stock', { nullable: true }) stock?: number,
    @Arg('categories', () => [String], { nullable: true }) categories?: string[],
    @Arg('isActive', { nullable: true }) isActive?: boolean
  ): Promise<Product | null> {
    const product = await ProductModel.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price }),
        ...(discountedPrice && { discountedPrice }),
        ...(stock !== undefined && { stock }),
        ...(categories && { categories }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true }
    ).populate('createdBy');

    return product;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth, isAdmin)
  async deleteProduct(@Arg('id', () => ID) id: string): Promise<boolean> {
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  }

  @Query(() => [Product])
  async searchProducts(
    @Arg('query') query: string,
    @Arg('categories', () => [String], { nullable: true }) categories?: string[]
  ): Promise<Product[]> {
    const searchQuery: any = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    };

    if (categories && categories.length > 0) {
      searchQuery.categories = { $in: categories };
    }

    return ProductModel.find(searchQuery).populate('createdBy');
  }
} 