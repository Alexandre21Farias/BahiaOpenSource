import { useIsMobile } from "../../hooks/useIsMobile";
import { JobsDesktop } from "./JobsDesktop";
import { JobsMobile } from "./JobsMobile";

export function Jobs() {
  return useIsMobile() ? <JobsMobile /> : <JobsDesktop />;
}
