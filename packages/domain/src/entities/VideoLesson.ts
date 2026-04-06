export interface VideoLessonProps {
  id: string;
  categoryId: string;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  xpReward: number;
  sortOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
}

export class VideoLesson {
  constructor(private readonly props: VideoLessonProps) {}

  get id() { return this.props.id; }
  get categoryId() { return this.props.categoryId; }
  get youtubeVideoId() { return this.props.youtubeVideoId; }
  get title() { return this.props.title; }
  get description() { return this.props.description; }
  get thumbnailUrl() { return this.props.thumbnailUrl; }
  get durationSeconds() { return this.props.durationSeconds; }
  get xpReward() { return this.props.xpReward; }

  get durationFormatted(): string {
    if (!this.props.durationSeconds) return '--:--';
    const min = Math.floor(this.props.durationSeconds / 60);
    const sec = this.props.durationSeconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  get embedUrl(): string {
    return `https://www.youtube.com/embed/${this.props.youtubeVideoId}`;
  }

  toJSON(): VideoLessonProps {
    return { ...this.props };
  }
}
