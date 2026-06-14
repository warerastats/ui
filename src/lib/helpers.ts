export const formatMoney = (amount: number, decimals = 4): string => {
    let min = 2;
    if (min > decimals) {
        min = decimals;
    }

    return `${amount.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: decimals })}`;
};
