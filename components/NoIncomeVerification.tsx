const NoIncomeVerification = ({ tokenType }: { tokenType: string }) => {
  return (
    <div className="flex-center min-h-[50vh] w-full px-4">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-chart p-8 text-center">
        <h1 className="text-24 font-semibold">No income verification found</h1>
        <p className="mt-2 text-muted-foreground">
          Income verification is currently unavailable.
        </p>
      </div>
    </div>
  );
};

export default NoIncomeVerification;
