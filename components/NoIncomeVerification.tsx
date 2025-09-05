import PlaidIncomeLinkBank from "./PlaidLinkIncomeBank";
import PlaidIncomeLinkPayroll from "./PlaidLinkIncomePayroll";

const NoIncomeVerification = ({ tokenType }: { tokenType: TokenType }) => {
  return (
    <div className="flex-center min-h-[50vh] w-full px-4">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-chart p-8 text-center">
        {tokenType === "INCOME_VERIFICATION_BANK" && (
          <div>
            <h1 className="text-24 font-semibold">No income bank verification found</h1>
            <p className="mt-2 text-muted-foreground">Verify your bank income to get started.</p>
          </div>
        )}
        {tokenType === "INCOME_VERIFICATION_PAYROLL" && (
          <div>
            <h1 className="text-24 font-semibold">No income payroll verification found</h1>
            <p className="mt-2 text-muted-foreground">Verify your payroll income to get started.</p>
          </div>
        )}

        <br />
        {tokenType === "INCOME_VERIFICATION_BANK" && <PlaidIncomeLinkBank />}
        {tokenType === "INCOME_VERIFICATION_PAYROLL" && <PlaidIncomeLinkPayroll />}
      </div>
    </div>
  );
};

export default NoIncomeVerification;
