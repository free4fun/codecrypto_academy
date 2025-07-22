import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export function NodeStatus() {
  const [alive, setAlive] = useState<boolean | null>(null);
  useEffect(() => {
    const checkNode = async () => {
      try {
        const res = await fetch("http://localhost:3333/api/isAlive");
        const data = await res.json();
        setAlive(data.alive);
      } catch (err) {
        setAlive(false);
      }
    };
    checkNode();
    const interval = setInterval(checkNode, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {alive === null ? (
        <span className="text-gray-500 text-sm">Checking...</span>
      ) : alive ? (
        <CheckCircle className="text-green-500 w-5 h-5" />
      ) : (
        <XCircle className="text-red-500 w-5 h-5" />
      )}
      <span className="text-sm text-muted-foreground">
        {alive === null ? "Checking node..." : alive ? "Node online" : "Node offline"}
      </span>
    </div>
  );
}
