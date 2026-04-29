import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/company/messages')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company/messages"!</div>
}
