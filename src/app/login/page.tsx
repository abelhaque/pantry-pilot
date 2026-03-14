import { redirect } from 'next/navigation'

// AUTH BYPASS: /login is permanently closed. Anyone who lands here gets sent home.
export default function LoginPage() {
    redirect('/')
}
