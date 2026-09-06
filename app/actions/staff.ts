"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/rbac";
import { createAdminClient } from "@supabase/server/core";
import { createSupabaseContext } from "@/lib/supabase/context";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("Missing Supabase admin env vars");
  return createAdminClient({ env: { url, secretKeys: { default: secretKey } } });
}

export async function createStaffAction(prevState: any, formData: FormData) {
  let user;
  try {
    const session = await requireSession();
    user = session.user;
    assertPermission(user.role, "users:manage");
  } catch {
    return { error: "Unauthorized: only Super Admins can manage staff." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const roleName = formData.get("role") as string;

  if (!name || !email || !password || !roleName) {
    return { error: "All fields are required." };
  }

  try {
    const role = await db.role.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      return { error: "Invalid role selected." };
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "A user with this email already exists." };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error(authError);
      return { error: "Failed to create user in authentication system." };
    }

    await db.user.create({
      data: {
        name,
        email,
        authId: authData.user.id,
        roleId: role.id,
      },
    });
  } catch (error: any) {
    console.error(error);
    return { error: "Failed to create staff member." };
  }

  revalidatePath("/staff");
  redirect("/staff");
}

export async function deleteStaffAction(userId: string) {
  let sessionUser;
  try {
    const session = await requireSession();
    sessionUser = session.user;
    assertPermission(sessionUser.role, "users:manage");
  } catch {
    return { error: "Unauthorized" };
  }

  // Prevent self-deletion
  if (sessionUser.id === userId) {
    return { error: "Cannot delete your own account." };
  }

  try {
    const userToDelete = await db.user.findUnique({ where: { id: userId } });
    if (!userToDelete) return { error: "User not found." };

    await db.user.delete({ where: { id: userId } });

    if (userToDelete.authId) {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.auth.admin.deleteUser(userToDelete.authId);
    }

    revalidatePath("/staff");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2003') {
      return { error: "Cannot delete this staff member because they are assigned to clients or tasks. Please edit their profile and mark them as 'Inactive' instead." };
    }
    return { error: "Failed to delete staff member." };
  }
}

export async function updateStaffAction(prevState: any, formData: FormData) {
  let sessionUser;
  try {
    const session = await requireSession();
    sessionUser = session.user;
    assertPermission(sessionUser.role, "users:manage");
  } catch {
    return { error: "Unauthorized" };
  }

  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const roleName = formData.get("role") as string;
  const isActive = formData.get("isActive") === "true";

  if (!userId || !name || !email || !roleName) {
    return { error: "Required fields are missing." };
  }

  try {
    const role = await db.role.findUnique({ where: { name: roleName } });
    if (!role) return { error: "Invalid role selected." };

    await db.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        isActive,
        roleId: role.id,
      },
    });
  } catch (error) {
    console.error(error);
    return { error: "Failed to update staff member." };
  }

  revalidatePath("/staff");
  redirect("/staff");
}
