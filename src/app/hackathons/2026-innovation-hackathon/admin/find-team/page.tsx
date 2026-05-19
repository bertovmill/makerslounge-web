import { redirect } from "next/navigation";

export default function HackathonAdminFindTeamRedirect() {
  redirect("/admin/hackathon-signups");
}
