import { redirect } from "next/navigation"
import { findCurrentUser } from "@/current-user"
import { RegisterForm } from "./RegisterForm"
import { PageWrapper } from "@/app/components/PageWrapper"

export default async function RegisterPage() {
  if (await findCurrentUser()) {
    redirect("/my-world")
  }

  return (
    <PageWrapper>
      <h1 className="text-xl font-semibold">Registrati</h1>
      <RegisterForm />
    </PageWrapper>
  )
}
