import ToolingWorkspace from "./ToolingWorkspace";

function getWorkstationUrl(): string | null {
  try {
    const value = process.env.EXTERNAL_WORKSTATION_URL;
    if (!value) return null;
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}

export default function ToolsPage() {
  return <ToolingWorkspace workstationUrl={getWorkstationUrl()} />;
}
