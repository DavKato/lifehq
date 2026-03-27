// Root route is handled by middleware — this page should never render.
import { redirect } from "next/navigation";

export default function RootPage() {
	redirect("/login");
}
