export interface Page<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
}
