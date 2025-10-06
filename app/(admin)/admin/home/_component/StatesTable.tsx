import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  countsByState: Record<string, number>;
  selectedState?: string;
  onStateClick: (state: string) => void;
};

export function StatesTable({ countsByState, selectedState, onStateClick }: Props) {
  const rows = Object.entries(countsByState).sort((a, b) => b[1] - a[1]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications by State</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>State</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([state, count]) => (
              <TableRow
                key={state}
                // onClick={() => onStateClick(state)}
                // className={cn(
                //   "cursor-pointer hover:bg-muted transition",
                //   selectedState === state && "bg-muted font-semibold"
                // )}
              >
                <TableCell>{state}</TableCell>
                <TableCell className="text-right">{count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
