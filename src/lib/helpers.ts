export const formatMoney = (amount: number, decimals = 4): string => {
    let min = 2;
    if (min > decimals) {
        min = decimals;
    }

    return `${amount.toLocaleString(undefined, { minimumFractionDigits: min, maximumFractionDigits: decimals })}`;
};

export const formatCompactNumber = (value: number): string => {
    if (value >= 1_000_000_000) {
        return (value / 1_000_000_000).toFixed(1) + "B";
    }
    if (value >= 1_000_000) {
        return (value / 1_000_000).toFixed(1) + "M";
    }
    if (value >= 1_000) {
        return (value / 1_000).toFixed(1) + "K";
    }
    return value.toString();
};
