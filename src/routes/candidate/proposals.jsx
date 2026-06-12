import { createFileRoute } from "@tanstack/react-router";
import CandidateProposals from "@/pages/candidate/Proposals";

export const Route = createFileRoute("/candidate/proposals")({
  component: CandidateProposals,
});
