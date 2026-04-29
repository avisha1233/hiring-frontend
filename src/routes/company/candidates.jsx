import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/company/candidates')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company/candidates"!</div>
}
