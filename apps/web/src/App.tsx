import React, { useState } from 'react';
import { HomePage } from './pages/HomePage.js';
import { GraphPage } from './pages/GraphPage.js';

export type AppRoute = 'home' | 'graph';

export interface RouteState {
  route: AppRoute;
  graphId: string | undefined;
}

const App: React.FC = () => {
  const [routeState, setRouteState] = useState<RouteState>({ route: 'home', graphId: undefined });

  const navigate = (route: AppRoute, graphId?: string) => {
    setRouteState({ route, graphId: graphId ?? undefined });
  };

  switch (routeState.route) {
    case 'graph':
      return <GraphPage graphId={routeState.graphId} onNavigate={navigate} />;
    case 'home':
    default:
      return <HomePage onNavigate={navigate} />;
  }
};

export default App;
