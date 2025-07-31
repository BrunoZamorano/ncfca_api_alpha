export class Training {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly youtubeUrl: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validateYoutubeUrl(youtubeUrl);
  }

  private validateYoutubeUrl(url: string): void {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      throw new Error('Invalid YouTube URL');
    }
  }

  static create(id: string, title: string, description: string, youtubeUrl: string): Training {
    return new Training(id, title, description, youtubeUrl, new Date(), new Date());
  }

  update(title: string, description: string, youtubeUrl: string): Training {
    return new Training(this.id, title, description, youtubeUrl, this.createdAt, new Date());
  }
}
