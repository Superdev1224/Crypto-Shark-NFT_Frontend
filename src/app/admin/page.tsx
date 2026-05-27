import { AdminPanel } from "@/components/AdminPanel";

export const metadata = {
  title: "Admin · Crypto Sharks",
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <AdminPanel />
    </div>
  );
}
