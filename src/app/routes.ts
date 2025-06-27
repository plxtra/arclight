import { Routes } from '@angular/router';
import { AuthenticationGuard } from './services/authentication-guard.service';

export const routes: Routes = [
  // default
  { path: '', redirectTo: 'landing', pathMatch: 'full', },
  // outside
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.page').then(c => c.LandingPageComponent),
    data: { showMenu: false },
  },
  {
    path: 'auth-callback',
    loadComponent: () => import('./pages/auth-callback/auth-callback.page').then(c => c.AuthCallbackPageComponent),
    data: { showMenu: false },
  },
  {
    path: 'signout',
    loadComponent: () => import('./pages/signout/signout.page').then(c => c.SignoutPageComponent),
    data: { showMenu: false },
  },
  // general pages
  {
    path: 'stocks',
    loadComponent: () => import('./pages/stocks/stocks.page').then(c => c.StocksPageComponent),
    canActivate: [AuthenticationGuard],
  },
  {
    path: 'stocks/stock-detail/:id',
    loadComponent: () => import('./pages/stocks/stock-detail/stock-detail.page').then(c => c.StockDetailPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'general',
      },
      {
        path: 'general',
        loadComponent: () => import('./pages/stocks/stock-detail/stock-general/stock-general.page').then(c => c.StockGeneralPageComponent),
        canActivate: [AuthenticationGuard]
      },
      {
        path: 'chart',
        loadComponent: () => import('./pages/stocks/stock-detail/stock-chart/stock-chart.page').then(c => c.StockChartPageComponent),
        canActivate: [AuthenticationGuard]
      },
      {
        path: 'depth',
        loadComponent: () => import('./pages/stocks/stock-detail/stock-depth/stock-depth.page').then(c => c.StockDepthPageComponent),
        canActivate: [AuthenticationGuard]
      },
      {
        path: 'depthshort',
        loadComponent: () => import('./pages/stocks/stock-detail/stock-depth-short/stock-depth-short.page').then(c => c.StockDepthShortPageComponent),
        canActivate: [AuthenticationGuard]
      },
      {
        path: 'trades',
        loadComponent: () => import('./pages/stocks/stock-detail/stock-trades/stock-trades.page').then(c => c.StockTradesPageComponent),
        canActivate: [AuthenticationGuard]
      },
    ],
  },
  {
    path: 'accounts',
    loadComponent: () => import('./pages/accounts/accounts.page').then(c => c.AccountsPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'accounts/account-detail/:id',
    loadComponent: () => import('./pages/accounts/account-detail/account-detail.page').then(c => c.AccountDetailPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.page').then(c => c.OrdersPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'orders/order-detail/:account/:id',
    loadComponent: () => import('./pages/orders/order-detail/order-detail.page').then(c => c.OrderDetailPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'scans',
    loadComponent: () => import('./pages/scans/scans.page').then(c => c.ScansPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'scans/scan-detail/:id',
    loadComponent: () => import('./pages/scans/scan-detail/scan-detail.page').then(c => c.ScanDetailPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(c => c.SettingsPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'status',
    loadComponent: () => import('./pages/status/status.page').then(c => c.StatusPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.page').then(c => c.AboutPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications.page').then(c => c.NotificationsPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'notifications/notification-detail/:id',
    loadComponent: () => import('./pages/notifications/notification-detail/notification-detail.page').then(c => c.NotificationDetailPageComponent),
    canActivate: [AuthenticationGuard]
  },
  // popus
  {
    path: 'popup/symbol-search',
    loadComponent: () => import('./shared/modal/symbol-search/symbol-search.page').then(c => c.SymbolSearchPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'popup/new-order',
    loadComponent: () => import('./shared/modal/order-pad/new-order/new-order.page').then(c => c.NewOrderPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'popup/amend-order',
    loadComponent: () => import('./shared/modal/order-pad/amend-order/amend-order.page').then(c => c.AmendOrderPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'popup/cancel-order',
    loadComponent: () => import('./shared/modal/order-pad/cancel-order/cancel-order.page').then(c => c.CancelOrderPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'popup/account-search',
    loadComponent: () => import('./shared/modal/account-search/account-search.page').then(c => c.AccountSearchPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'popup/open-orders',
    loadComponent: () => import('./shared/modal/open-orders/open-orders.page').then(c => c.OpenOrdersPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'popup/alter-scan',
    loadComponent: () => import('./shared/modal/alter-scan/alter-scan.page').then(c => c.AlterScanPageComponent),
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'popup/alter-notification',
    loadComponent: () => import('./shared/modal/alter-notification/alter-notification.page').then( m => m.AlterNotificationPageComponent),
    canActivate: [AuthenticationGuard]
  },
  // Error pages
  {
    path: 'restricted',
    loadComponent: () => import('./pages/restricted/restricted.page').then(c => c.RestrictedPageComponent),
    data: { showMenu: false },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/notfound/notfound.page').then(c => c.NotfoundPageComponent),
    data: { showMenu: false },
  },

];
