import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
	public readonly title = 'intelligent-web-news-agent';
	public readonly status = signal('Operating in real-time mode');
	public readonly highlights = [
		'Aggregating feeds and RSS channels',
		'Semantic news classification',
		'Flexible filters and alerts',
	];
}
