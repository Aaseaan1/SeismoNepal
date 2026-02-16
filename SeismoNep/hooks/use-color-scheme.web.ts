/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  // On web, just return 'light' mode
  // In a real app, you could check window.matchMedia('(prefers-color-scheme: dark)').matches
  return 'light';
}
