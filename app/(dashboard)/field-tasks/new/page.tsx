import { createTask, listWorkflowStepsForTaskPicker } from "@/lib/actions/tasks";
import { listStaffUsers } from "@/lib/actions/workflows";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewFieldTaskPage() {
  const [steps, staff] = await Promise.all([listWorkflowStepsForTaskPicker(), listStaffUsers()]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dispatch Field Task</h1>
        <p className="text-sm text-muted-foreground">
          Assign a mobile checklist item to a PRO/field agent.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTask} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input name="title" placeholder="e.g. Submit MOA for notarization" required />
            </div>
            <div>
              <Label>Venue</Label>
              <Select name="venue" required>
                <option value="AMER_CENTER">Amer Center</option>
                <option value="TASHEEL">Tasheel</option>
                <option value="MOHRE">MOHRE</option>
                <option value="ICP">ICP</option>
                <option value="GDRFA">GDRFA</option>
                <option value="EMBASSY">Embassy</option>
                <option value="MEDICAL_FITNESS_CENTER">Medical Fitness Center</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div>
              <Label>Assign to</Label>
              <Select name="assigneeId" required>
                <option value="" disabled>
                  Select staff…
                </option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Related workflow step (optional)</Label>
              <Select name="workflowStepId" defaultValue="">
                <option value="">None</option>
                {steps.map((s) => {
                  const clientName =
                    s.workflow.client.corporateProfile?.companyNameEn ??
                    s.workflow.client.individualProfile?.fullNameEn ??
                    "—";
                  return (
                    <option key={s.id} value={s.id}>
                      {clientName} · {s.name}
                    </option>
                  );
                })}
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" name="dueDate" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea name="notes" rows={3} />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Dispatch Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
