import {
    derivePosition,
    type PositionInputs,
} from "@/modules/inventory/domain/derive-position/derive-position.js";
import { InsufficientStockError } from "@/modules/inventory/domain/errors/insufficient-stock/insufficient-stock.error.js";
import { InvalidMovementError } from "@/modules/inventory/domain/errors/invalid-movement/invalid-movement.error.js";
import { Quantity } from "@/modules/inventory/domain/quantity/quantity.js";
import { StockMovement } from "@/modules/inventory/domain/stock-movement/stock-movement.js";
import { InvalidValueError } from "@/shared/domain/errors/invalid-value/invalid-value.error.js";
import type { ProductId } from "@/shared/domain/product-id/product-id.js";

export interface InventoryItemProps extends PositionInputs {
    productId: ProductId;
}

interface InventoryItemState {
    productId: ProductId;
    onHand: Quantity;
    reserved: Quantity;
    onOrder: Quantity;
    backordered: Quantity;
}

export class InventoryItem {
    private constructor(private readonly state: Readonly<InventoryItemState>) {}

    static create(props: InventoryItemProps): InventoryItem {
        if (!props.productId || props.productId.trim().length === 0) {
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

        return new InventoryItem(state);
    }

    applyMovement(movement: StockMovement): InventoryItem {
        if (movement.productId !== this.productId) {
            throw new InvalidMovementError(
                `[InventoryItem]: Movement belongs to product ${movement.productId}, not ${this.productId}`,
            );
        }

        const nextOnHand = this.onHand + movement.qty;

        if (nextOnHand < 0) {
            throw new InsufficientStockError(
                `[InventoryItem]: A movement of ${movement.qty} would leave on-hand at ${nextOnHand}`,
            );
        }

        if (nextOnHand < this.reserved) {
            throw new InsufficientStockError(
                `[InventoryItem]: A movement of ${movement.qty} would leave ${this.reserved} reserved against ${nextOnHand} on hand`,
            );
        }

        return InventoryItem.create({
            ...this.levels(),
            productId: this.productId,
            onHand: nextOnHand,
        });
    }

    get productId(): ProductId {
        return this.state.productId;
    }

    get onHand(): number {
        return this.state.onHand.value;
    }

    get reserved(): number {
        return this.state.reserved.value;
    }

    get onOrder(): number {
        return this.state.onOrder.value;
    }

    get backordered(): number {
        return this.state.backordered.value;
    }

    get available(): number {
        return derivePosition(this.levels()).available;
    }

    get position(): number {
        return derivePosition(this.levels()).position;
    }

    private levels(): PositionInputs {
        return {
            onHand: this.state.onHand.value,
            reserved: this.state.reserved.value,
            onOrder: this.state.onOrder.value,
            backordered: this.state.backordered.value,
        };
    }
}
