export interface NewsItem {
	id: string;
	title: string;
	description: string;
	link: string;
	pubDate: Date;
	source: string;
	category?: string;
	keywords: string[];
	content?: string;
	isRead: boolean;
	relevanceScore: number;
}
