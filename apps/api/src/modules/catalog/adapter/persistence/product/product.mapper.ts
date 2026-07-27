import type {
    ProductModel,
    ProductUncheckedCreateInput,
} from "@/generated/prisma/models.js";
import { Product } from "@/modules/catalog/domain/product/product.js";
import { Sku } from "@/modules/catalog/domain/sku/sku.js";
import { Money } from "@/shared/domain/money/money.js";
import { productId } from "@/shared/domain/product-id/product-id.js";

export const ProductMapper = {
    toDomain(row: ProductModel): Product {
        const product = Product.create({
            id: productId(row.id),
            sku: Sku.create(row.sku),
            name: row.name,
            category: row.category,
            unitCost: Money.fromDecimalString(row.unitCost.toString()),
            price: row.price
                ? Money.fromDecimalString(row.price.toString())
                : null,
            holdingCostRate: Number(row.holdingCostRate),
            active: row.active,
        });

        return product;
    },
    toPersistence(product: Product): ProductUncheckedCreateInput {
        const row = {
            id: product.id,
            sku: product.sku.value,
            name: product.name,
            category: product.category,
            unitCost: product.unitCost.toDecimalString(),
            price: product.price ? product.price.toDecimalString() : null,
            holdingCostRate: product.holdingCostRate,
            active: product.active,
        };

        return row;
    },
};
