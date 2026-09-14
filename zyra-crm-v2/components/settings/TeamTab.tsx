"use client";

import { useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { createTeamUser, updateUserRole } from "@/app/actions/settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeamTab({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "", email: "", role: "PRO_SPECIALIST", password: "Password123"
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const res = await createTeamUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any,
      password: newUser.password
    });

    if (res.success) {
      toast.success("Team member added successfully!");
      setUsers([...users, res.user]);
      setIsAddOpen(false);
      setNewUser({ name: "", email: "", role: "PRO_SPECIALIST", password: "Password123" });
    } else {
      toast.error(res.error || "Failed to add user");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const res = await updateUserRole(id, newRole as any);
    if (res.success) {
      toast.success("Role updated.");
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } else {
      toast.error(res.error || "Failed to update role");
    }
  };

  const roles = [
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "PRO_SPECIALIST", label: "PRO / Operations Specialist" },
    { value: "TYPIST", label: "Typist" },
    { value: "ACCOUNTANT", label: "Accountant / Finance" },
    { value: "ADMIN", label: "Legacy Admin" },
    { value: "COORDINATOR", label: "Legacy Coordinator" }
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Team Members & Access</h2>
          <p className="text-sm text-slate-500">Manage office staff roles and permissions.</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold uppercase">
                  {u.name.substring(0,2)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-tight">{u.name}</h3>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              {u.isActive ? (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs text-slate-500 flex items-center gap-1"><Shield className="w-3 h-3"/> System Role</Label>
              <select 
                className="w-full h-8 text-sm border-slate-200 rounded-md focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-slate-50"
                value={u.role}
                onChange={e => handleRoleChange(u.id, e.target.value)}
              >
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            
            <p className="text-[10px] text-slate-400">Added: {new Date(u.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Create a new staff account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="john@zyra.ae" />
            </div>
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <select 
                required 
                className="w-full flex h-10 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus:border-slate-400"
                value={newUser.role} 
                onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                {roles.filter(r => !r.value.includes('Legacy')).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Initial Password</Label>
              <Input required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button type="submit" className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold">Create Account</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
