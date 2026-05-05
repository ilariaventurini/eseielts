export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  backoffice: '/backoffice',
  writing: '/writing',
  writingHistory: '/writing/history',
} as const

/** Path segments for nested `<Route>` elements (no leading slash). */
export const ROUTE_SEGMENTS = {
  signIn: 'sign-in',
  backoffice: 'backoffice',
  writing: 'writing',
  writingHistory: 'writing/history',
} as const

export type RouteKey = keyof typeof ROUTES
