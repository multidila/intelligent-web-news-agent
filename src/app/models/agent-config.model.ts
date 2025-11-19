import { FilterConfig } from './filter-config.model';
import { NewsSource } from './news-source.model';

export interface AgentConfig {
	sources: NewsSource[];
	filters: FilterConfig;
	checkInterval: number;
	maxNewsItems: number;
	autoRefresh: boolean;
	stopWords: string[];
	retryDelay: number;
	requestDelay: number;
	maxRetries: number;
}
