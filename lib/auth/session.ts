import { auth, currentUser } from "@clerk/nextjs/server";

export async function getAuthenticatedEmail() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;

  return email?.toLowerCase() ?? null;
}
