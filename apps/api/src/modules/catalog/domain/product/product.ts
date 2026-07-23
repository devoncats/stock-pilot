import type { Money } from "@/shared/domain/money/money.js";
import type { ProductId } from "../product-id/product-id.js";
import type { Sku } from "../sku/sku.js";

export interface ProductProps {
    id: ProductId;
    sku: Sku;
    name: string;
    category: string;
    unitCost: Money;
    price: Money | null;
    holdingCostRate: number;
    active: boolean;
}

export class Product {
    private constructor(private readonly props: Readonly<ProductProps>) {}

    static create(props: ProductProps): Product {
        if (!props.name) {
            throw new Error(
                "[Product]: Name cannot be empty or whitespace-only",
            );
        }

        if (props.name.trim().length === 0) {
            throw new Error(
                "[Product]: Name cannot be empty or whitespace-only",
            );
        }

        if (props.holdingCostRate < 0) {
            throw new Error(
                "[Product]: Holding cost rate must be a non-negative number",
            );
        }

        return new Product(props);
    }

    get id(): ProductId {
        return this.props.id;
    }

    get sku(): Sku {
        return this.props.sku;
    }

    get name(): string {
        return this.props.name;
    }

    get category(): string {
        return this.props.category;
    }

    get unitCost(): Money {
        return this.props.unitCost;
    }

    get price(): Money | null {
        return this.props.price;
    }

    get holdingCostRate(): number {
        return this.props.holdingCostRate;
    }

    get active(): boolean {
        return this.props.active;
    }
}
