import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Skeleton for dashboard cards
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[80px] mb-2" />
        <Skeleton className="h-3 w-[100px]" />
      </CardContent>
    </Card>
  );
}

// Skeleton for table rows
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <TableRow>
      {Array.from({ length: columns }).map((_, index) => (
        <TableCell key={index}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// Skeleton for complete table
export function TableSkeleton({ 
  columns = 5, 
  rows = 5,
  headers = []
}: { 
  columns?: number; 
  rows?: number;
  headers?: string[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.length > 0 ? (
            headers.map((header, index) => (
              <TableHead key={index}>{header}</TableHead>
            ))
          ) : (
            Array.from({ length: columns }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-[100px]" />
              </TableHead>
            ))
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRowSkeleton key={rowIndex} columns={columns} />
        ))}
      </TableBody>
    </Table>
  );
}

// Skeleton for farm cards
export function FarmCardSkeleton() {
  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-5 w-[60px]" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-[80px]" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-[70px]" />
            </div>
            <div className="flex items-center justify-between mt-2 pt-1">
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-4 w-[50px]" />
            </div>
          </div>
        </div>
        
        <Skeleton className="h-8 w-8 ml-2" />
      </div>
    </div>
  );
}

// Skeleton for list items
export function ListItemSkeleton() {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-[180px] mb-2" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-3 w-[60px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

// Skeleton for stats grid
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

// Skeleton for form
export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-[100px] mb-2" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-[120px] mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-[80px]" />
        <Skeleton className="h-9 w-[80px]" />
      </div>
    </div>
  );
}

// Skeleton for media/image cards
export function MediaCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="w-full h-48 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton for media grid
export function MediaGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <MediaCardSkeleton key={index} />
      ))}
    </div>
  );
} 