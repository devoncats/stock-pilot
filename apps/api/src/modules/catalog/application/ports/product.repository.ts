import type { Page, PageParams } from "@stock-pilot/shared";
import { Product } from "@/modules/catalog/domain/product/product.js";
import { Sku } from "@/modules/catalog/domain/sku/sku.js";
import type { ProductId } from "@/shared/domain/product-id/product-id.js";

export type ListProductsQueryParams = PageParams;

export interface ProductRepository {
    findById(id: ProductId): Promise<Product | null>;
    findBySku(sku: Sku): Promise<Product | null>;
    list(params: ListProductsQueryParams): Promise<Page<Product>>;
    save(product: Product): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol("ProductRepository");
