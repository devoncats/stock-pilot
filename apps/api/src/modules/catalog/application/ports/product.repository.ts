import { Product } from "@/modules/catalog/domain/product/product.js";
import { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { Sku } from "@/modules/catalog/domain/sku/sku.js";
import { Page } from "@/shared/application/page.js";
import { Pagination } from "@/shared/application/pagination.js";

export interface ProductRepository {
    findById(id: ProductId): Promise<Product | null>;
    findBySku(sku: Sku): Promise<Product | null>;
    list(params: Pagination): Promise<Page<Product>>;
    save(product: Product): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol("ProductRepository");
