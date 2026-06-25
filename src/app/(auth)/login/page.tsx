import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  void searchParams;
  redirect("/?auth=login");
}
