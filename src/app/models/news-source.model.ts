export interface NewsSource {
	id: string;
	name: string;
	url: string;
	type: 'rss';
	enabled: boolean;
	lastChecked?: Date;
}
