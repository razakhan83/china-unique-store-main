'use client';

export default function DiscountConfigFields({
  discountPercentage,
  onDiscountPercentageChange,
  discountType,
  onDiscountTypeChange,
  discountEndsAt,
  onDiscountEndsAtChange,
  price,
}) {
  const percentage = Math.min(100, Math.max(0, Number(discountPercentage) || 0));
  const basePrice = Number(price) || 0;
  const salePrice = percentage > 0 ? Math.round(basePrice * (1 - percentage / 100)) : basePrice;
  const showChoices = percentage > 0;

  return (
    /* --- [DISCOUNT_CONFIG] START --- */
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="discount-percentage">
          Discount Percentage (%)
        </label>
        <input
          id="discount-percentage"
          type="number"
          min="0"
          max="100"
          value={discountPercentage}
          onChange={(event) => onDiscountPercentageChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm"
          placeholder="e.g. 25"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          The original price stays the compare-at price.
          {percentage > 0 ? ` Sale price: PKR ${salePrice.toLocaleString('en-PK')}.` : ''}
        </p>
      </div>

      {showChoices ? (
        <fieldset className="space-y-2 rounded-xl border border-border p-3">
          <legend className="px-1 text-sm font-medium">Discount length</legend>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/50">
            <input
              type="radio"
              name="discount-type"
              className="mt-1"
              checked={discountType !== 'time-based'}
              onChange={() => onDiscountTypeChange('no-time')}
            />
            <span>
              <span className="block text-sm font-semibold">Standard Discount</span>
              <span className="block text-xs text-muted-foreground">No end date. The sale price stays until you remove it.</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/50">
            <input
              type="radio"
              name="discount-type"
              className="mt-1"
              checked={discountType === 'time-based'}
              onChange={() => onDiscountTypeChange('time-based')}
            />
            <span>
              <span className="block text-sm font-semibold">Flash Sale / Limited Time</span>
              <span className="block text-xs text-muted-foreground">Ends at the date and time you set. The price returns to normal when the timer hits zero.</span>
            </span>
          </label>
          {discountType === 'time-based' ? (
            <label className="block px-2 pt-1 text-sm">
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Ends at</span>
              <input
                type="datetime-local"
                required
                value={discountEndsAt}
                onChange={(event) => onDiscountEndsAtChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
              />
            </label>
          ) : null}
        </fieldset>
      ) : null}
    </div>
    /* --- [DISCOUNT_CONFIG] END --- */
  );
}
