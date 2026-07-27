import { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { derivePosition } from "@/modules/inventory/domain/derive-position/derive-position.js";
import { InsufficientStockError } from "@/modules/inventory/domain/errors/insufficient-stock/insufficient-stock.error.js";
import { InvalidMovementError } from "@/modules/inventory/domain/errors/invalid-movement/invalid-movement.error.js";
import { Quantity } from "@/modules/inventory/domain/quantity/quantity.js";
import { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";

export interface InventoryItemProps {
    productId: ProductId;
    onHand: number;
    reserved: number;
    onOrder: number;
    backordered: number;
}

export interface InventoryItemState {
    productId: ProductId;
    onHand: Quantity;
    reserved: Quantity;
    onOrder: Quantity;
    backordered: Quantity;
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

        const state: InventoryItemState = {
            productId: props.productId,
            onHand: Quantity.create(props.onHand),
            reserved: Quantity.create(props.reserved),
            onOrder: Quantity.create(props.onOrder),
            backordered: Quantity.create(props.backordered),
        };

        if (state.reserved.value > state.onHand.value) {
            throw new InvalidValueError(
                "[InventoryItem]: Reserved quantity cannot exceed on-hand quantity",
            );
        }

        return new InventoryItem(props);
    }

    applyMovement(movement: StockMovement): InventoryItem {
        if (movement.productId !== this.props.productId) {
            throw new InvalidMovementError(
                "[InventoryItem]: Movement product ID does not match inventory item product ID",
            );
        }

        const nextOnHand = this.props.onHand + movement.qty;

        if (nextOnHand < 0) {
            throw new InsufficientStockError(
                `[InventoryItem]: A movement of ${movement.qty} would leave on-hand at ${nextOnHand}`,
            );
        }

        if (nextOnHand < this.props.reserved) {
            throw new InsufficientStockError(
                `[InventoryItem]: A movement of ${movement.qty} would leave ${this.reserved} reserved against ${nextOnHand} on hand`,
            );
        }

        return InventoryItem.create({
            productId: this.props.productId,
            onHand: nextOnHand,
            reserved: this.props.reserved,
            onOrder: this.props.onOrder,
            backordered: this.props.backordered,
        });
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
