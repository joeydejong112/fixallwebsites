export default defineNuxtRouteMiddleware(() => {
  const { isSignedIn } = useAuth()
  if (import.meta.client && !isSignedIn.value) {
    return navigateTo('/sign-in')
  }
})
