import {
  SignedIn,
  SignedOut,
  SignOutButton,
  UserButton,
} from "@clerk/clerk-react";

type PublicAuthControlsProps = {
  mobile: boolean;
  signIn: string;
  signOut: string;
};

export default function PublicAuthControls({
  mobile,
  signIn,
  signOut,
}: PublicAuthControlsProps) {
  return (
    <>
      <SignedOut>
        <a
          href="/sign-in"
          className={
            mobile ? "btn btn-outline justify-start" : "btn btn-outline btn-sm"
          }
        >
          {signIn}
        </a>
      </SignedOut>

      <SignedIn>
        <div className={mobile ? "px-4 py-2" : "flex items-center"}>
          <UserButton />
        </div>

        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className={
              mobile ? "btn btn-ghost justify-start" : "btn btn-ghost btn-sm"
            }
          >
            {signOut}
          </button>
        </SignOutButton>
      </SignedIn>
    </>
  );
}
