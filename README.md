# Intelligent Web News Agent

An intelligent news monitoring system based on web agents.

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Available Commands](#available-commands)
- [How the Application Works](#how-the-application-works)

## Description

Intelligent Web News Agent is an Angular application for automatic monitoring and filtering of news from various sources. The system uses the concept of intelligent agents to collect, analyze, and present news information to users.

### Main Capabilities:

- RSS news feed monitoring
- Website change tracking (HTTP monitoring)
- Intelligent filtering by keywords
- News relevance scoring system
- Automatic keyword extraction
- Settings and news storage in LocalStorage
- Automatic updates with configurable intervals

## Features

### 1. Dashboard (Control Panel)
- Display monitoring statistics
- Control monitoring process (Start/Stop)
- Manual news refresh
- Clear all news

### 2. News Feed
- View filtered news
- Sort by relevance or date
- Filter unread news
- Automatic marking as read
- Display keywords and relevance rating

### 3. Configuration
- Manage news sources (RSS/HTTP)
- Configure filters (keywords, exclude keywords)
- Configure categories and sources
- Check interval and maximum number of news items
- Export/import configuration
- Reset to default settings

## Installation

### Prerequisites

- Node.js version 20.x or higher
- npm version 10.x or higher

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd intelligent-web-news-agent
```

2. Install dependencies:
```bash
npm install
```

3. Run the application in development mode:
```bash
npm start
```

4. Open your browser at: `http://localhost:4200`

## Available Commands

### Development

#### `npm start`
Starts the development server at `http://localhost:4200`.

```bash
npm start
```

---

#### `npm run start:dev`
Starts the dev server with explicit development configuration.

```bash
npm run start:dev
```

---

#### `npm run start:prod`
Starts the dev server with production configuration (for testing production build locally).

```bash
npm run start:prod
```

---

### Build

#### `npm run build`
Creates a production build of the project.

```bash
npm run build
```

---

#### `npm run build:dev`
Creates a development build without optimizations (faster, with source maps).

```bash
npm run build:dev
```

---

#### `npm run build:prod`
Creates an optimized production build with additional optimizations (equivalent to `npm run build`).

```bash
npm run build:prod
```

---

### Testing and Code Quality

#### `npm test`
Runs unit tests using Jest.

```bash
npm test
```

---

#### `npm run test:watch`
Runs tests in watch mode (automatic restart on changes).

```bash
npm run test:watch
```

---

#### `npm run test:ci`
Runs tests in CI mode (single run, no watch).

```bash
npm run test:ci
```

---

#### `npm run test:coverage`
Generates a code coverage report.

```bash
npm run test:coverage
```

---

#### `npm run lint`
Checks code against ESLint standards.

```bash
npm run lint
```

---

#### `npm run lint:fix`
Automatically fixes linting errors that can be fixed automatically.

```bash
npm run lint:fix
```

---

#### `npm run format`
Formats code using Prettier.

```bash
npm run format
```

---

#### `npm run format:check`
Checks if code formatting matches Prettier rules (without modifying files).

```bash
npm run format:check
```

---

## How the Application Works

### 1. Getting Started

When you first launch the application, it automatically loads with default news sources including BBC News and TechCrunch. The app is ready to use immediately, but you can customize sources and filters to match your interests.

### 2. Starting News Monitoring

To begin monitoring news:

1. Navigate to the Dashboard
2. Click the "Start Monitoring" button
3. The application will immediately start fetching news from all enabled sources
4. You'll see the monitoring status change to "Active" with a green indicator
5. The system will automatically refresh news at the configured interval (default: every 15 minutes)

### 3. Viewing Your News Feed

Once monitoring starts, news articles begin appearing in the News Feed:

1. Click on "News" in the navigation menu
2. Browse through filtered news articles that match your interests
3. Each article displays:
   - A relevance score (indicated by stars)
   - The source and category
   - How long ago it was published
   - Key topics automatically extracted from the content
4. Click on any article to open it in a new browser tab
5. Articles are automatically marked as read once you click them

### 4. Sorting and Filtering

Customize how you view news:

- Use the "Sort by" dropdown to organize articles:
  - By Relevance: Shows the most relevant articles first
  - By Date: Shows the newest articles first
- Toggle "Unread Only" to show only articles you haven't read yet
- The relevance score is color-coded for quick scanning:
  - Green (High): Very relevant to your interests
  - Yellow (Medium): Moderately relevant
  - Blue (Low): Lower relevance

### 5. Customizing Your News Sources

Add or remove news sources to personalize your feed:

1. Go to the Configuration panel
2. In the "News Sources" section, you'll see all available sources
3. Use checkboxes to enable or disable sources
4. To add a new source:
   - Click "+ Add Source"
   - Enter the source name and RSS feed URL
   - Select the source type (RSS or HTTP)
   - Click "Add"
5. To remove a source, click the delete icon next to it

### 6. Setting Up Keyword Filters

Fine-tune which articles appear based on your interests:

**Include Keywords:**
1. In the Configuration panel, find "Filter Keywords (Include)"
2. Type a keyword that interests you (e.g., "technology", "climate", "AI")
3. Click "Add"
4. Articles containing these keywords will receive higher relevance scores

**Exclude Keywords:**
1. Find "Exclude Keywords" in the Configuration panel
2. Enter words for topics you want to avoid (e.g., "sports", "celebrity")
3. Click "Add"
4. Articles containing these words will be filtered out completely

### 7. Adjusting Update Settings

Control how often and how much news you receive:

1. In the Configuration panel, locate the "Settings" section
2. Adjust the "Check Interval" to set how often the app fetches new articles (in minutes)
3. Set "Max News Items" to limit how many articles are stored
4. Toggle "Auto Refresh" on or off to control automatic updates

### 8. Managing Your News Collection

Keep your news feed organized:

- Click "Refresh Now" on the Dashboard to manually fetch the latest news
- Click "Clear All News" to remove all stored articles and start fresh
- Use "Stop Monitoring" to pause automatic updates (you can still manually refresh)

### 9. Saving and Sharing Your Configuration

Your settings are automatically saved and will persist between sessions. You can also:

1. Click "Export Config" to download your current settings as a file
2. Share this configuration file with others or use it as a backup
3. Click "Reset to Defaults" to restore the original settings

### 10. Understanding the Dashboard

The Dashboard provides a quick overview of your monitoring activity:

- Total news articles collected
- Number of articles after filtering
- Number of errors encountered
- How many sources were checked
- When the last update occurred
- Current monitoring status

### 11. Navigation

The application has three main sections accessible from the top navigation:

1. **Dashboard** - Your home page with statistics and controls
2. **News** - The news feed where you read articles
3. **Config** - Settings for customizing sources and filters

## Extending Functionality

### Adding a New RSS Source

1. Open the Configuration Panel
2. In the "News Sources" section, click "+ Add Source"
3. Fill out the form:
   - **Name:** Source name (e.g., "The Guardian")
   - **URL:** RSS feed (e.g., "https://www.theguardian.com/world/rss")
   - **Type:** Select "RSS"
4. Click "Add Source"
5. The source will automatically activate and appear in the list

### Configuring Filters

#### Include Keywords
Add keywords that increase relevance:

1. In the "Add keyword" field, enter a word (e.g., "AI")
2. Click "Add"
3. News with this word will receive +2 to their rating

**Recommendations:**
- Use specific terms (not general words)
- Use English for international feeds
- 3-7 keywords is optimal

#### Exclude Keywords
Add words to filter out unwanted content:

1. In the "Add exclude keyword" field, enter a word
2. Click "Add"
3. News with this word will be rejected (score = -1)

**Examples:**
- "advertisement", "sponsored", "promoted" - ads
- "horoscope", "astrology" - astrology
- "gossip", "celebrity" - celebrity news

### Configuring Auto-Update

1. Open the Configuration Panel
2. In the "Settings" section:
   - **Check Interval:** Enter interval in minutes (5-60 recommended)
   - **Max News Items:** Maximum news to store (50-200)
   - **Auto Refresh:** Enable/disable automatic updates
3. Changes apply automatically

### Export/Import Configuration

**Export:**
1. Click "Export Config"
2. The file `web-agent-config.json` will download
3. Save as backup or for sharing

**Import:**
1. Prepare a JSON file with configuration
2. Use LocalStorage or code:
```javascript
// In browser console
const config = {/* your configuration */}
localStorage.setItem('web-agent-config', JSON.stringify(config))
location.reload()
```
