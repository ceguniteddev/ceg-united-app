import Spinner from "@/components/Spinner";
import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemDescription,
  ChoiceboxItemHeader,
  ChoiceboxItemSubtitle,
  ChoiceboxItemTitle,
} from "@/components/ui/shadcn-io/choicebox";
import { useGetPlaidItemAccount } from "@/hooks/plaid";
import { useSelectedInstitutionStoreStore } from "@/store/plaid";

const Accounts = () => {
  const { selectedInstitution } = useSelectedInstitutionStoreStore();

  const { plaidItemAccount, isLoading } = useGetPlaidItemAccount(
    selectedInstitution?.accessToken || "",
    selectedInstitution?.institutionId || ""
  );

  if (isLoading) return <Spinner />;

  return (
    <Choicebox defaultValue="1">
      {plaidItemAccount?.accounts.map((option) => (
        <ChoiceboxItem key={option.account_id} value={option.account_id} className="p-2">
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle>
              {option.name}
              <ChoiceboxItemSubtitle>************{option.mask}</ChoiceboxItemSubtitle>
            </ChoiceboxItemTitle>
            <div className="flex flex-row justify-between items-center">
              <ChoiceboxItemDescription>{option.official_name}</ChoiceboxItemDescription>
              <div className="space-x-2 flex items-center">
                <span>{option.balances.iso_currency_code}</span>
                <span>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: option.balances.iso_currency_code || "USD",
                  }).format(option.balances.available ?? 0)}
                </span>
              </div>
            </div>
          </ChoiceboxItemHeader>
        </ChoiceboxItem>
      ))}
    </Choicebox>
  );
};
export default Accounts;
