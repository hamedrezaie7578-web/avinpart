import type { DefaultSession } from "next-auth";

type AppUserFields = {
  type: "CUSTOMER" | "ADMIN";
  mobile: string;
  permissions: string[];
};

declare module "next-auth" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- افزودن فیلدها به User از طریق declaration merging
  interface User extends AppUserFields {}
  interface Session {
    user: AppUserFields & { id: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT extends AppUserFields {
    uid: string;
  }
}
