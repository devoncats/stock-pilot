export interface PositionInputs {
    onHand: number;
    reserved: number;
    onOrder: number;
    backordered: number;
}

export interface DerivedPosition {
    available: number;
    position: number;
}

export function derivePosition({
    onHand,
    reserved,
    onOrder,
    backordered,
}: PositionInputs): DerivedPosition {
    return {
        available: onHand - reserved,
        position: onHand + onOrder - backordered,
    };
}
