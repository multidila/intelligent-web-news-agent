export interface FilterConfig {
	keywords: string[];
	excludeKeywords: string[];
	categories: string[];
	sources: string[];
	dateFrom?: Date;
	dateTo?: Date;
}
