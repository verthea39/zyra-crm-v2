import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark } from "lucide-react";

export default function AccountDetailsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Landmark className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Account Details</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts & Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This module is under construction. Future updates will allow you to manage company bank accounts and financial details here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
