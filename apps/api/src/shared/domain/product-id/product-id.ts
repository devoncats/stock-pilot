export type ProductId = string & { readonly __brand: "ProductId" };

export function productId(value: string): ProductId {
    return value as ProductId;
}
