import { redirect } from "next/navigation";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  void searchParams;
  redirect("/?auth=signup");
}
