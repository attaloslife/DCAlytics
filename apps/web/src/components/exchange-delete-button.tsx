"use client";

type ExchangeDeleteButtonProps = {
  exchangeName: string;
  connectionLabel: string;
};

export function ExchangeDeleteButton({
  exchangeName,
  connectionLabel
}: ExchangeDeleteButtonProps) {
  return (
    <button
      type="submit"
      className="button-secondary table-action-danger"
      onClick={(event) => {
        const confirmed = window.confirm(
          `Remove ${connectionLabel} from ${exchangeName}? This will delete the saved exchange connection profile for this portfolio.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      Remove
    </button>
  );
}
