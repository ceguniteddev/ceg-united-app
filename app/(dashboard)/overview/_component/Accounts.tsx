import {
  Choicebox,
  ChoiceboxItem,
  ChoiceboxItemContent,
  ChoiceboxItemDescription,
  ChoiceboxItemHeader,
  ChoiceboxItemIndicator,
  ChoiceboxItemSubtitle,
  ChoiceboxItemTitle,
} from "@/components/ui/shadcn-io/choicebox";
import { useGetPlaidItemAccount } from "@/hooks/plaid";
import { useSelectedInstitutionStoreStore } from "@/store/plaid";
const options = [
  {
    id: "1",
    label: "Option 1",
    subtitle: "(the first option)",
    description: "This is the first option",
  },
  {
    id: "2",
    label: "Option 2",
    subtitle: "(the second option)",
    description: "This is the second option",
  },
];
const Accounts = () => {
  const { selectedInstitution } = useSelectedInstitutionStoreStore();

  const { plaidItemAccount } = useGetPlaidItemAccount(
    selectedInstitution?.accessToken || "",
    selectedInstitution?.institutionId || ""
  );
  console.log(plaidItemAccount);
  return (
    <Choicebox defaultValue="1">
      {options.map((option) => (
        <ChoiceboxItem key={option.id} value={option.id}>
          <ChoiceboxItemHeader>
            <ChoiceboxItemTitle>
              {option.label}
              <ChoiceboxItemSubtitle>{option.subtitle}</ChoiceboxItemSubtitle>
            </ChoiceboxItemTitle>
            <ChoiceboxItemDescription>{option.description}</ChoiceboxItemDescription>
          </ChoiceboxItemHeader>
          <ChoiceboxItemContent>
            <ChoiceboxItemIndicator />
          </ChoiceboxItemContent>
        </ChoiceboxItem>
      ))}
    </Choicebox>
  );
};
export default Accounts;
