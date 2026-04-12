import { Button } from "@/components/companies/Button";

export function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry,
}) {
  return (
    <section className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] p-5">
      <p className="m-0 text-lg font-semibold text-[var(--dash-danger)]">
        {title}
      </p>
      <p className="m-0 mt-2 text-sm text-[var(--dash-danger)]">
        {message || "Unable to load companies right now."}
      </p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </section>
  );
}
