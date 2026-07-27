export const MovementType = {
    RECEIPT: "RECEIPT",
    SHIPMENT: "SHIPMENT",
    ADJUSTMENT: "ADJUSTMENT",
} as const;

export type MovementType = (typeof MovementType)[keyof typeof MovementType];
