import { screen } from "@testing-library/react";

/**
 * The row at `index` in the table body, skipping the header row.
 *
 * Throws instead of returning `undefined`, so a missing row fails with a
 * message naming what was expected — and callers need no non-null
 * assertion, which `noUncheckedIndexedAccess` would otherwise force.
 */
export function dataRow(index = 0): HTMLElement {
    const row = screen.getAllByRole("row").slice(1)[index];

    if (!row) {
        throw new Error(`Expected a table body row at index ${index}.`);
    }

    return row;
}
