import { LoginButton } from "@/components/auth/LoginButton";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-muted/40">
			<Card className="w-full max-w-sm shadow-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">LifeHQ</CardTitle>
					<CardDescription>
						One place to manage subscriptions, documents, and tasks
						for your household
					</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginButton />
				</CardContent>
			</Card>
		</div>
	);
}
