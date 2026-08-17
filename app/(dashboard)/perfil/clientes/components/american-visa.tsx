import { trpc } from "@/lib/trpc-client";

import { columns } from "../../components/columns";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "../../components/data-table";

export function AmericanVisa() {
  const { data, isFetching } = trpc.userRouter.getActiveClients.useQuery({
    category: "american_visa",
  });

  if (isFetching) {
    return (
      <div>
        <div className="flex items-center py-4">
          <Skeleton className="h-12 w-full sm:max-w-xs" />
        </div>
        <Skeleton className="h-32 w-full" />

        <div className="w-full flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="w-full flex items-center justify-between space-x-2 py-4 sm:justify-end sm:w-fit">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data?.clients ?? []}
      category="american_visa"
    />
  );
}
