import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/company/submissions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company/submissions"!</div>
}
