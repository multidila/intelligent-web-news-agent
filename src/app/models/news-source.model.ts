export interface NewsSource {
	id: string;
	name: string;
	url: string;
	type: 'rss' | 'http';
	enabled: boolean;
	lastChecked?: Date;
	lastModified?: number;
}
