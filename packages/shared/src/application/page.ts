export interface Page<T> {
    data: T[];
    offset: number;
    limit: number;
    total: number;
}

export interface PageParams {
    offset: number;
    limit: number;
}
