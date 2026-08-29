import { useNavigate } from "react-router-dom";
import { HarnessMonitor } from "../components/HarnessMonitor";

export function HarnessPage() {
  const navigate = useNavigate();
  return <HarnessMonitor onBack={() => navigate(-1)} />;
}
