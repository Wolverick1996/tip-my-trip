import { RegisterForm } from "./RegisterForm"
import { PageWrapper } from "@/app/components/PageWrapper"

export default function RegisterPage() {
  return (
    <PageWrapper>
      <h1 className="text-xl font-semibold">Registrati</h1>
      <RegisterForm />
    </PageWrapper>
  )
}
