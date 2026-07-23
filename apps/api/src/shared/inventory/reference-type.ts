export const ReferenceType = {
    PURCHASE_ORDER: "PURCHASE_ORDER",
    CUSTOMER_ORDER: "CUSTOMER_ORDER",
    MANUAL: "MANUAL",
} as const;

export type ReferenceType = (typeof ReferenceType)[keyof typeof ReferenceType];
