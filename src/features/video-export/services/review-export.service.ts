/**
 * Review Export Service
 * Handles assembly of collaboration review and cost info into Markdown text
 */

import type { CostRecord, CostStats } from '@/core/services/cost.service';
import type { FrameComment, StoryboardVersion } from '@/core/services/collaboration.service';
import type { EvaluationScores } from '@/core/services/evaluation.service';

const REVIEW_EXPORT_ACTIVITY_KEY = 'plotcraft_review_export_activities';

export interface ReviewExportProjectMeta {
  id: string;
  name: string;
  storyboardFrameCount: number;
}

export interface ReviewExportInput {
  project: ReviewExportProjectMeta;
  comments: FrameComment[];
  versions: StoryboardVersion[];
  costStats: CostStats;
  costRecords: CostRecord[];
  evaluationSummary?: EvaluationScores;
  generatedAt?: Date;
}

export type ReviewExportSource = 'project_edit' | 'project_detail' | 'unknown';
export type ReviewExportStatus = 'success' | 'cancelled' | 'failed';

export interface ReviewExportActivity {
  id: string;
  projectId?: string;
  projectName?: string;
  source: ReviewExportSource;
  status: ReviewExportStatus;
  fileName?: string;
  filePath?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface SaveReviewMarkdownOptions {
  projectId?: string;
  projectName?: string;
  source?: ReviewExportSource;
}

class ReviewExportService {
  private activities: ReviewExportActivity[] = [];
  private listeners: Set<(activities: ReviewExportActivity[]) => void> = new Set();

  constructor() {
    this.loadActivities();
  }

  toMarkdown(input: ReviewExportInput): string {
    const generatedAt = input.generatedAt || new Date();
    const lines: string[] = [];

    lines.push('# PlotCraft AI Review Export');
    lines.push('');
    lines.push(`- Project ID: ${input.project.id}`);
    lines.push(`- Project Name: ${input.project.name}`);
    lines.push(`- Export Time: ${generatedAt.toLocaleString()}`);
    lines.push(`- Storyboard Frame Count: ${input.project.storyboardFrameCount}`);
    lines.push(`- Comment Count: ${input.comments.length}`);
    lines.push(`- Version Count: ${input.versions.length}`);
    lines.push('');
    lines.push('## Comment Timeline');
    lines.push('');

    if (input.comments.length === 0) {
      lines.push('- No comments yet');
    } else {
      input.comments.forEach((item) => {
        lines.push(`- [${new Date(item.createdAt).toLocaleString()}] (${item.frameId}) ${item.author}: ${item.content}`);
      });
    }

    lines.push('');
    lines.push('## Storyboard Version Snapshots');
    lines.push('');

    if (input.versions.length === 0) {
      lines.push('- No version snapshots');
    } else {
      input.versions.forEach((version) => {
        const frameCount = Array.isArray(version.payload) ? version.payload.length : 0;
        lines.push(`- ${version.label} (${version.id}) | ${new Date(version.createdAt).toLocaleString()} | by ${version.createdBy} | frames: ${frameCount}`);
      });
    }

    lines.push('');
    lines.push('## Cost Summary');
    lines.push('');
    lines.push(`- Total Cost: $${input.costStats.total.toFixed(4)}`);
    lines.push(`- Today: $${input.costStats.today.toFixed(4)} | This Week: $${input.costStats.thisWeek.toFixed(4)} | This Month: $${input.costStats.thisMonth.toFixed(4)}`);
    lines.push('');
    lines.push('## Cost Records (Recent 30)');
    lines.push('');

    if (input.costRecords.length === 0) {
      lines.push('- No cost records');
    } else {
      input.costRecords.slice(0, 30).forEach((record) => {
        lines.push(`- [${new Date(record.timestamp).toLocaleString()}] ${record.type}/${record.provider}${record.model ? `/${record.model}` : ''}: $${record.cost.toFixed(4)}`);
      });
    }

    lines.push('');
    lines.push('## Evaluation Summary');
    lines.push('');
    if (input.evaluationSummary) {
      lines.push(`- Consistency: ${input.evaluationSummary.consistency.toFixed(1)}`);
      lines.push(`- Pacing: ${input.evaluationSummary.pacing.toFixed(1)}`);
      lines.push(`- Readability: ${input.evaluationSummary.readability.toFixed(1)}`);
      lines.push(`- Cost: ${input.evaluationSummary.cost.toFixed(1)}`);
      lines.push(`- Overall: ${input.evaluationSummary.overall.toFixed(1)}`);
    } else {
      lines.push('- No evaluation summary available for current project');
    }

    return lines.join('\n');
  }

  addActivity(input: Omit<ReviewExportActivity, 'id' | 'createdAt'>): ReviewExportActivity {
    const activity: ReviewExportActivity = {
      ...input,
      id: `review_export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.activities = [activity, ...this.activities].slice(0, 200);
    this.saveActivities();
    this.notify();
    return activity;
  }

  getActivities(projectId?: string): ReviewExportActivity[] {
    const list = projectId
      ? this.activities.filter(item => item.projectId === projectId)
      : this.activities;
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  subscribe(listener: (activities: ReviewExportActivity[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async saveMarkdownToFile(defaultFileName: string, content: string, options: SaveReviewMarkdownOptions = {}): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const filePath = await invoke<string>('save_file_dialog', {
        defaultPath: defaultFileName,
        filters: [{ name: 'Markdown Files', extensions: ['md'] }]
      });

      if (!filePath) {
        this.addActivity({
          projectId: options.projectId,
          projectName: options.projectName,
          source: options.source || 'unknown',
          status: 'cancelled',
          fileName: defaultFileName,
        });
        return false;
      }

      await invoke('write_text_file', {
        path: filePath,
        content
      });

      this.addActivity({
        projectId: options.projectId,
        projectName: options.projectName,
        source: options.source || 'unknown',
        status: 'success',
        fileName: this.extractFileName(filePath),
        filePath,
      });
      return true;
    } catch (error) {
      this.addActivity({
        projectId: options.projectId,
        projectName: options.projectName,
        source: options.source || 'unknown',
        status: 'failed',
        fileName: defaultFileName,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private extractFileName(path: string): string {
    const parts = path.split(/[\\\/]/);
    return parts[parts.length - 1] || path;
  }

  private notify(): void {
    const list = this.getActivities();
    this.listeners.forEach(listener => listener(list));
  }

  private saveActivities(): void {
    try {
      localStorage.setItem(REVIEW_EXPORT_ACTIVITY_KEY, JSON.stringify(this.activities));
    } catch {
      // ignore
    }
  }

  private loadActivities(): void {
    try {
      const raw = localStorage.getItem(REVIEW_EXPORT_ACTIVITY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReviewExportActivity[];
      if (Array.isArray(parsed)) {
        this.activities = parsed;
      }
    } catch {
      this.activities = [];
    }
  }
}

export const reviewExportService = new ReviewExportService();
export default ReviewExportService;
