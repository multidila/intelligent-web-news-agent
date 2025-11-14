import { TestBed } from '@angular/core/testing';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AppComponent],
		}).compileComponents();
	});

	it('should create the root component', () => {
		const fixture = TestBed.createComponent(AppComponent);
		const component = fixture.componentInstance;
		expect(component).toBeTruthy();
	});

	it('should expose the project title', () => {
		const fixture = TestBed.createComponent(AppComponent);
		expect(fixture.componentInstance.title).toBe('intelligent-web-news-agent');
	});

	it('should render the highlights list', () => {
		const fixture = TestBed.createComponent(AppComponent);
		fixture.detectChanges();

		const compiled = fixture.nativeElement as HTMLElement;
		const highlightItems = compiled.querySelectorAll('.app-card__list li');
		expect(highlightItems.length).toBeGreaterThan(0);
	});
});
