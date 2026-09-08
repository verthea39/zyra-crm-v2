import { editTask, listWorkflowStepsForTaskPicker } from "@/lib/actions/tasks";
import { listStaffUsers } from "@/lib/actions/workflows";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditFieldTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const taskId = resolvedParams.id;
  
  const [steps, staff, task] = await Promise.all([
    listWorkflowStepsForTaskPicker(), 
    listStaffUsers(),
    db.task.findUnique({ where: { id: taskId } })
  ]);
  
  if (!task) {
    notFound();
  }

  // Next.js 14 server actions with extra arguments can use bind
  const updateAction = editTask.bind(null, taskId);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit Field Task</h1>
        <p className="text-sm text-muted-foreground">
          Update an existing field task.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input name="title" defaultValue={task.title} required />
            </div>
            <div>
              <Label>Venue</Label>
              <Select name="venue" defaultValue={task.venue} required>
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
              <Select name="assigneeId" defaultValue={task.assigneeId} required>
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
              <Select name="workflowStepId" defaultValue={task.workflowStepId || ""}>
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
              <Input type="date" name="dueDate" defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea name="notes" defaultValue={task.notes || ""} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Link href="/field-tasks">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit">Update Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
