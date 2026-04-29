import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/company/proposals')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company/proposals"!</div>
}
