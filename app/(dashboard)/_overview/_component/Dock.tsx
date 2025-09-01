import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/shadcn-io/dock";
import { useGetPlaidItems } from "@/hooks/plaid";
import { useSelectedInstitutionStoreStore } from "@/store/plaid";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import Spinner from "@/components/Spinner";

export default function AppleStyleDock() {
  const { plaidItems, isLoading } = useGetPlaidItems();
  const { setSelectedInstitution, selectedInstitution } = useSelectedInstitutionStoreStore();

  useEffect(() => {
    if (plaidItems && plaidItems.length > 0 && !selectedInstitution) {
      setSelectedInstitution({
        institutionId: plaidItems[0].item.institution_id ?? "",
        accessToken: plaidItems[0].accessToken,
      });
    }
  }, [plaidItems, selectedInstitution, setSelectedInstitution]);

  if (isLoading) {
    return (
      <div className="absolute bottom-2 left-1/2 max-w-full -translate-x-1/2">
        <Spinner displayText="" />
      </div>
    );
  }

  if (!plaidItems || plaidItems.length === 0) {
    return null;
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((word) => word[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }

  return (
    <div className="absolute bottom-2 left-1/2 max-w-full -translate-x-1/2">
      <Dock className="items-end pb-3">
        {plaidItems?.map((item, idx) => (
          <div
            onClick={() =>
              setSelectedInstitution({
                institutionId: item.item.institution_id ?? "",
                accessToken: item.accessToken,
              })
            }
            key={idx}
          >
            <DockItem
              className={cn(
                "aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 cursor-pointer",
                selectedInstitution?.institutionId === item.item.institution_id
                  ? "ring-2 ring-offset-2 ring-blue-500 shadow-lg shadow-blue-500/30"
                  : "hover:ring-2 hover:ring-offset-2 hover:ring-gray-400"
              )}
            >
              <DockLabel>{item.item.institution_name}</DockLabel>

              <DockIcon>
                <span className="text-lg">{getInitials(item.item.institution_name ?? "")}</span>
              </DockIcon>
            </DockItem>
          </div>
        ))}
      </Dock>
    </div>
  );
}
