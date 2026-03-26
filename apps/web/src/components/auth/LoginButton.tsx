"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginButton() {
	return (
		<Button
			className="w-full"
			onClick={() =>
				authClient.signIn.social({
					provider: "google",
					callbackURL: "/dashboard",
				})
			}
		>
			Sign in with Google
		</Button>
	);
}
