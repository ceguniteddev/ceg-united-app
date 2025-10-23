import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Props = {
  countsByState: Record<string, number>;
  selectedState?: string;
  onStateClick: (state: string) => void;
};

export function StatesTable({
  countsByState,
  selectedState,
  onStateClick,
}: Props) {
  const rows = Object.entries(countsByState).sort((a, b) => b[1] - a[1]);
  const hasScroll = rows.length > 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications by State</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={hasScroll ? "relative max-h-[300px] overflow-auto" : ""}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card">State</TableHead>
                <TableHead className="sticky top-0 bg-card text-right">
                  Count
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([state, count]) => (
                <TableRow
                  key={state}
                  onClick={() => onStateClick(state)}
                  className={cn(
                    "cursor-pointer",
                    selectedState === state && "bg-red-100"
                  )}
                >
                  <TableCell>{state}</TableCell>
                  <TableCell className="text-right">{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
