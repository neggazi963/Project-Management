import { useAuth } from "@/provider/auth-context";
import { Button } from "@base-ui/react/button";

function DashboardLayout() {
  const { user, logout } = useAuth();
  return (
    <div>
      <Button onClick={logout}>Logout</Button>
    </div>
  );
}

export default DashboardLayout;
