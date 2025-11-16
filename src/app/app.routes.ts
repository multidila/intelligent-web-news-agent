import { Routes } from '@angular/router';

import { ConfigPanelComponent, DashboardComponent, NewsListComponent } from './components';

export const routes: Routes = [
	{ path: '', redirectTo: '/dashboard', pathMatch: 'full' },
	{ path: 'dashboard', component: DashboardComponent },
	{ path: 'news', component: NewsListComponent },
	{ path: 'config', component: ConfigPanelComponent },
	{ path: '**', redirectTo: '/dashboard' },
];
