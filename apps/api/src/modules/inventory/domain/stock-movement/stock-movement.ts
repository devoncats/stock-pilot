import { MovementType } from "@/generated/prisma/enums.js";
import { ProductId } from "@/modules/catalog/domain/product-id/product-id.js";
import { InvalidMovementError } from "@/modules/inventory/domain/errors/invalid-movement/invalid-movement.error.js";
import { IsoWeek } from "@/modules/inventory/domain/iso-week/iso-week.js";
import { MovementReference } from "@/modules/inventory/domain/movement-reference/movement-reference.js";
import { StockMovementId } from "@/modules/inventory/domain/stock-movement-id/stock-movement-id.js";

export interface StockMovementProps {
    id: StockMovementId;
    productId: ProductId;
    type: MovementType;
    qty: number;
    reference: MovementReference;
    reason: string | null;
    occurredAt: Date;
}

export class StockMovement {
    private constructor(
        private readonly props: Readonly<StockMovementProps>,
        private readonly _week: IsoWeek,
    ) {}

    static create(props: StockMovementProps): StockMovement {
        if (!Number.isInteger(props.qty)) {
            throw new InvalidMovementError(
                `[StockMovement]: Quantity must be an integer, got ${props.qty}`,
            );
        }

        if (props.qty === 0) {
            throw new InvalidMovementError(
                `[StockMovement]: Quantity cannot be zero`,
            );
        }

        if (props.type === MovementType.RECEIPT && props.qty < 0) {
            throw new InvalidMovementError(
                `[StockMovement]: Quantity cannot be negative for a receipt`,
            );
        }

        if (props.type === MovementType.SHIPMENT && props.qty > 0) {
            throw new InvalidMovementError(
                `[StockMovement]: Quantity cannot be positive for a shipment`,
            );
        }

        const reason = props.reason?.trim() || null;

        if (props.type === MovementType.ADJUSTMENT && reason === null) {
            throw new InvalidMovementError(
                `[StockMovement]: Reason is required for an adjustment`,
            );
        }

        if (Number.isNaN(props.occurredAt.getTime())) {
            throw new InvalidMovementError(
                `[StockMovement]: occurredAt must be a valid date`,
            );
        }

        const week = IsoWeek.fromDate(props.occurredAt);

        return new StockMovement(
            {
                ...props,
                reason,
                occurredAt: new Date(props.occurredAt.getTime()),
            },
            week,
        );
    }

    get id(): StockMovementId {
        return this.props.id;
    }

    get productId(): ProductId {
        return this.props.productId;
    }

    get type(): MovementType {
        return this.props.type;
    }

    get qty(): number {
        return this.props.qty;
    }

    get reference(): MovementReference {
        return this.props.reference;
    }

    get reason(): string | null {
        return this.props.reason;
    }

    get occurredAt(): Date {
        return new Date(this.props.occurredAt.getTime());
    }

    get week(): IsoWeek {
        return this._week;
    }
}
