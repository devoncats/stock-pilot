import { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { derivePosition } from "@/modules/inventory/domain/derive-position/derive-position.js";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export interface InventoryItemProps {
    productId: ProductId;
    onHand: number;
    reserved: number;
    onOrder: number;
    backordered: number;
}

export class InventoryItem {
    private constructor(private readonly props: Readonly<InventoryItemProps>) {}

    static create(props: InventoryItemProps): InventoryItem {
        if (!props.productId) {
            throw new InvalidValueError(
                "[InventoryItem]: Product ID cannot be empty",
            );
        }

        if (props.productId.trim().length === 0) {
            throw new InvalidValueError(
                "[InventoryItem]: Product ID cannot be empty",
            );
        }

        if (props.reserved > props.onHand) {
            throw new InvalidValueError(
                "[InventoryItem]: Reserved quantity cannot exceed on-hand quantity",
            );
        }

        if (props.onHand < 0) {
            throw new InvalidValueError(
                "[InventoryItem]: On-hand quantity cannot be negative",
            );
        }

        if (props.reserved < 0) {
            throw new Error(
                "[InventoryItem]: Reserved quantity cannot be negative",
            );
        }

        if (props.onOrder < 0) {
            throw new Error(
                "[InventoryItem]: On-order quantity cannot be negative",
            );
        }

        if (props.backordered < 0) {
            throw new Error(
                "[InventoryItem]: Backordered quantity cannot be negative",
            );
        }

        return new InventoryItem(props);
    }

    get productId(): ProductId {
        return this.props.productId;
    }

    get onHand(): number {
        return this.props.onHand;
    }

    get reserved(): number {
        return this.props.reserved;
    }

    get onOrder(): number {
        return this.props.onOrder;
    }

    get backordered(): number {
        return this.props.backordered;
    }

    get available(): number {
        return derivePosition(this.props).available;
    }

    get position(): number {
        return derivePosition(this.props).position;
    }
}
