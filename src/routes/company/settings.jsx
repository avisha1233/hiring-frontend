import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/company/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company/settings"!</div>
}
