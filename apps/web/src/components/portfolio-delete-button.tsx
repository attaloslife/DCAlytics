"use client";

type PortfolioDeleteButtonProps = {
  portfolioName: string;
};

export function PortfolioDeleteButton({ portfolioName }: PortfolioDeleteButtonProps) {
  return (
    <button
      type="submit"
      className="button-secondary portfolio-delete-button"
      onClick={(event) => {
        const confirmed = window.confirm(
          `Delete ${portfolioName}? This will permanently delete the portfolio and all associated data. This cannot be recovered.`
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      Delete
    </button>
  );
}
