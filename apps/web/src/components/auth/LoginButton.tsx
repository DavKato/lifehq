"use client";

import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginButton() {
	return (
		<Button
			className="w-full gap-2"
			onClick={() =>
				authClient.signIn.social({
					provider: "google",
					callbackURL: "/dashboard",
				})
			}
		>
			<GoogleIcon className="h-4 w-4" />
			Sign in with Google
		</Button>
	);
}
