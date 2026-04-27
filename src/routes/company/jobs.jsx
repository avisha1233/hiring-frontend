import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/company/jobs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company/jobs"!</div>
}
