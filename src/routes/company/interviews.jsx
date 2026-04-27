import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/company/interviews')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/company/interviews"!</div>
}
